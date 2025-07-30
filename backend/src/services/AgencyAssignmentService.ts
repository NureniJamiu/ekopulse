import Agency, { IAgency, AgencyType } from '../models/Agency';
import IssueReport, { IIssueReport, IssueType } from '../models/IssueReport';
import Notification from '../models/Notification';
import { Server as SocketIOServer } from 'socket.io';

export interface AssignmentResult {
  success: boolean;
  agency?: IAgency;
  reason?: string;
  autoAssigned: boolean;
}

export class AgencyAssignmentService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Auto-assign an issue to the most appropriate agency
   */
  async autoAssignIssue(issue: IIssueReport): Promise<AssignmentResult> {
    try {
      console.log('[AgencyAssignmentService] Starting auto-assignment for issue:', {
        id: issue._id,
        type: issue.type,
        location: issue.location
      });

      const suitableAgencies = await this.findSuitableAgencies(issue);

      if (suitableAgencies.length === 0) {
        console.log('[AgencyAssignmentService] No suitable agencies found');
        return {
          success: false,
          reason: 'No suitable agency found for this issue',
          autoAssigned: false
        };
      }

      // Select the best agency based on priority and other factors
      const selectedAgency = this.selectBestAgency(suitableAgencies, issue);
      console.log('[AgencyAssignmentService] Selected agency:', selectedAgency.name);

      // Assign the issue to the selected agency
      const updatedIssue = await IssueReport.findByIdAndUpdate(
        issue._id,
        {
          assignedAgency: selectedAgency._id,
          assignedAt: new Date(),
          autoAssigned: true
          // Keep status as 'reported' - only change when agency actively starts working
        },
        { new: true }
      ).populate('assignedAgency reportedBy');

      if (!updatedIssue) {
        console.log('[AgencyAssignmentService] Failed to update issue assignment');
        return {
          success: false,
          reason: 'Failed to update issue assignment',
          autoAssigned: false
        };
      }

      console.log('[AgencyAssignmentService] Issue successfully assigned to agency');

      // Create notification for the agency
      await this.createAgencyNotification(selectedAgency, updatedIssue);

      // Emit real-time update
      this.io.to(`agency_${selectedAgency._id}`).emit('issue_assigned', updatedIssue);
      this.io.to(`issue_${issue._id}`).emit('issue_updated', updatedIssue);

      return {
        success: true,
        agency: selectedAgency,
        autoAssigned: true
      };
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return {
        success: false,
        reason: 'Internal server error during assignment',
        autoAssigned: false
      };
    }
  }

  /**
   * Find agencies suitable for handling the given issue
   */
  private async findSuitableAgencies(issue: IIssueReport): Promise<IAgency[]> {
    const query: any = {
      isActive: true,
      issueTypes: { $in: [issue.type] }
    };

    // Check if the issue location falls within any agency's service area
    if (issue.location && issue.location.coordinates) {
      query.$or = [
        {
          serviceAreas: {
            $geoIntersects: {
              $geometry: {
                type: 'Point',
                coordinates: issue.location.coordinates
              }
            }
          }
        },
        {
          serviceAreas: { $size: 0 } // Agencies with empty service area array (cover all)
        },
        {
          serviceAreas: { $exists: false } // Agencies with no serviceAreas field (cover all)
        },
        {
          serviceAreas: null // Agencies with null serviceAreas (cover all)
        }
      ];
    }

    console.log('[AgencyAssignmentService] Query for finding suitable agencies:', JSON.stringify(query, null, 2));

    const agencies = await Agency.find(query).sort({ priority: 1 });
    console.log('[AgencyAssignmentService] Found suitable agencies:', agencies.length, agencies.map(a => a.name));

    return agencies;
  }

  /**
   * Select the best agency from suitable candidates
   */
  private selectBestAgency(agencies: IAgency[], issue: IIssueReport): IAgency {
    // For now, select based on priority
    // Future: Consider workload, response time, specialization, etc.
    return agencies.sort((a, b) => {
      // Primary sort: priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Secondary sort: specialization match
      const aSpecialized = this.getSpecializationScore(a, issue.type);
      const bSpecialized = this.getSpecializationScore(b, issue.type);

      return bSpecialized - aSpecialized;
    })[0];
  }

  /**
   * Calculate specialization score for an agency handling a specific issue type
   */
  private getSpecializationScore(agency: IAgency, issueType: IssueType): number {
    const typeMapping: Record<IssueType, AgencyType[]> = {
      waste: ['waste_management'],
      drainage: ['water_authority', 'public_works'],
      pollution: ['environmental_protection'],
      other: ['general', 'public_works']
    };

    const preferredTypes = typeMapping[issueType] || [];
    return preferredTypes.includes(agency.type) ? 2 : 1;
  }

  /**
   * Create notification for agency when issue is assigned
   */
  private async createAgencyNotification(agency: IAgency, issue: IIssueReport): Promise<void> {
    try {
      const notification = new Notification({
        title: 'New Issue Assigned',
        message: `A new ${issue.type} issue has been assigned to your agency: "${issue.title}"`,
        type: 'issue_assigned',
        recipientType: 'agency',
        recipientId: agency._id,
        relatedIssue: issue._id,
        relatedAgency: agency._id,
        data: {
          issueId: issue._id,
          issueType: issue.type,
          location: issue.location,
          priority: issue.priority
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await notification.save();
    } catch (error) {
      console.error('Error creating agency notification:', error);
    }
  }

  /**
   * Manually assign issue to a specific agency
   */
  async manualAssignIssue(issueId: string, agencyId: string, assignedBy: string): Promise<AssignmentResult> {
    try {
      const agency = await Agency.findById(agencyId);
      if (!agency || !agency.isActive) {
        return {
          success: false,
          reason: 'Agency not found or inactive',
          autoAssigned: false
        };
      }

      const updatedIssue = await IssueReport.findByIdAndUpdate(
        issueId,
        {
          assignedAgency: agencyId,
          assignedAt: new Date(),
          autoAssigned: false
          // Keep status as 'reported' - only change when agency actively starts working
        },
        { new: true }
      ).populate('assignedAgency reportedBy');

      if (!updatedIssue) {
        return {
          success: false,
          reason: 'Issue not found',
          autoAssigned: false
        };
      }

      // Create notification for the agency
      await this.createAgencyNotification(agency, updatedIssue);

      // Emit real-time update
      this.io.to(`agency_${agency._id}`).emit('issue_assigned', updatedIssue);
      this.io.to(`issue_${issueId}`).emit('issue_updated', updatedIssue);

      return {
        success: true,
        agency,
        autoAssigned: false
      };
    } catch (error) {
      console.error('Error in manual assignment:', error);
      return {
        success: false,
        reason: 'Internal server error during assignment',
        autoAssigned: false
      };
    }
  }

  /**
   * Get agency workload statistics
   */
  async getAgencyWorkload(agencyId: string) {
    const stats = await IssueReport.aggregate([
      { $match: { assignedAgency: agencyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);
  }
}

export default AgencyAssignmentService;
