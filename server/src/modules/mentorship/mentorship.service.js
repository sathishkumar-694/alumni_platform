import { mentorshipRepository } from './mentorship.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class MentorshipService {
  async createRequest(user, payload) {
    const mentorId = payload.mentorId || payload.mentor_id;
    const domainId = payload.domainId || payload.domain_id;
    const message = payload.message;

    if (!mentorId) {
      throw new ApiError(400, 'Mentor ID (mentorId or mentor_id) is required');
    }

    const mentor = await mentorshipRepository.findUserById(mentorId);
    if (!mentor || mentor.role !== 'ALUMNI' || mentor.verification_status !== 'VERIFIED') {
      throw new ApiError(400, 'Invalid or unverified alumni mentor');
    }

    const existingReq = await mentorshipRepository.findPendingRequest(user.id, mentorId);
    if (existingReq) {
      throw new ApiError(400, 'You already have an active or pending request/waitlist with this mentor');
    }

    const profile = await mentorshipRepository.getAlumniProfile(mentorId);
    const maxCapacity = profile?.max_capacity || 5;
    const currentCapacity = profile?.current_capacity || 0;

    const isFull = currentCapacity >= maxCapacity;
    const status = isFull ? 'WAITLISTED' : 'PENDING';

    return await mentorshipRepository.createMentorshipRequest({
      student_id: user.id,
      mentor_id: mentorId,
      domain_id: domainId || 'd-1',
      status,
      message: message || (isFull ? 'Please add me to your mentorship waitlist.' : 'I would like to request career mentorship from you.')
    });
  }

  async respondToRequest(user, requestId, action) {
    const request = await mentorshipRepository.findRequestById(requestId);
    if (!request) {
      throw new ApiError(404, 'Mentorship request not found');
    }

    if (String(request.mentor_id) !== String(user.id)) {
      throw new ApiError(403, 'You are not authorized to respond to this request');
    }

    if (action === 'ACCEPT') {
      const allActive = await mentorshipRepository.findAllActiveMentorships();
      const existingActive = allActive.find(a => 
        String(a.student_id) === String(request.student_id) && 
        String(a.mentor_id) === String(request.mentor_id) && 
        a.status === 'ACTIVE'
      );

      await mentorshipRepository.updateRequest(requestId, { status: 'ACCEPTED' });

      if (existingActive) {
        return existingActive;
      }

      const activeMentorship = await mentorshipRepository.createActiveMentorship({
        student_id: request.student_id,
        mentor_id: request.mentor_id,
        domain_id: request.domain_id
      });

      const profile = await mentorshipRepository.getAlumniProfile(request.mentor_id);
      if (profile) {
        await mentorshipRepository.updateAlumniProfile(request.mentor_id, {
          current_capacity: (profile.current_capacity || 0) + 1
        });
      }

      return activeMentorship;
    } else if (action === 'REJECT') {
      await mentorshipRepository.updateRequest(requestId, { status: 'REJECTED' });
      return null;
    } else {
      throw new ApiError(400, "Invalid action. Must be 'ACCEPT' or 'REJECT'");
    }
  }

  async completeMentorship(user, mentorshipId) {
    const mentorship = await mentorshipRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Active mentorship record not found');
    }

    if (user.role !== 'ADMIN' && String(mentorship.mentor_id) !== String(user.id) && String(mentorship.student_id) !== String(user.id)) {
      throw new ApiError(403, 'Unauthorized to complete this mentorship');
    }

    const updated = await mentorshipRepository.updateActiveMentorship(mentorshipId, { status: 'COMPLETED' });

    const profile = await mentorshipRepository.getAlumniProfile(mentorship.mentor_id);
    if (profile) {
      await mentorshipRepository.updateAlumniProfile(mentorship.mentor_id, {
        current_capacity: Math.max(0, (profile.current_capacity || 1) - 1)
      });
    }

    return updated;
  }

  async getMyRequests(user) {
    const allReqs = await mentorshipRepository.findAllRequests();
    let userReqs = [];

    if (user.role === 'STUDENT') {
      userReqs = allReqs.filter(r => String(r.student_id) === String(user.id));
    } else if (user.role === 'ALUMNI') {
      userReqs = allReqs.filter(r => String(r.mentor_id) === String(user.id));
    } else if (user.role === 'ADMIN') {
      userReqs = allReqs;
    }

    return await Promise.all(userReqs.map(async (r) => {
      const student = await mentorshipRepository.findUserById(r.student_id);
      const studentProfile = await mentorshipRepository.getStudentProfile(r.student_id);
      const mentor = await mentorshipRepository.findUserById(r.mentor_id);
      const mentorProfile = await mentorshipRepository.getAlumniProfile(r.mentor_id);
      const domain = await mentorshipRepository.findDomainById(r.domain_id);
      return {
        ...r,
        student_name: student?.name,
        student_email: student?.email,
        student_profile: studentProfile,
        mentor_name: mentor?.name,
        mentor_email: mentor?.email,
        mentor_profile: mentorProfile,
        domain_name: domain?.name
      };
    }));
  }

  async getMyActiveMentorships(user) {
    const allActive = (await mentorshipRepository.findAllActiveMentorships()).filter(a => a.status === 'ACTIVE' || a.status === 'COMPLETED');
    let userActive = [];

    if (user.role === 'STUDENT') {
      userActive = allActive.filter(a => String(a.student_id) === String(user.id));
    } else if (user.role === 'ALUMNI') {
      userActive = allActive.filter(a => String(a.mentor_id) === String(user.id));
    } else if (user.role === 'ADMIN') {
      userActive = allActive;
    }

    // Deduplicate active mentorship records by unique student + mentor + status
    const uniqueMap = new Map();
    userActive.forEach(a => {
      const key = `${a.student_id}_${a.mentor_id}_${a.status}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, a);
      }
    });
    const deduplicatedActive = Array.from(uniqueMap.values());

    return await Promise.all(deduplicatedActive.map(async (a) => {
      const student = await mentorshipRepository.findUserById(a.student_id);
      const studentProfile = await mentorshipRepository.getStudentProfile(a.student_id);
      const mentor = await mentorshipRepository.findUserById(a.mentor_id);
      const mentorProfile = await mentorshipRepository.getAlumniProfile(a.mentor_id);
      const domain = await mentorshipRepository.findDomainById(a.domain_id);

      return {
        ...a,
        student: {
          id: student?.id,
          name: student?.name,
          email: student?.email,
          profile: studentProfile
        },
        mentor: {
          id: mentor?.id,
          name: mentor?.name,
          email: mentor?.email,
          profile: mentorProfile
        },
        domain
      };
    }));
  }

  async reassignMentorAdmin(adminId, mentorshipId, newMentorId, reason) {
    const mentorship = await mentorshipRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Active mentorship record not found');
    }

    const newMentor = await mentorshipRepository.findUserById(newMentorId);
    if (!newMentor || newMentor.role !== 'ALUMNI' || newMentor.verification_status !== 'VERIFIED') {
      throw new ApiError(400, 'Invalid or unverified target mentor');
    }

    const oldMentorId = mentorship.mentor_id;

    await mentorshipRepository.updateActiveMentorship(mentorshipId, { status: 'REASSIGNED' });

    const oldProfile = await mentorshipRepository.getAlumniProfile(oldMentorId);
    if (oldProfile) {
      await mentorshipRepository.updateAlumniProfile(oldMentorId, {
        current_capacity: Math.max(0, (oldProfile.current_capacity || 1) - 1)
      });
    }

    const newActive = await mentorshipRepository.createActiveMentorship({
      student_id: mentorship.student_id,
      mentor_id: newMentorId,
      domain_id: mentorship.domain_id
    });

    const newProfile = await mentorshipRepository.getAlumniProfile(newMentorId);
    if (newProfile) {
      await mentorshipRepository.updateAlumniProfile(newMentorId, {
        current_capacity: (newProfile.current_capacity || 0) + 1
      });
    }

    await mentorshipRepository.logAuditAction(
      adminId,
      'MENTOR_REASSIGNED',
      mentorship.student_id,
      `Admin reassigned student from mentor ${oldMentorId} to mentor ${newMentorId}.${reason ? ` Reason: ${reason}` : ''}`
    );

    return newActive;
  }

  async getAllMentorshipsMatrixAdmin() {
    const allActive = await mentorshipRepository.findAllActiveMentorships();
    return await Promise.all(allActive.map(async (a) => {
      const student = await mentorshipRepository.findUserById(a.student_id);
      const mentor = await mentorshipRepository.findUserById(a.mentor_id);
      const domain = await mentorshipRepository.findDomainById(a.domain_id);
      return {
        ...a,
        student_name: student?.name,
        student_email: student?.email,
        mentor_name: mentor?.name,
        mentor_email: mentor?.email,
        domain_name: domain?.name
      };
    }));
  }

  async getAllMentorshipRequestsAdmin() {
    const allReqs = await mentorshipRepository.findAllRequests();
    return await Promise.all(allReqs.map(async (r) => {
      const student = await mentorshipRepository.findUserById(r.student_id);
      const studentProfile = await mentorshipRepository.getStudentProfile(r.student_id);
      const mentor = await mentorshipRepository.findUserById(r.mentor_id);
      const mentorProfile = await mentorshipRepository.getAlumniProfile(r.mentor_id);
      const domain = await mentorshipRepository.findDomainById(r.domain_id);
      return {
        ...r,
        student_name: student?.name,
        student_email: student?.email,
        student_profile: studentProfile,
        mentor_name: mentor?.name,
        mentor_email: mentor?.email,
        mentor_profile: mentorProfile,
        domain_name: domain?.name
      };
    }));
  }
}

export const mentorshipService = new MentorshipService();
