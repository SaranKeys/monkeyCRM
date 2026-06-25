import prisma from '../config/prisma.js';
import { DEFAULT_PERMISSIONS } from '../constants/defaultPermissions.js';

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
    const role = await prisma.companyRole.findUnique({
        where: { id }
    });

    if (!role) {
        const error = new Error("Role not found.");
        error.code = 'P2025';  
        throw error;
    }

    const memberCount = await prisma.employeeProfile.count({
        where: { designation: role.name }
    });

    if (memberCount > 0) {
        const error = new Error(`Cannot delete role. There are ${memberCount} employees currently assigned as '${role.name}'. Please reassign them to a different role first.`);
        error.statusCode = 400; 
        throw error;
    }

    return await prisma.companyRole.delete({
        where: { id }
    });
};

// permissions toggle 
export const getRolePermissions = async (id) => {
    const role = await prisma.companyRole.findUnique({
        where: { id },
        select: { id: true, name: true, permissions: true }
    });

    if (!role) throw new Error("Role not found");

    return {
        id: role.id,
        name: role.name,
        permissions: role.permissions || DEFAULT_PERMISSIONS
    };
};

export const updateRolePermissions = async (id, permissionsData) => {
    return await prisma.companyRole.update({
        where: { id },
        data: { permissions: permissionsData },
        select: { id: true, name: true, permissions: true } 
    });
};