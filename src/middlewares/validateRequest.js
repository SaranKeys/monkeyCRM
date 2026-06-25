import { logger } from '../utils/logger.js';

export const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        logger.warn(`[Validation Error] ${req.originalUrl}`);
        
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        res.status(400).json({
            status: 'fail',
            errors: errors
        });
    }
};