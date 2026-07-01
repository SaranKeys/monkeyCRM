import prisma from '../config/prisma.js';

const generateTicketNumber = async () => {
    const lastTicket = await prisma.ticket.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { ticketNumber: true }
    });

    if (!lastTicket) return "TKT-001";  

    const lastNumber = parseInt(lastTicket.ticketNumber.replace("TKT-", ""), 10);
    const nextNumber = lastNumber + 1;
    
    return `TKT-${String(nextNumber).padStart(3, '0')}`;
};

export const createTicket = async (data, creatorId) => {
    const ticketNumber = await generateTicketNumber();

    return await prisma.ticket.create({
        data: {
            ...data,
            ticketNumber,
            creatorId  
        },
        include: {
            creator: { select: { id: true, email: true, role: true } },
            assignee: { select: { id: true, legalName: true, profilePhotoUrl: true } }
        }
    });
};

// 🔵 GET TICKETS FOR A SPECIFIC PROJECT (For your Lazy-Loaded React Tab!)
export const getTicketsByProject = async (projectId, page = 1, limit = 10, status) => {
    const skip = (page - 1) * limit;
    
    const whereClause = { projectId };
    if (status) whereClause.status = status;

    const [total, tickets] = await Promise.all([
        prisma.ticket.count({ where: whereClause }),
        prisma.ticket.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { id: true, email: true, role: true } },
                assignee: { select: { id: true, legalName: true } }
            }
        })
    ]);

    return { tickets, total, pages: Math.ceil(total / limit) };
};

export const updateTicket = async (id, data) => {
    return await prisma.ticket.update({
        where: { id },
        data,
        include: { assignee: { select: { id: true, legalName: true } } }
    });
};

export const deleteTicket = async (id) => {
    return await prisma.ticket.delete({
        where: { id }
    });
};


export const getTicketById = async (id) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            project: { select: { name: true } },
            assignee: { select: { id: true, legalName: true, profilePhotoUrl: true } },
            creator: {
                select: {
                    id: true, role: true, email: true,
                    employeeProfile: { select: { legalName: true, profilePhotoUrl: true } },
                    clientProfile: { select: { contactName: true, logoUrl: true } }
                }
            },
            comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                    author: {
                        select: {
                            id: true, role: true,
                            employeeProfile: { select: { legalName: true, profilePhotoUrl: true } },
                            clientProfile: { select: { contactName: true, logoUrl: true } }
                        }
                    }
                }
            }
        }
    });

    if (!ticket) {
        const err = new Error("Ticket not found");
        err.code = "P2025";
        throw err;
    }

    return ticket;
};

export const addComment = async (ticketId, authorId, text) => {
    return await prisma.ticketComment.create({
        data: { ticketId, authorId, text },
        include: {
            author: {
                select: {
                    id: true, role: true,
                    employeeProfile: { select: { legalName: true, profilePhotoUrl: true } },
                    clientProfile: { select: { contactName: true, logoUrl: true } }
                }
            }
        }
    });
};

export const deleteComment = async (commentId) => {
    return await prisma.ticketComment.delete({
        where: { id: commentId }
    });
};

export const getCommentById = async (commentId) => {
    return await prisma.ticketComment.findUnique({
        where: { id: commentId }
    });
};