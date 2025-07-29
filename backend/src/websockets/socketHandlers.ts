import { Socket } from 'socket.io';

export const handleConnection = (socket: Socket): void => {
  console.log(`🔗 User connected: ${socket.id}`);

  // Handle joining rooms based on user role and agency
  socket.on('join_room', (data: { role: string; userId?: string; agencyId?: string }) => {
    const { role, userId, agencyId } = data;

    // Join role-based rooms
    if (role === 'authority') {
      socket.join('authorities');
      console.log(`👮 Authority joined: ${socket.id}`);
    } else if (role === 'agency_admin') {
      socket.join('agency_admins');
      console.log(`🏢 Agency admin joined: ${socket.id}`);

      // Join agency-specific room if agencyId is provided
      if (agencyId) {
        socket.join(`agency_${agencyId}`);
        console.log(`🏢 Agency admin joined agency room: ${agencyId}`);
      }
    } else {
      socket.join('citizens');
      console.log(`👤 Citizen joined: ${socket.id}`);
    }

    // Join user-specific room for personal notifications
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User joined personal room: ${userId}`);
    }
  });

  // Handle issue-specific subscriptions
  socket.on('subscribe_to_issue', (issueId: string) => {
    socket.join(`issue_${issueId}`);
    console.log(`📍 User ${socket.id} subscribed to issue ${issueId}`);
  });

  socket.on('unsubscribe_from_issue', (issueId: string) => {
    socket.leave(`issue_${issueId}`);
    console.log(`📍 User ${socket.id} unsubscribed from issue ${issueId}`);
  });

  // Handle agency-specific subscriptions
  socket.on('subscribe_to_agency', (agencyId: string) => {
    socket.join(`agency_${agencyId}`);
    console.log(`🏢 User ${socket.id} subscribed to agency ${agencyId}`);
  });

  socket.on('unsubscribe_from_agency', (agencyId: string) => {
    socket.leave(`agency_${agencyId}`);
    console.log(`🏢 User ${socket.id} unsubscribed from agency ${agencyId}`);
  });

  // Handle location-based subscriptions for map updates
  socket.on('subscribe_to_location', (bounds: { north: number; south: number; east: number; west: number }) => {
    socket.join('location_updates');
    console.log(`🗺️ User ${socket.id} subscribed to location updates`);
  });

  // Handle notification acknowledgments
  socket.on('notification_read', (notificationId: string) => {
    console.log(`📬 User ${socket.id} marked notification as read: ${notificationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
};
