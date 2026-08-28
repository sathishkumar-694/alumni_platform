# CampusBridge - Standalone Project & Deployment Guide

This guide explains how to package, configure Cloudinary cloud storage, and deploy **CampusBridge** as a separate, standalone production project.

---

## ☁️ 1. Cloudinary File Upload Integration

File uploads are configured to upload directly to Cloudinary cloud storage using your credentials in `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=alumni_portal
CLOUDINARY_API_KEY=221627172876759
CLOUDINARY_API_SECRET=J58HTcKAn193hrmx3bSG2ZUXCuI
```

### How Cloudinary Works in CampusBridge:
- When a student registers with a Student ID Card, or a mentor uploads an Alumni Credential/Study Resource, `uploadToCloud` uploads the file directly to Cloudinary under the `campusbridge/` folder.
- Returns a secure HTTPS URL (`https://res.cloudinary.com/alumni_portal/image/upload/...`).
- If Cloudinary credentials are omitted or network fails, it gracefully falls back to local storage `/uploads/`.

---

## 📁 2. Project Directory Structure

```text
campusbridge/
├── client/                     # React 19 Frontend Web Application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── server/                     # Node.js + Express REST API Server
│   ├── src/
│   ├── database_setup.sql      # Full MySQL Database DDL/DML Schema
│   ├── init_db.js              # Database Seeder & Password Synchronizer
│   ├── package.json
│   └── .env.example
├── docker-compose.yml          # Multi-Container Production Stack
├── API_DOCUMENTATION.md        # Endpoint Reference & Response Examples
├── API_REFERENCE_TABLE.md      # Master REST API Matrix Table
├── README.md                   # Project Overview & Setup Guide
└── .gitignore
```

---

## 🚀 3. Steps to Create a Separate Git Repository

### Step 3.1: Copy Project Folder
Copy the `s7pro` folder to your designated new project location (e.g. `C:\Projects\CampusBridge`).

### Step 3.2: Initialize Git Repository
In terminal at your new project root:
```bash
git init
```

### Step 3.3: Create Root `.gitignore`
Create `.gitignore` at the project root:
```gitignore
node_modules/
.env
uploads/
dist/
.DS_Store
*.log
```

### Step 3.4: Create `.env` Files

**Backend (`server/.env`)**:
```env
PORT=5001
JWT_SECRET=campusbridge_production_jwt_secret_2026
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campusbridge
DB_PORT=3306

CLOUDINARY_CLOUD_NAME=alumni_portal
CLOUDINARY_API_KEY=221627172876759
CLOUDINARY_API_SECRET=J58HTcKAn193hrmx3bSG2ZUXCuI
```

**Frontend (`client/.env`)**:
```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

### Step 3.5: Push to GitHub / GitLab
```bash
git add .
git commit -m "Initial commit: CampusBridge University Alumni Network Platform"
git branch -M main
git remote add origin https://github.com/your-username/campusbridge.git
git push -u origin main
```

---

## 🌐 4. Cloud Deployment Options

### Option A: One-Click Docker Container Stack (Recommended)
If deploying to AWS EC2, DigitalOcean, or Railway with Docker:
```bash
docker-compose up --build -d
```

### Option B: Cloud Hosting Services
1. **Database**: Free Managed MySQL via [Aiven.io](https://aiven.io/), [Railway.app](https://railway.app/), or [Render.com](https://render.com/).
2. **Backend Engine**: Deploy `server/` to Render.com, Railway.app, or Heroku.
   - Build Command: `npm install`
   - Start Command: `node init_db.js && npm start`
3. **Frontend Application**: Deploy `client/` to [Vercel.com](https://vercel.com/) or [Netlify.com](https://netlify.com/).
   - Build Command: `npm run build`
   - Output Directory: `dist`
