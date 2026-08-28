import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from './src/config/env.js';

async function initDB() {
  console.log('Connecting to MySQL server to execute database_setup.sql...');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      port: config.mysql.port,
      multipleStatements: true
    });

    console.log(`Connected to MySQL at ${config.mysql.host}:${config.mysql.port} as user '${config.mysql.user}'`);

    const sqlFilePath = path.join(process.cwd(), 'database_setup.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`database_setup.sql file not found at ${sqlFilePath}`);
    }

    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing database setup script...');
    await connection.query(sqlScript);

    // Ensure all seed users have bcrypt hash of 'password123'
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    await connection.query('UPDATE `campusbridge`.`users` SET `password_hash` = ?', [defaultPasswordHash]);

    console.log('Database campusbridge and all tables/seed records created & password hashes synchronized successfully.');
  } catch (error) {
    console.error('Failed to initialize MySQL database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
