import { db } from '../../config/db.js';

export class AuditRepository {
  async findAllAuditLogs() {
    return await db.auditLogs.find();
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }
}

export const auditRepository = new AuditRepository();
