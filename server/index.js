import express from "express";
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './src/config/env.js';
import { ensureDatabaseSchema } from './src/config/mysql.js';
import { errorMiddleware } from './src/middleware/error.middleware.js';
import { renderSwaggerHTML, openApiSpec } from './src/config/swagger.js';
// Feature Module Router
import authRoutes from './src/modules/auth/auth.routes.js';
import verificationRoutes from './src/modules/verification/verification.routes.js';
import usersRoutes from './src/modules/users/users.routes.js';
import domainsRoutes from './src/modules/domains/domains.routes.js';
import recommendationRoutes from './src/modules/recommendation/recommendation.routes.js';
import mentorshipRoutes from './src/modules/mentorship/mentorship.routes.js';
import sessionsRoutes from './src/modules/sessions/sessions.routes.js';
import resourcesRoutes from './src/modules/resources/resources.routes.js';
import announcementsRoutes from './src/modules/announcements/announcements.routes.js';
import referralsRoutes from './src/modules/referrals/referrals.routes.js';
import analyticsRoutes from './src/modules/analytics/analytics.routes.js';
import auditRoutes from './src/modules/audit/audit.routes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

// Configure 50mb body limit for large PDF / Base64 resume file payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded document artifacts statically
const uploadsDirectory = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDirectory));

// Interactive Swagger / OpenAPI Documentation
app.get('/docs', (req, res) => {
  res.send(renderSwaggerHTML());
});

app.get('/api/v1/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CampusBridge Backend API Engine',
    timestamp: new Date().toISOString()
  });
});

// Feature API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/domains', domainsRoutes);
app.use('/api/v1/recommendation', recommendationRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/resources', resourcesRoutes);
app.use('/api/v1/announcements', announcementsRoutes);
app.use('/api/v1/referrals', referralsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit', auditRoutes);

// Serve production built client static assets if available
const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
const localClientDistPath = path.join(process.cwd(), 'client', 'dist');

const distPathToUse = fs.existsSync(clientDistPath) ? clientDistPath : fs.existsSync(localClientDistPath) ? localClientDistPath : null;

if (distPathToUse) {
  app.use(express.static(distPathToUse));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/docs') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPathToUse, 'index.html'));
  });
}

// Global Error Handling Middleware
app.use(errorMiddleware);

const startServer = async (portToTry) => {
  await ensureDatabaseSchema();
  const server = app.listen(portToTry, () => {
    console.log(`CampusBridge Backend Engine listening on http://localhost:${portToTry}`);
    console.log(`Swagger Interactive API Docs available at http://localhost:${portToTry}/docs`);
  });

  server.on('error', (err) => {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.warn(`[Port Warning] Port ${portToTry} is restricted or in use (${err.code}). Trying next port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(Number(config.port) || 5001);
