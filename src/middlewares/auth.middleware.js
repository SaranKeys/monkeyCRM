import jwt from 'jsonwebtoken';

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