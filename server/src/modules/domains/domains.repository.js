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

  async createDomainRequest({ mentor_id, name, description }) {
    return await db.domainRequests.create({ mentor_id, name, description });
  }

  async findPendingDomainRequests() {
    return await db.domainRequests.findPending();
  }

  async findDomainRequestById(id) {
    return await db.domainRequests.findById(id);
  }

  async updateDomainRequestStatus(id, status) {
    return await db.domainRequests.updateStatus(id, status);
  }

  async createNotification(data) {
    return await db.notifications.create(data);
  }

  async findStudentProfileByUserId(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async updateStudentProfile(userId, updates) {
    return await db.studentProfiles.update(userId, updates);
  }

  async findAlumniProfileByUserId(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async updateAlumniProfile(userId, updates) {
    return await db.alumniProfiles.update(userId, updates);
  }

  async findAllStudentProfiles() {
    const allUsers = await db.users.find();
    const students = allUsers.filter(u => u.role === 'STUDENT');
    const profiles = await Promise.all(students.map(u => db.studentProfiles.findByUserId(u.id)));
    return profiles.filter(Boolean);
  }

  async findAllAlumniProfiles() {
    const allUsers = await db.users.find();
    const alumni = allUsers.filter(u => u.role === 'ALUMNI' && u.verification_status === 'VERIFIED');
    const profiles = await Promise.all(alumni.map(async u => {
      const p = await db.alumniProfiles.findByUserId(u.id);
      return { user: u, profile: p };
    }));
    return profiles.filter(p => p.profile);
  }

  async findAllActiveMentorships() {
    return await db.activeMentorships.find();
  }
}

export const domainsRepository = new DomainsRepository();
