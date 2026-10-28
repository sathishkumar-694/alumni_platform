import { referralsRepository } from './referrals.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { uploadToCloud } from '../../config/cloudinary.js';
import { notificationsService } from '../notifications/notifications.service.js';

export class ReferralsService {
  async getAllJobs(user) {
    const jobs = await referralsRepository.findAllJobs();
    return await Promise.all(jobs.map(async (j) => {
      const alumni = await referralsRepository.findUserById(j.alumni_id);
      const profile = await referralsRepository.findAlumniProfile(j.alumni_id);
      return {
        id: j.id,
        is_owner: String(j.alumni_id) === String(user?.id),
        title: j.title,
        company: j.company,
        location: j.location,
        postedBy: alumni?.name || 'Alumni Mentor',
        alumniRole: profile?.designation || 'Alumni Specialist',
        experienceReq: j.experience_req || '0 - 1 Yr',
        skills: Array.isArray(j.skills) ? j.skills : [],
        referralOpen: j.status === 'OPEN',
        description: j.description,
        file_url: j.file_url || null,
        file_name: j.file_name || null,
        created_at: j.created_at
      };
    }));
  }

  async createJob(user, { title, company, location, experienceReq, skills, description }, file = null) {
    if (user.role !== 'ALUMNI' && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only verified alumni mentors or administrators can post internal job referrals');
    }

    const skillsArray = typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(skills) ? skills : [];

    let fileUrl = null;
    let fileName = null;
    if (file) {
      fileUrl = await uploadToCloud(file.path, 'job_descriptions');
      fileName = file.originalname || 'job_description.pdf';
    }

    const newJob = await referralsRepository.createJob({
      alumni_id: user.id,
      title,
      company,
      location,
      experience_req: experienceReq || '0 - 1 Yr',
      skills: skillsArray,
      description,
      file_url: fileUrl,
      file_name: fileName,
      status: 'OPEN'
    });

    // Notify job creator
    await notificationsService.createNotification({
      user_id: user.id,
      type: 'JOB_POSTED',
      title: '💼 Job Referral Published',
      desc: `Your job posting "${title}" at ${company} is now live on the student referral board.`,
      target_tab: 'referrals'
    }).catch(() => {});

    return newJob;
  }

  async applyForReferral(studentUser, jobId, resumeFile) {
    if (studentUser.role !== 'STUDENT') {
      throw new ApiError(403, 'Only verified students can submit referral applications');
    }
    if (!resumeFile) throw new ApiError(400, 'A resume file is required');
    const resumeUrl = `/uploads/${resumeFile.filename}`;

    const allApps = await referralsRepository.findAllApplications();
    const existing = allApps.find(a => String(a.job_id) === String(jobId) && String(a.student_id) === String(studentUser.id));
    if (existing) {
      throw new ApiError(400, 'You have already submitted an internal referral application for this job');
    }

    const newApp = await referralsRepository.createApplication({
      job_id: jobId,
      student_id: studentUser.id,
      resume_url: resumeUrl,
      resume_name: resumeFile.originalname,
      status: 'PENDING'
    });

    const job = await referralsRepository.findJobById(jobId);

    // Notify student
    await notificationsService.createNotification({
      user_id: studentUser.id,
      type: 'APPLICATION_SUBMITTED',
      title: '💼 Application Submitted',
      desc: `Your referral application for "${job?.title || 'Job'}" at ${job?.company || 'Company'} was submitted.`,
      target_tab: 'referrals'
    }).catch(() => {});

    // Notify alumni job poster
    if (job?.alumni_id) {
      await notificationsService.createNotification({
        user_id: job.alumni_id,
        type: 'REFERRAL_APPLICATION',
        title: '💼 New Referral Application',
        desc: `${studentUser.name || 'A student'} applied for your referral posting: "${job.title}".`,
        target_tab: 'referrals'
      }).catch(() => {});
    }

    return newApp;
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
        student_name: student?.name || 'Student Applicant',
        student_email: student?.email || 'N/A',
        resume_url: app.resume_url || null,
        resume_name: app.resume_name || null,
        status: app.status || 'PENDING',
        applied_at: app.applied_at
      };
    }));
  }

  async updateApplicationStatus(alumniUser, applicationId, status) {
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new ApiError(400, 'Status must be APPROVED or REJECTED');
    const application = (await referralsRepository.findAllApplications()).find(a => String(a.id) === String(applicationId));
    if (!application) throw new ApiError(404, 'Referral application not found');
    const job = await referralsRepository.findJobById(application.job_id);
    if (!job || String(job.alumni_id) !== String(alumniUser.id)) throw new ApiError(403, 'You can only review applications to your own referrals');
    return await referralsRepository.updateApplicationStatus(applicationId, status);
  }
}

export const referralsService = new ReferralsService();
