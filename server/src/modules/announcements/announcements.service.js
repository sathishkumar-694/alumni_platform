import { announcementsRepository } from './announcements.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class AnnouncementsService {
  async getAnnouncements(category, targetDomainId) {
    const announcements = await announcementsRepository.findAllAnnouncements();

    let filtered = announcements;
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }
    if (targetDomainId) {
      filtered = filtered.filter(a => a.target_domain_id === targetDomainId);
    }

    return await Promise.all(filtered.map(async (a) => {
      const author = await announcementsRepository.findUserById(a.author_id);
      const domain = a.target_domain_id ? await announcementsRepository.findDomainById(a.target_domain_id) : null;
      return {
        ...a,
        author_name: author?.name || 'University Mentorship Operations',
        author_role: author?.role || 'ADMIN',
        target_domain_name: domain?.name || 'All Career Domains'
      };
    }));
  }

  async createAnnouncement(user, { title, content, category, targetDomainId }) {
    if (user.role !== 'ADMIN' && user.role !== 'ALUMNI') {
      throw new ApiError(403, 'Only verified mentors or administrators can publish announcements');
    }

    const announcement = await announcementsRepository.createAnnouncement({
      author_id: user.id,
      title,
      content,
      category: category || 'GENERAL',
      target_domain_id: targetDomainId || null
    });

    if (user.role === 'ADMIN') {
      await announcementsRepository.logAuditAction(
        user.id,
        'ANNOUNCEMENT_PUBLISHED',
        '',
        `Published announcement '${title}' under category ${category}`
      );
    }

    return announcement;
  }
}

export const announcementsService = new AnnouncementsService();
