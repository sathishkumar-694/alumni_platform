import { auditRepository } from './audit.repository.js';

export class AuditService {
  async getAuditLogs() {
    const logs = await auditRepository.findAllAuditLogs();
    return await Promise.all(logs.map(async (l) => {
      const admin = await auditRepository.findUserById(l.admin_id);
      const targetUser = l.target_user_id ? await auditRepository.findUserById(l.target_user_id) : null;
      return {
        ...l,
        admin_name: admin?.name || 'Administrator',
        target_user_name: targetUser?.name || '-'
      };
    }));
  }
}

export const auditService = new AuditService();
