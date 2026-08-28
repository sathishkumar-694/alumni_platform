import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { config } from '../../config/env.js';
import { uploadToCloud } from '../../config/cloudinary.js';

export class AuthService {
  async registerStudent(studentData, file) {
    const { name, email, password, regNumber, academicYear, department, careerGoals } = studentData;

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists');
    }

    let studentIdCardUrl = '';
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
      academic_year: academicYear,
      department: department,
      career_goals: careerGoals || '',
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
    const { name, email, password, company, designation, experienceYears, graduationYear, linkedinUrl, maxCapacity, bio } = alumniData;

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists');
    }

    let alumniIdCardUrl = '';
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

  generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}

export const authService = new AuthService();
