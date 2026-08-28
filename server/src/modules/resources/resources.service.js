import { resourcesRepository } from './resources.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { uploadToCloud } from '../../config/cloudinary.js';

export class ResourcesService {
  async getResources(domainId) {
    const allResources = await resourcesRepository.findAllResources();

    let filtered = allResources;
    if (domainId) {
      filtered = allResources.filter(r => r.domain_id === domainId);
    }

    return await Promise.all(filtered.map(async (r) => {
      const mentor = await resourcesRepository.findUserById(r.mentor_id);
      const domain = await resourcesRepository.findDomainById(r.domain_id);
      return {
        ...r,
        mentor_name: mentor?.name || 'Verified Alumni',
        domain_name: domain?.name || 'General Engineering'
      };
    }));
  }

  async createResource(user, file, { domainId, title, description, externalLink }) {
    if (user.role !== 'ALUMNI' && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only verified mentors or administrators can share resources');
    }

    let fileUrl = '';
    if (file) {
      fileUrl = await uploadToCloud(file.path, 'study_resources');
    }

    return await resourcesRepository.createResource({
      mentor_id: user.id,
      domain_id: domainId || 'd-1',
      title,
      description: description || '',
      file_url: fileUrl,
      external_link: externalLink || ''
    });
  }
}

export const resourcesService = new ResourcesService();
