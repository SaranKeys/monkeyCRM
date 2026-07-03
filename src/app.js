import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from "./routes/auth.routes.js"
import employeeRoutes from "./routes/employee.routes.js"
import clientRoutes from "./routes/client.route.js"
import roleRoutes from "./routes/role.route.js"
import projectRoutes from "./routes/project.route.js"
import serviceRoutes from "./routes/templateService.routes.js"
import ticketRoutes from "./routes/ticket.route.js"
import runwayRoutes from "./routes/runway.route.js"
import updateRoutes from "./routes/update.route.js"
import phaseRoutes from "./routes/phase.route.js"
import chatRoutes from "./routes/chat.route.js"
import fileRoutes from "./routes/file.route.js"

const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev')); 

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'monkeyCRM server is healthy 3rd july!',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/roles', roleRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/tickets', ticketRoutes);
app.use('/api/runway', runwayRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;