import { announcementsRepository } from './announcements.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { uploadToCloud } from '../../config/cloudinary.js';

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

  async createAnnouncement(user, file, { title, content, category, targetDomainId, fileUrl }) {
    if (user.role !== 'ADMIN' && user.role !== 'ALUMNI') {
      throw new ApiError(403, 'Only verified mentors or administrators can publish announcements');
    }

    let attachmentUrl = fileUrl || '';
    let fileName = '';

    if (file) {
      attachmentUrl = await uploadToCloud(file.path, 'announcements');
      fileName = file.originalname;
    }

    const announcement = await announcementsRepository.createAnnouncement({
      author_id: user.id,
      title,
      content,
      category: category || 'GENERAL',
      target_domain_id: targetDomainId || null,
      file_url: attachmentUrl,
      file_name: fileName
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

  async deleteAnnouncement(user, id) {
    if (user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only administrators can delete announcements');
    }

    await announcementsRepository.deleteAnnouncement(id);

    await announcementsRepository.logAuditAction(
      user.id,
      'ANNOUNCEMENT_DELETED',
      '',
      `Deleted announcement '${id}'`
    );

    return { id };
  }
}

export const announcementsService = new AnnouncementsService();
