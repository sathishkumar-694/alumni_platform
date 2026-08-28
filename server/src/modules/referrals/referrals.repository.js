import { db } from '../../config/db.js';

export class ReferralsRepository {
  async findAllJobs() {
    return await db.jobReferrals.find();
  }

  async createJob(data) {
    return await db.jobReferrals.create(data);
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async findAlumniProfile(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async findAllApplications() {
    return await db.referralApplications.find();
  }

  async createApplication(data) {
    return await db.referralApplications.create(data);
  }
}

export const referralsRepository = new ReferralsRepository();
