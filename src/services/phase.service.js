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

export const deletePhase = async (phaseId) => {
    return await prisma.projectPhase.delete({
        where: { id: phaseId }
    });
};

export const updateSubPhase = async (subPhaseId, data) => {
    return await prisma.phaseSubPhase.update({
        where: { id: subPhaseId },
        data
    });
};

export const deleteSubPhase = async (subPhaseId) => {
    return await prisma.phaseSubPhase.delete({
        where: { id: subPhaseId }
    });
};

export const deleteTask = async (taskId) => {
    return await prisma.phaseTask.delete({
        where: { id: taskId }
    });
};


export const createTaskUpdate = async (taskId, authorId, data) => {
    return await prisma.taskUpdate.create({
        data: {
            content: data.content,
            type: data.type,
            taskId,
            authorId
        },
        include: {
            author: { select: { employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } }
        }
    });
};

export const getTaskUpdates = async (taskId) => {
    return await prisma.taskUpdate.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },  
        include: {
            author: { select: { employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } },
            replies: {
                orderBy: { createdAt: 'asc' }, // Oldest replies first (chronological)
                include: {
                    author: { select: { employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } }
                }
            }
        }
    });
};

export const addTaskUpdateReply = async (updateId, authorId, text) => {
    return await prisma.taskUpdateReply.create({
        data: { text, updateId, authorId },
        include: {
            author: { select: { employeeProfile: { select: { legalName: true, profilePhotoUrl: true } } } }
        }
    });
};

export const addTaskTimeLog = async (taskId, authorId, data) => {
    return await prisma.$transaction(async (tx) => {

        const log = await tx.taskTimeLog.create({
            data: {
                hours: data.hours,
                date: new Date(data.date),
                note: data.note,
                taskId,
                authorId
            },
            include: {
                author: { select: { employeeProfile: { select: { legalName: true } } } }
            }
        });

        await tx.phaseTask.update({
            where: { id: taskId },
            data: {
                loggedHours: { increment: data.hours }
            }
        });

        return log;
    });
};

export const getTaskTimeLogs = async (taskId) => {
    return await prisma.taskTimeLog.findMany({
        where: { taskId },
        orderBy: { date: 'desc' },  
        include: {
            author: { select: { employeeProfile: { select: { legalName: true } } } }
        }
    });
};


export const getTaskDetails = async (taskId) => {
    return await prisma.phaseTask.findUnique({
        where: { id: taskId },
        include: {
            assignee: {
                select: {
                    legalName: true,
                    profilePhotoUrl: true
                }
            },
            phase: {
                select: {
                    name: true,
                    project: {
                        select: { name: true }
                    }
                }
            }
        }
    });
};