import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                status: 'fail', 
                message: 'Unauthorized. Please log in to get access.' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();  
    } catch (error) {
        return res.status(401).json({ 
            status: 'fail', 
            message: 'Invalid or expired token. Please log in again.' 
        });
    }
};
 
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'fail', 
                message: 'Forbidden. You do not have permission to perform this action.' 
            });
        }
        next();
    };
};



// export const checkPermission = (moduleName, actionName) => {
//     return async (req, res, next) => {
//         try {
//             if (req.user.role === 'ADMIN') {
//                 return next();
//             }

//             const userWithProfile = await prisma.user.findUnique({
//                 where: { id: req.user.id },
//                 include: { employeeProfile: true }
//             });

//             if (!userWithProfile || !userWithProfile.employeeProfile) {
//                 return res.status(403).json({ 
//                     status: 'fail', 
//                     message: 'Forbidden. Employee profile not found.' 
//                 });
//             }

//             const designation = userWithProfile.employeeProfile.designation;

//             const roleRecord = await prisma.companyRole.findUnique({
//                 where: { name: designation }
//             });

//             if (!roleRecord || !roleRecord.permissions) {
//                 return res.status(403).json({ 
//                     status: 'fail', 
//                     message: `Forbidden. No permissions configured for designation: ${designation}` 
//                 });
//             }

//             const modulePermissions = roleRecord.permissions[moduleName];
//             const hasPermission = modulePermissions && modulePermissions[actionName] === true;

//             if (!hasPermission) {
//                 return res.status(403).json({ 
//                     status: 'fail', 
//                     message: `Forbidden. Your role '${designation}' lacks the '${actionName}' permission.` 
//                 });
//             }

//             next();
//         } catch (error) {
//             console.error("[Permission Middleware Error]:", error);
//             return res.status(500).json({ 
//                 status: 'fail', 
//                 message: 'Error verifying permissions.' 
//             });
//         }
//     };
// };

export const checkPermission = (moduleName, actionName, allowClients = false) => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'ADMIN') {
                return next();
            }

            if (allowClients && req.user.role === 'CLIENT') {
                return next();
            }

            if (!allowClients && req.user.role === 'CLIENT') {
                return res.status(403).json({ 
                    status: 'fail', 
                    message: 'Forbidden. Clients do not have permission to perform this action.' 
                });
            }

            const userWithProfile = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employeeProfile: true }
            });

            if (!userWithProfile || !userWithProfile.employeeProfile) {
                return res.status(403).json({ 
                    status: 'fail', 
                    message: 'Forbidden. Employee profile not found.' 
                });
            }

            const designation = userWithProfile.employeeProfile.designation;

            const roleRecord = await prisma.companyRole.findUnique({
                where: { name: designation }
            });

            if (!roleRecord || !roleRecord.permissions) {
                return res.status(403).json({ 
                    status: 'fail', 
                    message: `Forbidden. No permissions configured for designation: ${designation}` 
                });
            }

            const modulePermissions = roleRecord.permissions[moduleName];
            const hasPermission = modulePermissions && modulePermissions[actionName] === true;

            if (!hasPermission) {
                return res.status(403).json({ 
                    status: 'fail', 
                    message: `Forbidden. Your role '${designation}' lacks the '${actionName}' permission.` 
                });
            }

            next();
        } catch (error) {
            console.error("[Permission Middleware Error]:", error);
            return res.status(500).json({ 
                status: 'fail', 
                message: 'Error verifying permissions.' 
            });
        }
    };
};