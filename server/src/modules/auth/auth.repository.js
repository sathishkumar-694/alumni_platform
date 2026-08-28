import { db } from '../../config/db.js';

export class AuthRepository {
  async findUserByEmail(email) {
    return await db.users.findByEmail(email);
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async createUser(userData) {
    return await db.users.create(userData);
  }

  async createStudentProfile(userId, profileData) {
    return await db.studentProfiles.createOrUpdate(userId, profileData);
  }

  async createAlumniProfile(userId, profileData) {
    return await db.alumniProfiles.createOrUpdate(userId, profileData);
  }

  async findStudentProfileByUserId(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async findAlumniProfileByUserId(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }
}

export const authRepository = new AuthRepository();
