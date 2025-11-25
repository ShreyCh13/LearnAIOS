import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import authRoutes from './routes/auth';
import coursesRoutes from './routes/courses';
import modulesRoutes from './routes/modules';
import assignmentsRoutes from './routes/assignments';
import eventsRoutes from './routes/events';
import documentsRoutes from './routes/documents';
import aiRouter from './ai/aiRouter';

// Fail fast if required environment variables are missing
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
for (const name of requiredEnvVars) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.API_PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
// Auth routes (POST /auth/login is public, GET /auth/me is protected inside the route)
app.use('/auth', authRoutes);

// Course routes (all protected with requireAuth middleware inside the router)
app.use('/courses', coursesRoutes);

// Module routes (protected with requireAuth and role-based access control)
app.use('/', modulesRoutes);

// Assignment routes (protected with requireAuth and role-based access control)
app.use('/', assignmentsRoutes);

// Event routes (protected with requireAuth and role-based access control)
app.use('/', eventsRoutes);

// Document routes (protected with requireAuth inside the router)
app.use('/', documentsRoutes);

// AI routes (protected with requireAuth)
app.use('/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

