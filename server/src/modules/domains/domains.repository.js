import { db } from '../../config/db.js';

export class DomainsRepository {
  async findAllDomains() {
    return await db.domains.find();
  }

  async findDomainById(id) {
    return await db.domains.findById(id);
  }

  async findDomainByName(name) {
    const all = await db.domains.find();
    return all.find(d => d.name.toLowerCase() === name.toLowerCase());
  }

  async createDomain(domainData) {
    return await db.domains.create(domainData);
  }

  async updateDomain(id, updates) {
    return await db.domains.update(id, updates);
  }

  async findAllStudentProfiles() {
    const allUsers = await db.users.find();
    const students = allUsers.filter(u => u.role === 'STUDENT');
    const profiles = await Promise.all(students.map(u => db.studentProfiles.findByUserId(u.id)));
    return profiles.filter(Boolean);
  }

  async findAllVerifiedAlumniProfiles() {
    const allUsers = await db.users.find();
    const alumni = allUsers.filter(u => u.role === 'ALUMNI' && u.verification_status === 'VERIFIED');
    const profiles = await Promise.all(alumni.map(u => db.alumniProfiles.findByUserId(u.id)));
    return profiles.filter(Boolean);
  }

  async findStudentProfileByUserId(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async updateStudentProfile(userId, updates) {
    return await db.studentProfiles.createOrUpdate(userId, updates);
  }

  async findAlumniProfileByUserId(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async updateAlumniProfile(userId, updates) {
    return await db.alumniProfiles.createOrUpdate(userId, updates);
  }

  async findVerifiedAlumniUsers() {
    const allUsers = await db.users.find();
    return allUsers.filter(u => u.role === 'ALUMNI' && u.verification_status === 'VERIFIED');
  }

  async findAllActiveMentorships() {
    const all = await db.activeMentorships.find();
    return all.filter(a => a.status === 'ACTIVE');
  }

  async findAllMilestones() {
    return await db.milestones.find();
  }

  async logAuditAction(adminId, action, targetUserId, details) {
    return await db.auditLogs.log(adminId, action, targetUserId, details);
  }
}

export const domainsRepository = new DomainsRepository();
