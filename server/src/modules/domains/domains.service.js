import { domainsRepository } from './domains.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class DomainsService {
  async getDomains(includeArchived = false) {
    const allDomains = await domainsRepository.findAllDomains();
    return allDomains.map(domain => ({
      ...domain,
      stats: {
        interested_students: 5,
        available_mentors: 3,
        active_mentorships: 2,
        popularity_score: 85,
        growth_trend: 'High Demand'
      }
    }));
  }

  async toggleStudentInterest(userId, domainId) {
    const profile = await domainsRepository.findStudentProfileByUserId(userId);
    if (!profile) throw new ApiError(404, 'Student profile not found');

    const interests = profile.interests || [];
    const exists = interests.includes(domainId);
    const updatedInterests = exists ? interests.filter(id => id !== domainId) : [...interests, domainId];

    await domainsRepository.updateStudentProfile(userId, { interests: updatedInterests });
    return { interests: updatedInterests, isInterested: !exists };
  }

  async toggleAlumniExpertise(userId, domainId) {
    const profile = await domainsRepository.findAlumniProfileByUserId(userId);
    if (!profile) throw new ApiError(404, 'Alumni profile not found');

    const expertise = profile.expertise || [];
    const exists = expertise.includes(domainId);
    const updatedExpertise = exists ? expertise.filter(id => id !== domainId) : [...expertise, domainId];

    await domainsRepository.updateAlumniProfile(userId, { expertise: updatedExpertise });
    return { expertise: updatedExpertise, isExpert: !exists };
  }

  async requestNewDomain(mentorUser, { name, description }) {
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Technical domain name is required');
    }

    const existing = await domainsRepository.findDomainByName(name.trim());
    if (existing) {
      throw new ApiError(400, `Technical domain '${name}' already exists in active directory`);
    }

    return await domainsRepository.createDomainRequest({
      mentor_id: mentorUser.id,
      name: name.trim(),
      description: description || ''
    });
  }

  async getPendingDomainRequests() {
    return await domainsRepository.findPendingDomainRequests();
  }

  async approveDomainRequest(adminUser, requestId) {
    const req = await domainsRepository.findDomainRequestById(requestId);
    if (!req) {
      throw new ApiError(404, 'Domain request not found');
    }

    if (req.status !== 'PENDING') {
      throw new ApiError(400, `Domain request is already ${req.status}`);
    }

    const newDomain = await domainsRepository.createDomain({
      name: req.name,
      category: 'Core Engineering',
      description: req.description || 'Approved technical domain requested by mentor.'
    });

    await domainsRepository.updateDomainRequestStatus(requestId, 'APPROVED');

    await domainsRepository.createNotification({
      user_id: req.mentor_id,
      type: 'DOMAIN_APPROVED',
      title: '🎉 Technical Domain Approved!',
      desc: `Your requested domain '${req.name}' was approved by University Administration and is now live!`,
      target_tab: 'explore'
    });

    return newDomain;
  }

  async rejectDomainRequest(adminUser, requestId) {
    const req = await domainsRepository.findDomainRequestById(requestId);
    if (!req) {
      throw new ApiError(404, 'Domain request not found');
    }

    await domainsRepository.updateDomainRequestStatus(requestId, 'REJECTED');
    return true;
  }

  async createDomain(adminId, { name, description }) {
    if (!name) {
      throw new ApiError(400, 'Domain name is required');
    }

    const existing = await domainsRepository.findDomainByName(name);
    if (existing) {
      throw new ApiError(400, 'A domain with this name already exists');
    }

    return await domainsRepository.createDomain({
      name,
      description: description || ''
    });
  }
}

export const domainsService = new DomainsService();
