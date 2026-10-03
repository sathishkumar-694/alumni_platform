import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from './src/config/env.js';

async function initDB() {
  console.log(`Connecting to MySQL host '${config.mysql.host}:${config.mysql.port}' (database: '${config.mysql.database}') as user '${config.mysql.user}'...`);

  let connection;
  try {
    const connConfig = {
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      port: config.mysql.port,
      database: config.mysql.database,
      multipleStatements: true
    };

    if (config.mysql.ssl) {
      connConfig.ssl = { rejectUnauthorized: false };
    }

    connection = await mysql.createConnection(connConfig);

    console.log(`Successfully connected to MySQL!`);

    const sqlFilePath = path.join(process.cwd(), 'database_setup.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`database_setup.sql file not found at ${sqlFilePath}`);
    }

    let sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Adapt script for Aiven / Cloud MySQL (remove hardcoded USE campusbridge)
    sqlScript = sqlScript
      .replace(/CREATE DATABASE IF NOT EXISTS `campusbridge`[^;]+;/gi, '')
      .replace(/USE `campusbridge`;/gi, '')
      .replace(/`campusbridge`\./gi, '');

    console.log(`Executing database setup SQL script on '${config.mysql.database}'...`);
    await connection.query(sqlScript);

    console.log('✅ All database tables created successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize MySQL database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
