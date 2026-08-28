import { db } from '../../config/db.js';

export class RecommendationRepository {
  async findStudentProfile(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async findVerifiedAlumni() {
    const all = await db.users.find();
    return all.filter(u => u.role === 'ALUMNI' && u.verification_status === 'VERIFIED');
  }

  async findAlumniProfile(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async findAllDomains() {
    return await db.domains.find();
  }
}

export const recommendationRepository = new RecommendationRepository();
