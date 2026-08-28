import bcrypt from 'bcryptjs';
import { usersRepository } from './users.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class UsersService {
  async updateStudentProfile(user, body) {
    if (user.role !== 'STUDENT') {
      throw new ApiError(403, 'Only students can update student profile');
    }

    const { careerGoals, interests, department, academicYear } = body;

    return await usersRepository.updateStudentProfile(user.id, {
      ...(careerGoals !== undefined && { career_goals: careerGoals }),
      ...(interests !== undefined && { interests: Array.isArray(interests) ? interests : JSON.parse(interests) }),
      ...(department !== undefined && { department }),
      ...(academicYear !== undefined && { academic_year: academicYear })
    });
  }

  async updateAlumniProfile(user, body) {
    if (user.role !== 'ALUMNI') {
      throw new ApiError(403, 'Only alumni can update alumni profile');
    }

    const { company, designation, experienceYears, maxCapacity, expertise, linkedinUrl, bio } = body;

    return await usersRepository.updateAlumniProfile(user.id, {
      ...(company !== undefined && { company }),
      ...(designation !== undefined && { designation }),
      ...(experienceYears !== undefined && { experience_years: Number(experienceYears) }),
      ...(maxCapacity !== undefined && { max_capacity: Number(maxCapacity) }),
      ...(expertise !== undefined && { expertise: Array.isArray(expertise) ? expertise : JSON.parse(expertise) }),
      ...(linkedinUrl !== undefined && { linkedin_url: linkedinUrl }),
      ...(bio !== undefined && { bio })
    });
  }

  async getAllUsersAdmin() {
    const users = await usersRepository.findAllUsers();
    return await Promise.all(users.map(async (u) => {
      let profile = null;
      if (u.role === 'STUDENT') profile = await usersRepository.getStudentProfile(u.id);
      if (u.role === 'ALUMNI') profile = await usersRepository.getAlumniProfile(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        verification_status: u.verification_status,
        created_at: u.created_at,
        profile
      };
    }));
  }

  async updateUserByAdmin(adminId, userId, body) {
    const targetUser = await usersRepository.findUserById(userId);
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found');
    }

    const { verification_status, newPassword, maxCapacity, expertise, department, academicYear, careerGoals } = body;

    if (verification_status) {
      await usersRepository.updateUser(userId, { verification_status });
    }

    if (newPassword) {
      const password_hash = bcrypt.hashSync(newPassword, 10);
      await usersRepository.updateUser(userId, { password_hash });
    }

    if (targetUser.role === 'ALUMNI') {
      await usersRepository.updateAlumniProfile(userId, {
        ...(maxCapacity !== undefined && { max_capacity: Number(maxCapacity) }),
        ...(expertise !== undefined && { expertise: Array.isArray(expertise) ? expertise : JSON.parse(expertise) })
      });
    } else if (targetUser.role === 'STUDENT') {
      await usersRepository.updateStudentProfile(userId, {
        ...(department !== undefined && { department }),
        ...(academicYear !== undefined && { academic_year: academicYear }),
        ...(careerGoals !== undefined && { career_goals: careerGoals })
      });
    }

    await usersRepository.logAuditAction(
      adminId,
      'ADMIN_UPDATED_USER',
      userId,
      `Admin updated profile & options for ${targetUser.name} (${targetUser.role})`
    );

    const updatedUser = await usersRepository.findUserById(userId);
    let profile = null;
    if (updatedUser.role === 'STUDENT') profile = await usersRepository.getStudentProfile(userId);
    if (updatedUser.role === 'ALUMNI') profile = await usersRepository.getAlumniProfile(userId);

    return {
      ...updatedUser,
      profile
    };
  }
}

export const usersService = new UsersService();
