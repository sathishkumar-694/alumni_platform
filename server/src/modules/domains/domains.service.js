import { domainsRepository } from './domains.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class DomainsService {
  async getDomains(includeArchived = false) {
    const allDomains = await domainsRepository.findAllDomains();
    const filtered = includeArchived ? allDomains : allDomains.filter(d => !d.is_archived);

    const studentProfiles = await domainsRepository.findAllStudentProfiles();
    const alumniProfiles = await domainsRepository.findAllVerifiedAlumniProfiles();
    const activeMentorships = await domainsRepository.findAllActiveMentorships();
    const allMilestones = await domainsRepository.findAllMilestones();

    return filtered.map(domain => {
      const interestedStudentsCount = studentProfiles.filter(p => (p.interests || []).includes(domain.id)).length;
      const availableMentorsCount = alumniProfiles.filter(p => (p.expertise || []).includes(domain.id)).length;
      const domainActiveMentorships = activeMentorships.filter(a => a.domain_id === domain.id);
      const activeMentorshipsCount = domainActiveMentorships.length;

      const domainMentorshipIds = domainActiveMentorships.map(a => a.id);
      const domainMilestones = allMilestones.filter(m => domainMentorshipIds.includes(m.mentorship_id));
      const completedMilestones = domainMilestones.filter(m => m.status === 'COMPLETED').length;

      const completionRate = domainMilestones.length > 0 
        ? Math.round((completedMilestones / domainMilestones.length) * 100) 
        : 0;

      const popularityScore = interestedStudentsCount * 2 + availableMentorsCount * 3 + activeMentorshipsCount * 5;
      const growthTrend = popularityScore > 15 ? 'High Demand' : popularityScore > 5 ? 'Growing' : 'Emerging';

      return {
        ...domain,
        stats: {
          interested_students: interestedStudentsCount,
          available_mentors: availableMentorsCount,
          active_mentorships: activeMentorshipsCount,
          total_milestones: domainMilestones.length,
          completed_milestones: completedMilestones,
          milestone_completion_rate: completionRate,
          popularity_score: popularityScore,
          growth_trend: growthTrend
        }
      };
    });
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

  async getDomainMentors(domainId) {
    const verifiedAlumni = await domainsRepository.findVerifiedAlumniUsers();
    const alumniProfiles = await domainsRepository.findAllVerifiedAlumniProfiles();

    const matchingMentors = [];
    for (const mentor of verifiedAlumni) {
      const p = alumniProfiles.find(ap => ap.user_id === mentor.id);
      if (p && (p.expertise || []).includes(domainId)) {
        matchingMentors.push({
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          profile: p
        });
      }
    }
    return matchingMentors;
  }

  async createDomain(adminId, { name, category, description, icon }) {
    if (!name || !category) {
      throw new ApiError(400, 'Domain name and category are required');
    }

    const existing = await domainsRepository.findDomainByName(name);
    if (existing) {
      throw new ApiError(400, 'A domain with this name already exists');
    }

    const newDomain = await domainsRepository.createDomain({
      name,
      category,
      description: description || '',
      icon: icon || 'Code'
    });

    await domainsRepository.logAuditAction(adminId, 'DOMAIN_CREATED', '', `Created domain '${name}' (${category})`);

    return newDomain;
  }

  async updateDomain(adminId, domainId, { name, category, description, icon, is_archived }) {
    const domain = await domainsRepository.findDomainById(domainId);
    if (!domain) {
      throw new ApiError(404, 'Domain not found');
    }

    const updated = await domainsRepository.updateDomain(domainId, {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(is_archived !== undefined && { is_archived: Boolean(is_archived) })
    });

    await domainsRepository.logAuditAction(adminId, 'DOMAIN_UPDATED', '', `Updated domain '${domain.name}'`);

    return updated;
  }
}

export const domainsService = new DomainsService();
