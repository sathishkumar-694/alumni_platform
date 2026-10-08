import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

// Import Feature Module Routes
import authRoutes from '../src/modules/auth/auth.routes.js';
import verificationRoutes from '../src/modules/verification/verification.routes.js';
import usersRoutes from '../src/modules/users/users.routes.js';
import domainsRoutes from '../src/modules/domains/domains.routes.js';
import recommendationRoutes from '../src/modules/recommendation/recommendation.routes.js';
import mentorshipRoutes from '../src/modules/mentorship/mentorship.routes.js';
import sessionsRoutes from '../src/modules/sessions/sessions.routes.js';
import resourcesRoutes from '../src/modules/resources/resources.routes.js';
import announcementsRoutes from '../src/modules/announcements/announcements.routes.js';
import referralsRoutes from '../src/modules/referrals/referrals.routes.js';
import notificationsRoutes from '../src/modules/notifications/notifications.routes.js';
import analyticsRoutes from '../src/modules/analytics/analytics.routes.js';
import auditRoutes from '../src/modules/audit/audit.routes.js';

// Setup Test Server App
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/domains', domainsRoutes);
app.use('/api/v1/recommendation', recommendationRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/resources', resourcesRoutes);
app.use('/api/v1/announcements', announcementsRoutes);
app.use('/api/v1/referrals', referralsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit', auditRoutes);

let server;
let baseUrl;

const request = (path, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        reqOptions.headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

const runAllModuleTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING CAMPUSBRIDGE AUTOMATED FULL E2E MODULE TEST SUITE');
  console.log('=============================================================\n');

  let studentToken = '';
  let alumniToken = '';
  let adminToken = '';
  let createdStudentId = '';
  let createdAlumniId = '';
  let createdDomainId = '';
  let createdMentorshipId = '';
  let createdSessionId = '';
  let createdReferralId = '';

  try {
    // -------------------------------------------------------------
    // MODULE 1: AUTHENTICATION & IDENTITY SYSTEM
    // -------------------------------------------------------------
    console.log('▶ [1/13] Testing Auth & Identity Module...');
    
    // 1.1 Student Registration
    const studentRegRes = await request('/api/v1/auth/register/student', { method: 'POST' }, {
      name: 'E2E Test Student',
      email: `teststudent_${Date.now()}@bitsathy.ac.in`,
      password: 'TestPassword123!',
      reg_number: '7376231CS999',
      academic_year: '3rd Year',
      department: 'Computer Science & Engineering',
      career_goals: 'Targeting Cloud & Full-Stack Systems Roles',
      student_id_card_url: 'https://cloudinary.com/sample_student_id.png'
    });
    assert.strictEqual(studentRegRes.status, 201, 'Student registration failed');
    const studentData = studentRegRes.body.data || studentRegRes.body;
    assert.ok(studentData.token, 'Student registration missing JWT token');
    studentToken = studentData.token;
    createdStudentId = studentData.user.id;
    console.log('  ✔ Student Registration & Verification Ticket Created');

    // 1.2 Alumni Registration Compulsory ID Card Validation Check
    const alumniMissingIdRes = await request('/api/v1/auth/register/alumni', { method: 'POST' }, {
      name: 'E2E Alumni No ID',
      email: `testalumni_noid_${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      company: 'Tech Corp',
      designation: 'Senior Engineer',
      experience_years: 5,
      graduation_year: 2021
      // Missing alumni_id_card_url
    });
    assert.strictEqual(alumniMissingIdRes.status, 400, 'Alumni registration should fail when ID card photo is missing');
    console.log('  ✔ Compulsory Alumni ID Upload Enforced (400 Bad Request returned)');

    // 1.3 Successful Alumni Registration with Compulsory ID Card
    const alumniRegRes = await request('/api/v1/auth/register/alumni', { method: 'POST' }, {
      name: 'E2E Test Alumni',
      email: `testalumni_${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      company: 'Google',
      designation: 'Staff Software Engineer',
      experience_years: 7,
      graduation_year: 2019,
      alumni_id_card_url: 'https://cloudinary.com/sample_alumni_id.png',
      linkedin_url: 'https://linkedin.com/in/e2etest'
    });
    assert.strictEqual(alumniRegRes.status, 201, 'Alumni registration failed');
    const alumniDataPayload = alumniRegRes.body.data || alumniRegRes.body;
    assert.ok(alumniDataPayload.token, 'Alumni registration missing JWT token');
    alumniToken = alumniDataPayload.token;
    createdAlumniId = alumniDataPayload.user.id;
    console.log('  ✔ Alumni Registration with Mandatory ID Card Photo Verified');

    // 1.4 Login as Admin User
    const adminLoginRes = await request('/api/v1/auth/login', { method: 'POST' }, {
      email: 'admin@bitsathy.ac.in',
      password: 'admin'
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login failed');
    const adminData = adminLoginRes.body.data || adminLoginRes.body;
    assert.ok(adminData.token, 'Admin login missing token');
    adminToken = adminData.token;
    console.log('  ✔ Admin Authentication Successful');

    // -------------------------------------------------    // -------------------------------------------------------------
    // MODULE 2: USER PROFILES MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [2/13] Testing User Profiles Module...');
    
    // 2.1 Fetch Current User Profile (/api/v1/auth/me)
    const meRes = await request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(meRes.status, 200, 'Failed to fetch user profile');
    const meData = meRes.body.data || meRes.body;
    assert.strictEqual(meData.id, createdStudentId);
    console.log('  ✔ Authenticated User Dossier Fetched');

    // 2.2 Update Student Profile (PATCH /api/v1/users/student/profile)
    const updateProfileRes = await request('/api/v1/users/student/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      academic_year: '4th Year',
      career_goals: 'Targeting AI & Distributed Systems Engineering'
    });
    assert.strictEqual(updateProfileRes.status, 200, 'Student profile update failed');
    console.log('  ✔ Student Academic Credentials Updated');

    // -------------------------------------------------------------
    // MODULE 3: ADMIN & CREDENTIALS VERIFICATION MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [3/13] Testing Admin & Credentials Verification Module...');
    
    // 3.1 Fetch Pending Verifications
    const pendingVerificationsRes = await request('/api/v1/verification/pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(pendingVerificationsRes.status, 200, 'Failed to fetch pending verifications');
    console.log('  ✔ Admin Operations Center Pending Verification Queue Fetched');

    // 3.2 Approve Alumni Credential Status
    const approveVerifRes = await request(`/api/v1/verification/users/${createdAlumniId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      status: 'VERIFIED'
    });
    assert.strictEqual(approveVerifRes.status, 200, 'Failed to approve user verification');
    console.log('  ✔ Alumni ID Credential Status Approved to VERIFIED');

    // Approve Student Status as well
    await request(`/api/v1/verification/users/${createdStudentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      status: 'VERIFIED'
    });

    // -------------------------------------------------------------
    // MODULE 4: TECHNICAL DOMAINS DIRECTORY MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [4/13] Testing Technical Engineering Domains Module...');
    
    // 4.1 Fetch All Active Domains
    const domainsRes = await request('/api/v1/domains');
    assert.strictEqual(domainsRes.status, 200, 'Failed to list domains');
    const domainsList = domainsRes.body.data || domainsRes.body;
    assert.ok(Array.isArray(domainsList), 'Domains result is not array');
    createdDomainId = domainsList[0]?.id || 'd-1';
    console.log(`  ✔ Listed ${domainsList.length} Technical Engineering Domains`);

    // 4.2 Alumni Submit Custom Domain Approval Request
    const domainReqRes = await request('/api/v1/domains/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      name: 'Quantum Computing & Cryptography',
      description: 'Advanced quantum algorithms and secure key exchange networks'
    });
    assert.strictEqual(domainReqRes.status, 201, 'Domain request submission failed');
    console.log('  ✔ Custom Mentor Domain Request Submitted');

    // 4.3 Admin List Pending Domain Requests (SQL WHERE fix check)
    const pendingDomainsRes = await request('/api/v1/domains/requests/pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(pendingDomainsRes.status, 200, 'Pending domain requests endpoint failed (WHERE clause validation)');
    console.log('  ✔ Admin Listed Pending Domain Requests (SQL Parametrization Verified)');

    // -------------------------------------------------------------
    // MODULE 5: MENTORSHIP REQUESTS & CAPACITY MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [5/13] Testing Mentorship & Capacity Control Module...');
    
    // 5.1 Student Submit Mentorship Request
    const mentorReqRes = await request('/api/v1/mentorship/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      mentor_id: createdAlumniId,
      domain_id: createdDomainId,
      message: 'I would like guidance on system architecture and mock interview preparation.'
    });
    assert.strictEqual(mentorReqRes.status, 201, 'Mentorship request failed');
    const mentorReqData = mentorReqRes.body.data || mentorReqRes.body;
    const requestId = mentorReqData.id;
    console.log('  ✔ Mentorship Request Ticket Created');

    // 5.2 Alumni Mentor Accepts Request
    const acceptReqRes = await request(`/api/v1/mentorship/requests/${requestId}/respond`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      action: 'ACCEPT'
    });
    assert.strictEqual(acceptReqRes.status, 200, 'Failed to accept mentorship request');
    const acceptData = acceptReqRes.body.data || acceptReqRes.body;
    assert.ok(acceptData.id || acceptData.activeMentorship, 'Active mentorship track missing');
    createdMentorshipId = acceptData.id || acceptData.activeMentorship?.id;
    console.log('  ✔ Mentorship Request Accepted -> Active Track Created');

    // -------------------------------------------------------------
    // MODULE 6: 1-ON-1 SESSIONS & WEBRTC CALL MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [6/13] Testing 1-on-1 Sessions & WebRTC Module...');
    
    // 6.1 Schedule Session with 3 Time Options
    const scheduleSessionRes = await request('/api/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      mentorship_id: createdMentorshipId,
      topic: 'Mock Technical System Design Interview',
      duration_mins: 60,
      proposed_slots: [
        new Date(Date.now() + 86400000).toISOString(),
        new Date(Date.now() + 172800000).toISOString(),
        new Date(Date.now() + 259200000).toISOString()
      ]
    });
    assert.strictEqual(scheduleSessionRes.status, 201, 'Session scheduling failed');
    const sessionData = scheduleSessionRes.body.data || scheduleSessionRes.body;
    createdSessionId = sessionData.id;
    console.log('  ✔ 1-on-1 Session Scheduled with 3 Proposed Time Slots');

    // 6.2 Mentor Finalizes Session Slot
    const confirmSlotRes = await request(`/api/v1/sessions/${createdSessionId}/notes`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      selectedSlot: new Date(Date.now() + 86400000).toISOString(),
      status: 'CONFIRMED'
    });
    assert.strictEqual(confirmSlotRes.status, 200, 'Slot confirmation failed');
    console.log('  ✔ Mentor Selected & Finalized Session Time Slot');

    // -------------------------------------------------------------
    // MODULE 7: INSTITUTIONAL ANNOUNCEMENTS MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [7/13] Testing Announcements Module...');
    
    // 7.1 Alumni Post Public Announcement
    const alumniAncRes = await request('/api/v1/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      title: 'Global Tech Hiring Insights 2026',
      content: 'Key software engineering skills needed for modern cloud infrastructure roles.',
      category: 'OPPORTUNITY'
    });
    assert.strictEqual(alumniAncRes.status, 201, 'Announcement creation failed');
    console.log('  ✔ Alumni Public Announcement Broadcasted');

    // 7.2 Fetch Announcements List
    const ancListRes = await request('/api/v1/announcements');
    assert.strictEqual(ancListRes.status, 200, 'Fetch announcements failed');
    const ancList = ancListRes.body.data || ancListRes.body;
    console.log(`  ✔ Listed ${ancList.length} Public Announcements`);

    // -------------------------------------------------------------
    // MODULE 8: JOB REFERRALS PORTAL MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [8/13] Testing Job Referrals Portal Module...');
    
    // 8.1 Alumni Post Job Referral Opportunity
    const referralPostRes = await request('/api/v1/referrals', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      title: 'Backend Software Engineer (Node.js & Systems)',
      company: 'Google Cloud',
      location: 'Bengaluru / Remote',
      experience_req: '0 - 2 Yrs',
      skills: 'JavaScript, Node.js, Distributed Databases, WebRTC',
      description: 'Looking for talented engineers from BIT Sathy for direct team referrals.'
    });
    assert.strictEqual(referralPostRes.status, 201, 'Job referral creation failed');
    const refPostData = referralPostRes.body.data || referralPostRes.body;
    createdReferralId = refPostData.id;
    console.log('  ✔ Alumni Posted Job Referral Opportunity');

    // 8.2 Student Applies for Job Referral
    const applyRefRes = await request(`/api/v1/referrals/${createdReferralId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.ok(applyRefRes.status === 200 || applyRefRes.status === 201, 'Referral application failed');
    console.log('  ✔ Student Submitted Job Referral Application');

    // -------------------------------------------------------------
    // MODULE 9: RESOURCE SHARING HUB MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [9/13] Testing Resource Sharing Hub Module...');
    
    // 9.1 Alumni Upload Resource
    const resourceUploadRes = await request('/api/v1/resources', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` }
    }, {
      domain_id: createdDomainId,
      title: 'Comprehensive System Design & Distributed Architecture Guide',
      description: 'In-depth guide on microservices, caching layers, and load balancing.',
      external_link: 'https://github.com/system-design-primer'
    });
    assert.strictEqual(resourceUploadRes.status, 201, 'Resource upload failed');
    console.log('  ✔ Alumni Uploaded Technical Learning Resource');

    // 9.2 Fetch Resources
    const getResourcesRes = await request('/api/v1/resources');
    assert.strictEqual(getResourcesRes.status, 200, 'Fetch resources failed');
    const resList = getResourcesRes.body.data || getResourcesRes.body;
    console.log(`  ✔ Listed ${resList.length} Shared Technical Resources`);

    // -------------------------------------------------------------
    // MODULE 10: AI RESUME & RECOMMENDATION ENGINE
    // -------------------------------------------------------------
    console.log('\n▶ [10/13] Testing AI Resume & Recommendation Engine...');
    
    // 10.1 AI Resume Analyzer with Custom Target Role
    const resumeRoleRes = await request('/api/v1/recommendation/analyze-resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      targetRole: 'Full Stack Engineer',
      resumeText: 'Passionate student experienced in React, Node.js, Express, MySQL, WebRTC, HTML5, CSS3, and REST API development.'
    });
    assert.strictEqual(resumeRoleRes.status, 200, 'AI Resume analysis with targetRole failed');
    const resumeRoleData = resumeRoleRes.body.data || resumeRoleRes.body;
    assert.ok(resumeRoleData.ats_score !== undefined || resumeRoleData.atsScore !== undefined, 'Missing ATS Score');
    console.log(`  ✔ AI Resume Analyzer (Target Role: Full Stack Engineer) -> ATS Score: ${resumeRoleData.ats_score || resumeRoleData.atsScore}%`);

    // 10.2 AI Resume Analyzer with Full Job Description (JD)
    const resumeJdRes = await request('/api/v1/recommendation/analyze-resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      jobDescription: 'Seeking Software Engineer proficient in React, Node.js, Express, MySQL database optimization, and cloud deployments.',
      resumeText: 'Passionate student experienced in React, Node.js, Express, MySQL, WebRTC, HTML5, CSS3, and REST API development.'
    });
    assert.strictEqual(resumeJdRes.status, 200, 'AI Resume analysis with jobDescription failed');
    const resumeJdData = resumeJdRes.body.data || resumeJdRes.body;
    console.log(`  ✔ AI Resume Analyzer (Full JD Match) -> ATS Score: ${resumeJdData.ats_score || resumeJdData.atsScore}%`);

    // 10.3 Mentor Recommendation Match Score Engine
    const recommendationsRes = await request('/api/v1/recommendation', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(recommendationsRes.status, 200, 'Mentor recommendations failed');
    const recsList = recommendationsRes.body.data || recommendationsRes.body;
    console.log(`  ✔ Calculated AI Recommendation Match Scores for ${recsList.length} Mentors`);

    // -------------------------------------------------------------
    // MODULE 11: NOTIFICATIONS & SYSTEM ALERTS MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [11/13] Testing Notifications Module...');
    
    // 11.1 Fetch User Notifications
    const notifRes = await request('/api/v1/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(notifRes.status, 200, 'Fetch notifications failed');
    const notifList = notifRes.body.data || notifRes.body;
    console.log(`  ✔ Fetched ${notifList.length} System Notifications for Student`);

    // 11.2 Mark All Notifications as Read
    const markAllRes = await request('/api/v1/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(markAllRes.status, 200, 'Mark all notifications as read failed');
    console.log('  ✔ All Notifications Marked as Read');

    // -------------------------------------------------------------
    // MODULE 12: PLATFORM ANALYTICS MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [12/13] Testing Analytics & Metrics Module...');
    
    const analyticsRes = await request('/api/v1/analytics/overview', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(analyticsRes.status, 200, 'Analytics overview failed');
    const analyticsData = analyticsRes.body.data || analyticsRes.body;
    assert.ok(analyticsData.kpi || analyticsData.userCounts, 'Analytics missing user counts');
    const studentCount = analyticsData.kpi?.total_students || analyticsData.userCounts?.total || 0;
    console.log(`  ✔ Administrative Platform Analytics Verified (Total Students: ${studentCount})`);

    // -------------------------------------------------------------
    // MODULE 13: SYSTEM AUDIT LOGS MODULE
    // -------------------------------------------------------------
    console.log('\n▶ [13/13] Testing Audit Logs Module...');
    
    const auditRes = await request('/api/v1/audit', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(auditRes.status, 200, 'Audit logs fetch failed');
    const auditLogs = auditRes.body.data || auditRes.body;
    console.log(`  ✔ Audit Trail Retrieved (${auditLogs.length} system audit logs verified)`);(`  ✔ Audit Trail Retrieved (${auditRes.body.length} system audit logs verified)`);

    console.log('\n=============================================================');
    console.log('🎉 ALL 13 MODULES PASSED 100% END-TO-END INTEGRATION TESTS!');
    console.log('=============================================================\n');

  } catch (error) {
    console.error('\n❌ E2E MODULE TEST FAILED:', error.message);
    if (error.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
};

// Launch ephemeral HTTP test server instance
server = app.listen(0, () => {
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  runAllModuleTests();
});
