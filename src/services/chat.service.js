import prisma from '../config/prisma.js';

export const saveMessage = async (projectId, senderId, text) => {
    return await prisma.chatMessage.create({
        data: { projectId, senderId, text },
        include: {
            sender: {
                select: {
                    id: true,
                    legalName: true,
                    profilePhotoUrl: true,
                    designation: true  
                }
            }
        }
    });
};

export const getProjectChatHistory = async (projectId, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;

    const messages = await prisma.chatMessage.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }, 
        skip,
        take: limit,
        include: {
            sender: {
                select: {
                    id: true,
                    legalName: true,
                    profilePhotoUrl: true,
                    designation: true
                }
            }
        }
    });

    return messages.reverse(); 
};

export const getChatCount = async (projectId) => {
    return await prisma.chatMessage.count({ where: { projectId } });
};