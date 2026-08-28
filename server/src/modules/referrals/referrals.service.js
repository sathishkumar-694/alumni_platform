import { referralsRepository } from './referrals.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class ReferralsService {
  async getAllJobs() {
    const jobs = await referralsRepository.findAllJobs();
    return await Promise.all(jobs.map(async (j) => {
      const alumni = await referralsRepository.findUserById(j.alumni_id);
      const profile = await referralsRepository.findAlumniProfile(j.alumni_id);
      return {
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        postedBy: alumni?.name || 'Arumugam',
        alumniRole: profile?.designation || 'Lead Systems Engineer',
        experienceReq: j.experience_req || '0 - 1 Yr',
        skills: Array.isArray(j.skills) ? j.skills : [],
        referralOpen: j.status === 'OPEN',
        description: j.description,
        created_at: j.created_at
      };
    }));
  }

  async createJob(user, { title, company, location, experienceReq, skills, description }) {
    if (user.role !== 'ALUMNI' && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only verified alumni mentors or administrators can post internal job referrals');
    }

    const skillsArray = typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(skills) ? skills : [];

    return await referralsRepository.createJob({
      alumni_id: user.id,
      title,
      company,
      location,
      experience_req: experienceReq || '0 - 1 Yr',
      skills: skillsArray,
      description,
      status: 'OPEN'
    });
  }

  async applyForReferral(studentUser, jobId) {
    if (studentUser.role !== 'STUDENT') {
      throw new ApiError(403, 'Only verified students can submit referral applications');
    }

    const allApps = await referralsRepository.findAllApplications();
    const existing = allApps.find(a => String(a.job_id) === String(jobId) && String(a.student_id) === String(studentUser.id));
    if (existing) {
      throw new ApiError(400, 'You have already submitted an internal referral application for this job');
    }

    return await referralsRepository.createApplication({
      job_id: jobId,
      student_id: studentUser.id,
      status: 'PENDING'
    });
  }

  async getMyApplications(studentUser) {
    const allApps = await referralsRepository.findAllApplications();
    const myApps = allApps.filter(a => String(a.student_id) === String(studentUser.id));
    return myApps.map(a => a.job_id);
  }

  async getMentorIncomingApplications(alumniUser) {
    const allJobs = await referralsRepository.findAllJobs();
    const myJobs = allJobs.filter(j => String(j.alumni_id) === String(alumniUser.id));
    const myJobIds = myJobs.map(j => String(j.id));

    const allApps = await referralsRepository.findAllApplications();
    const incomingApps = allApps.filter(a => myJobIds.includes(String(a.job_id)));

    return await Promise.all(incomingApps.map(async (app) => {
      const student = await referralsRepository.findUserById(app.student_id);
      const job = myJobs.find(j => String(j.id) === String(app.job_id));
      return {
        id: app.id,
        job_id: app.job_id,
        job_title: job?.title || 'Software Engineering Role',
        company: job?.company || 'Tech Firm',
        student_name: student?.name || 'Ashwanth',
        student_email: student?.email || 'student@university.edu',
        status: app.status || 'PENDING',
        applied_at: app.applied_at
      };
    }));
  }
}

export const referralsService = new ReferralsService();
