import prisma from '../config/prisma.js';

export const createRole = async (data) => {
    return await prisma.companyRole.create({ data });
};

export const getAllRolesWithCounts = async () => {
    const roles = await prisma.companyRole.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const rolesWithCounts = await Promise.all(roles.map(async (role) => {
        const memberCount = await prisma.employeeProfile.count({
            where: { designation: role.name }
        });
        
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            members: memberCount,
            createdAt: role.createdAt
        };
    }));

    return rolesWithCounts;
};

export const updateRole = async (id, data) => {
    return await prisma.companyRole.update({
        where: { id },
        data
    });
};

export const deleteRole = async (id) => {
    return await prisma.companyRole.delete({
        where: { id }
    });
};