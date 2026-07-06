import dotenv from 'dotenv';
dotenv.config();

import http from 'http'; 
import { Server } from 'socket.io'; 
import { setupChatSocket } from './sockets/chat.socket.js'; 

import app from './app.js';
import prisma from './config/prisma.js';
import { logger } from './utils/logger.js';
import cors from "cors"

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        await prisma.$connect();
        logger.db('🔌 MongoDB connection established successfully via Prisma.');

        const httpServer = http.createServer(app);

        const io = new Server(httpServer, {
            cors: {
                origin: "*",  
                methods: ["GET", "POST"]
            }
        });

        setupChatSocket(io);

       const server = httpServer.listen(PORT, "0.0.0.0", () => {
            logger.success(`🚀 monkeyCRM Server & WebSockets live on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });

        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        logger.error('💥 Failed to connect to the database:');
        console.error(error);
        process.exit(1);
    }
}

startServer();