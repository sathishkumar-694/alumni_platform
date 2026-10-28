import { db } from '../../config/db.js';

export class ReferralsRepository {
  async findAllJobs() {
    return await db.jobReferrals.find();
  }

  async findJobById(id) {
    return await db.jobReferrals.findById(id);
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

  async findStudentProfile(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async findAllApplications() {
    return await db.referralApplications.find();
  }

  async createApplication(data) {
    return await db.referralApplications.create(data);
  }

  async updateApplicationStatus(id, status) {
    const rows = await db.referralApplications.updateStatus(id, status);
    return rows;
  }
}

export const referralsRepository = new ReferralsRepository();
