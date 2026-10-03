import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { config } from './src/config/env.js';
import { getMySQLPool, ensureDatabaseSchema } from './src/config/mysql.js';
import { errorMiddleware } from './src/middleware/error.middleware.js';
import { renderSwaggerHTML, openApiSpec } from './src/config/swagger.js';

// Feature Module Routes
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
import notificationsRoutes from './src/modules/notifications/notifications.routes.js';
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

// Health check endpoints
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CampusBridge Backend API Engine',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CampusBridge Backend API Engine',
    timestamp: new Date().toISOString()
  });
});

// One-Click Cloud Database Schema Initializer Endpoint
app.get(['/api/v1/setup-db', '/setup-db'], async (req, res) => {
  try {
    const connectionPool = getMySQLPool();
    const sqlFilePath = path.join(process.cwd(), 'database_setup.sql');
    let sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    sqlScript = sqlScript
      .replace(/CREATE DATABASE IF NOT EXISTS `campusbridge`[^;]+;/gi, '')
      .replace(/USE `campusbridge`;/gi, '')
      .replace(/`campusbridge`\./gi, '');

    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connectionPool.query(statement);
      } catch (stmtErr) {
        console.warn('[Setup-DB Statement Warning]:', stmtErr.message);
      }
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    try {
      await connectionPool.query('UPDATE `users` SET `password_hash` = ?', [defaultPasswordHash]);
    } catch (e) {
      // ignore
    }

    await ensureDatabaseSchema();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Aiven MySQL database tables and seed records initialized successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to setup database on Aiven MySQL: ' + error.message
    });
  }
});

// Primary Feature API Routes (/api/v1/*)
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
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit', auditRoutes);

// Route Aliases for backward compatibility
app.use('/auth', authRoutes);
app.use('/verification', verificationRoutes);
app.use('/users', usersRoutes);
app.use('/domains', domainsRoutes);
app.use('/recommendation', recommendationRoutes);
app.use('/mentorship', mentorshipRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/resources', resourcesRoutes);
app.use('/announcements', announcementsRoutes);
app.use('/referrals', referralsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/audit', auditRoutes);

// Serve production built client static assets if available
const candidateDistPaths = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), '..', 'client', 'dist'),
  path.resolve('client/dist'),
  path.resolve('../client/dist')
];

const distPathToUse = candidateDistPaths.find(p => fs.existsSync(p)) || null;

if (distPathToUse) {
  app.use(express.static(distPathToUse));
  app.get('*', (req, res, next) => {
    const apiPrefixes = ['/api', '/auth', '/verification', '/users', '/domains', '/recommendation', '/mentorship', '/sessions', '/resources', '/announcements', '/referrals', '/notifications', '/analytics', '/audit', '/docs', '/uploads', '/health'];
    if (apiPrefixes.some(p => req.path.startsWith(p))) {
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
