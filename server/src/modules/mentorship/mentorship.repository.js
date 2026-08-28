import { db } from '../../config/db.js';

export class MentorshipRepository {
  async findUserById(id) {
    return await db.users.findById(id);
  }

  async findPendingRequest(studentId, mentorId) {
    const all = await db.mentorshipRequests.find();
    return all.find(r => r.student_id === studentId && r.mentor_id === mentorId && (r.status === 'PENDING' || r.status === 'WAITLISTED'));
  }

  async createMentorshipRequest(reqData) {
    return await db.mentorshipRequests.create(reqData);
  }

  async findRequestById(id) {
    return await db.mentorshipRequests.findById(id);
  }

  async updateRequest(id, updates) {
    return await db.mentorshipRequests.update(id, updates);
  }

  async createActiveMentorship(data) {
    return await db.activeMentorships.create(data);
  }

  async findActiveMentorshipById(id) {
    return await db.activeMentorships.findById(id);
  }

  async updateActiveMentorship(id, updates) {
    return await db.activeMentorships.update(id, updates);
  }

  async findAllRequests() {
    return await db.mentorshipRequests.find();
  }

  async findAllActiveMentorships() {
    return await db.activeMentorships.find();
  }

  async getAlumniProfile(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async getStudentProfile(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async updateAlumniProfile(userId, data) {
    return await db.alumniProfiles.createOrUpdate(userId, data);
  }

  async findDomainById(id) {
    return await db.domains.findById(id);
  }

  async logAuditAction(adminId, action, targetUserId, details) {
    return await db.auditLogs.log(adminId, action, targetUserId, details);
  }
}

export const mentorshipRepository = new MentorshipRepository();
