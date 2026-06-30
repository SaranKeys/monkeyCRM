import prisma from '../config/prisma.js';

export const createServiceTemplate = async (data) => {
    return await prisma.serviceTemplate.create({
        data: {
            name: data.name,
            icon: data.icon,
            page2Fields: data.page2Fields
        }
    });
};

export const getActiveServices = async () => {
    return await prisma.serviceTemplate.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            icon: true,
            page2Fields: true  
        },
        orderBy: { createdAt: 'desc' } 
    });
};