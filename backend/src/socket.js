
let io; // Declare a variable to hold the Socket.IO server instance

const initSocket = (httpServer) => {
    // If io is already initialized, return it
    if (io) {
        return io;
    }

    io = require('socket.io')(httpServer, {
        cors: {
            origin: ['https://www.thenobiasmedia.com','http://localhost:3000'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        }
    });

    io.on('connection', (socket) => {
        
        console.log('A user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

        // You can add more general socket event listeners here
        // e.g., for chat, notifications, etc.
    });

    console.log('Socket.IO initialized.');
    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket first.');
    }
    return io;
};

module.exports = {
    initSocket,
    getIo
};