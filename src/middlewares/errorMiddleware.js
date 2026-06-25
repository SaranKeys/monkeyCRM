import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, res, next) => {
    res.status(404).json({ 
        status: 'error', 
        message: `Can't find ${req.originalUrl} on this server!` 
    });
};

export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);

    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};