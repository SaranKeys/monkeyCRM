import prisma from '../config/prisma.js';

export const createPhase = async (data) => {
    return await prisma.projectPhase.create({ data });
};

export const getProjectPhases = async (projectId) => {
    const phases = await prisma.projectPhase.findMany({
        where: { projectId },
        orderBy: { startDate: 'asc' },
        include: {
            lead: { select: { id: true, legalName: true, profilePhotoUrl: true } },
            tasks: { select: { id: true, status: true } }
        }
    });

    return phases.map(phase => {
        const totalTasks = phase.tasks.length;
        const doneTasks = phase.tasks.filter(t => t.status === 'DONE').length;
        const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
        
        let calculatedStatus = phase.status;
        if (totalTasks > 0 && doneTasks === totalTasks) calculatedStatus = 'COMPLETED';
        else if (doneTasks > 0) calculatedStatus = 'IN_PROGRESS';

        return {
            ...phase,
            status: calculatedStatus,
            taskStats: { total: totalTasks, done: doneTasks, progress }
        };
    });
};
export const getPhaseDetails = async (phaseId) => {
    const phase = await prisma.projectPhase.findUnique({
        where: { id: phaseId },
        include: {
            lead: { select: { id: true, legalName: true, profilePhotoUrl: true } },
            subPhases: {
                include: {
                    tasks: { include: { assignee: { select: { id: true, legalName: true } } } }
                }
            },
            tasks: {
                where: { OR: [{ subPhaseId: null }, { subPhaseId: { isSet: false } }] },
                include: { assignee: { select: { id: true, legalName: true } } }
            }
        }
    });

    if (!phase) return null;

    let totalTasks = phase.tasks.length;
    let doneTasks = phase.tasks.filter(t => t.status === 'DONE').length;

    phase.subPhases.forEach(subPhase => {
        totalTasks += subPhase.tasks.length;
        doneTasks += subPhase.tasks.filter(t => t.status === 'DONE').length;
    });

    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
        ...phase,
        taskStats: {
            total: totalTasks,
            done: doneTasks,
            progress: progress
        }
    };
};

export const updatePhase = async (phaseId, data) => {
    return await prisma.projectPhase.update({ where: { id: phaseId }, data });
};

export const createSubPhase = async (data) => {
    return await prisma.phaseSubPhase.create({ data });
};

export const createTask = async (data) => {
    return await prisma.phaseTask.create({ 
        data, 
        include: { assignee: { select: { id: true, legalName: true } } } 
    });
};

export const updateTask = async (taskId, data) => {
    return await prisma.phaseTask.update({
        where: { id: taskId },
        data, 
        include: { assignee: { select: { id: true, legalName: true } } }
    });
};