import prisma from '../config/prisma.js';

export const createUpdate = async (data, authorId) => {
    return await prisma.projectUpdate.create({
        data: { ...data, authorId },
        include: { author: { select: { id: true, role: true, employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } } }
    });
};

export const getProjectUpdates = async (projectId, userRole) => {
    const whereClause = userRole === 'CLIENT' 
        ? { projectId, clientView: true } 
        : { projectId };

    return await prisma.projectUpdate.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { id: true, role: true, employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } },
            assignedApprover: { select: { id: true, legalName: true } },
            replies: {
                orderBy: { createdAt: 'asc' },
                include: { author: { select: { id: true, role: true, employeeProfile: { select: { legalName: true, profilePhotoUrl: true } }, clientProfile: { select: { contactName: true, logoUrl: true } } } } }
            }
        }
    });
};

export const editUpdateStatus = async (id, data) => {
    return await prisma.projectUpdate.update({ where: { id }, data });
};

export const addReply = async (updateId, authorId, text) => {
    return await prisma.updateReply.create({
        data: { updateId, authorId, text },
        include: { author: { select: { id: true, role: true, employeeProfile: { select: { legalName: true, profilePhotoUrl: true } }, clientProfile: { select: { contactName: true, logoUrl: true } } } } }
    });
};

export const deleteUpdate = async (id) => {
    return await prisma.projectUpdate.delete({ where: { id } });
};