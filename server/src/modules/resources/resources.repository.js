import { db } from '../../config/db.js';

export class ResourcesRepository {
  async findAllResources() {
    return await db.resources.find();
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async findDomainById(id) {
    return await db.domains.findById(id);
  }

  async createResource(resourceData) {
    return await db.resources.create(resourceData);
  }
}

export const resourcesRepository = new ResourcesRepository();
