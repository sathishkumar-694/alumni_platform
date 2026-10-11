import { domainsRepository } from './domains.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { db } from '../../config/db.js';
import { rankMentorsGeneral } from '../recommendation/mentorCriteria.js';
import { notificationsService } from '../notifications/notifications.service.js';

export class DomainsService {
  async getDomainDetails(domainId) {
    const domain = await domainsRepository.findDomainById(domainId);
    if (!domain) {
      throw new ApiError(404, 'Technical domain not found');
    }

    // Fetch study resources related to this domain
    const allResources = await db.resources.find();
    const matchingResources = allResources.filter(r => String(r.domain_id) === String(domainId));
    const resourcesWithDetails = await Promise.all(matchingResources.map(async (r) => {
      const mentor = await db.users.findById(r.mentor_id);
      return {
        ...r,
        mentor_name: mentor?.name || 'Verified Alumni Mentor',
        mentor_email: mentor?.email || ''
      };
    }));

    // Fetch verified alumni mentors offering guidance in this domain
    const verifiedAlumni = await domainsRepository.findAllAlumniProfiles();
    const matchingAlumni = verifiedAlumni.filter(({ user, profile }) => {
      const exp = profile?.expertise || [];
      return exp.includes(domainId) || exp.includes(domain.name);
    });

    const allDomains = await domainsRepository.findAllDomains();
    const alumniToRank = matchingAlumni.map(({ user, profile }) => ({
      ...user,
      profile
    }));
    const rankedMentors = rankMentorsGeneral(alumniToRank, [domainId], allDomains);

    return {
      domain,
      resources: resourcesWithDetails,
      mentors: rankedMentors
    };
  }

  async getDomains(includeArchived = false) {
    const allDomains = await domainsRepository.findAllDomains();
    const verifiedAlumni = await domainsRepository.findAllAlumniProfiles().catch(() => []);

    return allDomains.map(domain => {
      const matchingAlumni = (verifiedAlumni || []).filter(({ user, profile }) => {
        const exp = profile?.expertise || [];
        return exp.includes(domain.id) || exp.includes(domain.name);
      });

      const mentorSummaries = matchingAlumni.map(({ user, profile }) => ({
        id: user.id,
        name: user.name,
        company: profile?.company || '',
        designation: profile?.designation || ''
      }));

      return {
        ...domain,
        mentors: mentorSummaries,
        stats: {
          interested_students: 5,
          available_mentors: mentorSummaries.length || 1,
          active_mentorships: 2,
          popularity_score: 85,
          growth_trend: 'High Demand'
        }
      };
    });
  }

  async toggleStudentInterest(userId, domainId) {
    let profile = await domainsRepository.findStudentProfileByUserId(userId);
    let interests = [];
    if (profile && profile.interests) {
      interests = Array.isArray(profile.interests) ? profile.interests : [];
    }

    const exists = interests.includes(domainId);
    const updatedInterests = exists ? interests.filter(id => id !== domainId) : [...interests, domainId];

    await domainsRepository.updateStudentProfile(userId, {
      interests: updatedInterests,
      department: profile?.department || 'Computer Science & Engineering',
      academic_year: profile?.academic_year || '4th Year'
    });

    if (!exists) {
      const dom = await domainsRepository.findDomainById(domainId);
      await notificationsService.createNotification({
        user_id: userId,
        type: 'DOMAIN_INTEREST',
        title: '🌟 Domain Tracked',
        desc: `You tracked interest in ${dom?.name || 'Technical Domain'}. Recommended mentors and study resources will align with this track.`,
        target_tab: 'explore'
      }).catch(() => {});
    }

    return { interests: updatedInterests, isInterested: !exists };
  }

  async toggleAlumniExpertise(userId, domainId) {
    let profile = await domainsRepository.findAlumniProfileByUserId(userId);
    let expertise = [];
    if (profile && profile.expertise) {
      expertise = Array.isArray(profile.expertise) ? profile.expertise : [];
    }

    const exists = expertise.includes(domainId);
    const updatedExpertise = exists ? expertise.filter(id => id !== domainId) : [...expertise, domainId];

    await domainsRepository.updateAlumniProfile(userId, {
      expertise: updatedExpertise,
      company: profile?.company || 'Industry Partner',
      designation: profile?.designation || 'Alumni Mentor'
    });

    if (!exists) {
      const dom = await domainsRepository.findDomainById(domainId);
      await notificationsService.createNotification({
        user_id: userId,
        type: 'DOMAIN_EXPERTISE',
        title: '🌟 Mentorship Track Activated',
        desc: `You activated guidance for ${dom?.name || 'Technical Domain'}. Students can now discover and request you as a mentor.`,
        target_tab: 'explore'
      }).catch(() => {});
    }

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

    const createdReq = await domainsRepository.createDomainRequest({
      mentor_id: mentorUser.id,
      name: name.trim(),
      description: description || ''
    });

    await notificationsService.createNotification({
      user_id: mentorUser.id,
      type: 'DOMAIN_REQUESTED',
      title: 'Technical Domain Requested',
      desc: `Your request for domain "${name.trim()}" has been submitted for administrative review.`,
      target_tab: 'explore'
    }).catch(() => {});

    return createdReq;
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

  async rejectDomainRequest(adminUser, requestId, reason = '') {
    const req = await domainsRepository.findDomainRequestById(requestId);
    if (!req) {
      throw new ApiError(404, 'Domain request not found');
    }

    await domainsRepository.updateDomainRequestStatus(requestId, 'REJECTED');

    if (req.mentor_id) {
      await notificationsService.createNotification({
        user_id: req.mentor_id,
        type: 'DOMAIN_REJECTED',
        title: 'Technical Domain Request Declined',
        desc: reason ? `Your request for '${req.name}' was declined. Reason: ${reason}` : `Your request for '${req.name}' was not approved.`,
        target_tab: 'explore'
      }).catch(() => {});
    }
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
