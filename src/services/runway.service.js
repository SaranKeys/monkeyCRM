import prisma from '../config/prisma.js';

export const createRunwayItem = async (data) => {
    return await prisma.projectMilestone.create({
        data,
        include: { owner: { select: { id: true, legalName: true } } }
    });
};

export const getProjectRunway = async (projectId) => {
    return await prisma.projectMilestone.findMany({
        where: { projectId },
        orderBy: { dueDate: 'asc' },
        include: { owner: { select: { id: true, legalName: true } } }
    });
};

export const getRunwayItemById = async (id) => {
    const item = await prisma.projectMilestone.findUnique({
        where: { id },
        include: { owner: { select: { id: true, legalName: true, profilePhotoUrl: true } } }
    });
    if (!item) throw Object.assign(new Error("Item not found"), { code: "P2025" });
    return item;
};

export const updateRunwayItem = async (id, data) => {
    return await prisma.projectMilestone.update({
        where: { id },
        data,
        include: { owner: { select: { id: true, legalName: true } } }
    });
};

export const deleteRunwayItem = async (id) => {
    return await prisma.projectMilestone.delete({ where: { id } });
};