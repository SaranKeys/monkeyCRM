import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from "./routes/auth.routes.js"
import employeeRoutes from "./routes/employee.routes.js"

const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev')); 

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'monkeyCRM server is healthy!',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;