import { analyticsRepository } from './analytics.repository.js';

export class AnalyticsService {
  async getOperationsCenterAnalytics() {
    const allUsers = await analyticsRepository.findAllUsers();
    const students = allUsers.filter(u => u.role === 'STUDENT');
    const alumni = allUsers.filter(u => u.role === 'ALUMNI');

    const pendingVerifications = allUsers.filter(u => u.verification_status === 'PENDING').length;
    const verifiedStudents = students.filter(u => u.verification_status === 'VERIFIED').length;
    const verifiedAlumni = alumni.filter(u => u.verification_status === 'VERIFIED').length;

    const activeMentorships = (await analyticsRepository.findAllActiveMentorships()).filter(a => a.status === 'ACTIVE').length;
    const requests = await analyticsRepository.findAllMentorshipRequests();
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length;

    const sessions = await analyticsRepository.findAllSessions();
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
    const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED').length;

    const milestones = await analyticsRepository.findAllMilestones();
    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const inProgressMilestones = milestones.filter(m => m.status === 'IN_PROGRESS').length;

    const domains = await analyticsRepository.findAllActiveDomains();

    return {
      kpi: {
        total_students: students.length,
        verified_students: verifiedStudents,
        total_alumni: alumni.length,
        verified_alumni: verifiedAlumni,
        pending_verifications: pendingVerifications,
        active_mentorships: activeMentorships,
        total_requests: totalRequests,
        pending_requests: pendingRequests,
        session_completion_rate: sessions.length ? Math.round((completedSessions / sessions.length) * 100) : 0,
        milestone_completion_rate: milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0
      },
      sessions_overview: {
        total: sessions.length,
        completed: completedSessions,
        scheduled: scheduledSessions
      },
      milestones_overview: {
        total: milestones.length,
        completed: completedMilestones,
        in_progress: inProgressMilestones
      },
      domains_count: domains.length
    };
  }
}

export const analyticsService = new AnalyticsService();
