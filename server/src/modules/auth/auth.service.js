import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authRepository } from './auth.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { config } from '../../config/env.js';
import { uploadToCloud } from '../../config/cloudinary.js';
import { sendMail } from '../../config/mailer.js';

export class AuthService {
  async registerStudent(studentData, file) {
    const { name, email, password, academicYear, academic_year, department, careerGoals, career_goals, studentIdCardUrl: bodyCardUrl, student_id_card_url: bodyCardUrl2 } = studentData;
    const regNumber = studentData.regNumber || studentData.reg_number;

    if (!name || !email || !password || !regNumber) {
      throw new ApiError(400, 'Name, email, password, and registration number are required');
    }

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists');
    }

    let studentIdCardUrl = bodyCardUrl || bodyCardUrl2 || '';
    if (file) {
      studentIdCardUrl = await uploadToCloud(file.path, 'student_ids');
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const newUser = await authRepository.createUser({
      name,
      email,
      password_hash,
      role: 'STUDENT',
      verification_status: 'PENDING'
    });

    await authRepository.createStudentProfile(newUser.id, {
      reg_number: regNumber,
      academic_year: academicYear || academic_year,
      department: department,
      career_goals: careerGoals || career_goals || '',
      student_id_card_url: studentIdCardUrl,
      interests: []
    });

    const token = this.generateToken(newUser);
    const profile = await authRepository.findStudentProfileByUserId(newUser.id);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verification_status: newUser.verification_status,
        profile
      },
      token
    };
  }

  async registerAlumni(alumniData, file) {
    const { name, email, password, company, designation, experienceYears, experience_years, graduationYear, graduation_year, linkedinUrl, linkedin_url, maxCapacity, max_capacity, bio, alumniIdCardUrl: bodyCardUrl, alumni_id_card_url: bodyCardUrl2 } = alumniData;

    if (!name || !email || !password || !company || !designation) {
      throw new ApiError(400, 'Name, email, password, company, and designation are required');
    }

    const idCardProvided = file || bodyCardUrl || bodyCardUrl2;
    if (!idCardProvided) {
      throw new ApiError(400, 'Alumni ID card photo is compulsory for registration and verification');
    }

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists');
    }

    let alumniIdCardUrl = bodyCardUrl || bodyCardUrl2 || '';
    if (file) {
      alumniIdCardUrl = await uploadToCloud(file.path, 'alumni_ids');
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const newUser = await authRepository.createUser({
      name,
      email,
      password_hash,
      role: 'ALUMNI',
      verification_status: 'PENDING'
    });

    await authRepository.createAlumniProfile(newUser.id, {
      company,
      designation,
      experience_years: Number(experienceYears) || 1,
      graduation_year: Number(graduationYear) || new Date().getFullYear(),
      linkedin_url: linkedinUrl || '',
      alumni_id_card_url: alumniIdCardUrl,
      max_capacity: Number(maxCapacity) || 5,
      current_capacity: 0,
      bio: bio || '',
      expertise: []
    });

    const token = this.generateToken(newUser);
    const profile = await authRepository.findAlumniProfileByUserId(newUser.id);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verification_status: newUser.verification_status,
        profile
      },
      token
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new ApiError(400, 'Please provide both email and password');
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (user.verification_status === 'SUSPENDED') {
      throw new ApiError(403, 'Account is suspended. Please contact the Mentorship Operations Center.');
    }

    const token = this.generateToken(user);
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await authRepository.findStudentProfileByUserId(user.id);
    } else if (user.role === 'ALUMNI') {
      profile = await authRepository.findAlumniProfileByUserId(user.id);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
        profile
      },
      token
    };
  }

  async getCurrentUser(user) {
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await authRepository.findStudentProfileByUserId(user.id);
    } else if (user.role === 'ALUMNI') {
      profile = await authRepository.findAlumniProfileByUserId(user.id);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verification_status: user.verification_status,
      profile
    };
  }

  // ─── Password Reset Flow ─────────────────────────────────────────────────────

  async forgotPassword(email) {
    if (!email) {
      throw new ApiError(400, 'Email address is required');
    }

    const user = await authRepository.findUserByEmail(email);

    // Always return success to prevent user enumeration attacks
    if (!user) {
      return { message: 'If this email exists, a password reset link has been sent.' };
    }

    // Ensure the reset tokens table exists
    await authRepository.ensurePasswordResetTable();

    // Generate a secure random token (64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    await authRepository.createResetToken(user.id, tokenHash, expiresAtStr);

    const resetUrl = `${config.frontendUrl}/#reset-password?token=${rawToken}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 18px;margin-bottom:12px;">
                    <span style="font-size:1.4rem;font-weight:800;color:#fff;letter-spacing:-0.03em;">CampusBridge</span>
                  </div>
                  <h1 style="margin:0;font-size:1.5rem;font-weight:800;color:#fff;">Password Reset Request</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;color:#94a3b8;font-size:0.95rem;">Hello <strong style="color:#e2e8f0;">${String(user.name || 'there').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])}</strong>,</p>
                  <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
                    We received a request to reset the password for your CampusBridge account. Click the button below to set a new password. This link is valid for <strong style="color:#e2e8f0;">1 hour</strong>.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:1rem;letter-spacing:0.01em;">
                      🔐 Reset My Password
                    </a>
                  </div>
                  <p style="margin:0 0 12px;color:#64748b;font-size:0.82rem;">Or copy and paste this URL into your browser:</p>
                  <p style="margin:0 0 24px;color:#6366f1;font-size:0.82rem;word-break:break-all;">${resetUrl}</p>
                  <hr style="border:none;border-top:1px solid #334155;margin:24px 0;" />
                  <p style="margin:0;color:#64748b;font-size:0.82rem;line-height:1.5;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.<br/><br/>
                    For security, this link expires in 1 hour and can only be used once.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#0f172a;padding:20px 40px;text-align:center;border-top:1px solid #334155;">
                  <p style="margin:0;color:#475569;font-size:0.78rem;">© 2026 CampusBridge – Bannari Amman Institute of Technology. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    await sendMail({
      to: user.email,
      subject: '🔐 CampusBridge – Reset Your Password',
      html
    });

    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new ApiError(400, 'Token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    // Ensure table exists before querying
    await authRepository.ensurePasswordResetTable();

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await authRepository.resetPasswordWithToken(tokenHash, passwordHash);
    if (!reset) {
      throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}

export const authService = new AuthService();
