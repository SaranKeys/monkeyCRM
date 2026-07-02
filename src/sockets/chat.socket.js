
import * as chatService from '../services/chat.service.js';

export const setupChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected to socket: ${socket.id}`);

        socket.on('join_project_room', (projectId) => {
            socket.join(projectId);
            console.log(`User joined project room: ${projectId}`);
        });

        socket.on('send_message', async (data) => {
            const { projectId, senderId, text } = data;

            try {
                const savedMessage = await chatService.saveMessage(projectId, senderId, text);

                console.log(`New chat in room ${projectId}: "${text}"`);

                io.to(projectId).emit('receive_message', savedMessage);
                
            } catch (error) {
                console.error("[Socket Message Error]:", error);
            }
        });

        socket.on('leave_project_room', (projectId) => {
            socket.leave(projectId);
            console.log(`User left project room: ${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};