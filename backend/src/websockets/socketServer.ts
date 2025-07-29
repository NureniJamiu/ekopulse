import { Server as SocketIOServer, Socket } from 'socket.io';

export const initializeSocketServer = (io: SocketIOServer): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔗 User connected: ${socket.id}`);

    // Join user to a room based on their role (if provided)
    socket.on('join_room', (data: { role: string }) => {
      if (data.role === 'authority') {
        socket.join('authorities');
        console.log(`👮 Authority joined: ${socket.id}`);
      } else {
        socket.join('citizens');
        console.log(`👤 Citizen joined: ${socket.id}`);
      }
    });

    // Handle issue status updates for real-time notifications
    socket.on('subscribe_to_issue', (issueId: string) => {
      socket.join(`issue_${issueId}`);
      console.log(`📍 User ${socket.id} subscribed to issue ${issueId}`);
    });

    socket.on('unsubscribe_from_issue', (issueId: string) => {
      socket.leave(`issue_${issueId}`);
      console.log(`📍 User ${socket.id} unsubscribed from issue ${issueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  // Global events for broadcasting
  io.emitNewIssue = (issue: any) => {
    // Notify all authorities and agency admins
    io.to('authorities').emit('new_issue', issue);
    io.to('agency_admins').emit('new_issue', issue);

    // If issue is assigned to an agency, notify that agency specifically
    if (issue.assignedAgency) {
      io.to(`agency_${issue.assignedAgency._id || issue.assignedAgency}`).emit('issue_assigned', issue);
    }

    // Broadcast map update to all users
    io.emit('map_update', { type: 'new_issue', data: issue });
  };

  io.emitIssueUpdate = (issue: any) => {
    // Notify subscribers of this specific issue
    io.to(`issue_${issue._id}`).emit('issue_status_updated', issue);

    // Notify the reporter
    if (issue.reportedBy && issue.reportedBy._id) {
      io.to(`user_${issue.reportedBy._id}`).emit('issue_updated', issue);
    }

    // Notify the assigned agency
    if (issue.assignedAgency) {
      io.to(`agency_${issue.assignedAgency._id || issue.assignedAgency}`).emit('issue_updated', issue);
    }

    // Broadcast map update to all users
    io.emit('map_update', { type: 'issue_updated', data: issue });
  };

  io.emitNotification = (notification: any) => {
    if (notification.recipientType === 'user') {
      io.to(`user_${notification.recipientId}`).emit('notification', notification);
    } else if (notification.recipientType === 'agency') {
      io.to(`agency_${notification.recipientId}`).emit('notification', notification);
    }
  };
};

// Extend Socket.IO server interface
declare module 'socket.io' {
  interface Server {
    emitNewIssue(issue: any): void;
    emitIssueUpdate(issue: any): void;
    emitNotification(notification: any): void;
  }
}
