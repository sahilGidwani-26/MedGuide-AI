const initSocket = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user's personal room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      onlineUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} joined`);

      // Emit online status
      io.emit('user_online', { userId, onlineCount: onlineUsers.size });
    });

    // Emergency SOS event
    socket.on('emergency_sos', (data) => {
      console.log(`🚨 Emergency SOS from user: ${data.userId}`);
      // Broadcast to admin room
      io.to('admin_room').emit('emergency_alert', {
        userId: data.userId,
        location: data.location,
        message: data.message || 'User triggered emergency SOS',
        timestamp: new Date()
      });
      // Confirm to user
      socket.emit('sos_confirmed', { message: 'Emergency services notified. Help is on the way.' });
    });

    // Real-time location update
    socket.on('location_update', (data) => {
      socket.broadcast.to('admin_room').emit('user_location_update', data);
    });

    // Admin joins admin room
    socket.on('join_admin', (adminId) => {
      socket.join('admin_room');
      console.log(`👑 Admin ${adminId} joined admin room`);
    });

    // Typing indicator for chat
    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', data);
    });

    // Doctor availability update
    socket.on('doctor_status_change', (data) => {
      io.emit('doctor_availability', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Find and remove user from online map
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
          break;
        }
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => socket.emit('pong'));
  });

  return io;
};

module.exports = initSocket;
