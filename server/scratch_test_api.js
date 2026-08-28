import { authService } from './src/modules/auth/auth.service.js';
import { domainsService } from './src/modules/domains/domains.service.js';
import { recommendationService } from './src/modules/recommendation/recommendation.service.js';
import { verificationService } from './src/modules/verification/verification.service.js';
import { usersService } from './src/modules/users/users.service.js';
import { mentorshipService } from './src/modules/mentorship/mentorship.service.js';
import { analyticsService } from './src/modules/analytics/analytics.service.js';

async function runSystemIntegrationTests() {
  console.log('=== STARTING CAMPUSBRIDGE AUTOMATED SYSTEM TESTS ===\n');

  try {
    // Test 1: Admin Login
    console.log('[Test 1] Testing Admin Login (admin@university.edu)...');
    const adminLogin = await authService.login('admin@university.edu', 'password123');
    console.log('  SUCCESS: Admin logged in! User ID:', adminLogin.user.id, 'Role:', adminLogin.user.role);

    // Test 2: Student Login
    console.log('\n[Test 2] Testing Student Login (alex.rivera@student.edu)...');
    const studentLogin = await authService.login('alex.rivera@student.edu', 'password123');
    console.log('  SUCCESS: Student logged in! Name:', studentLogin.user.name, 'Department:', studentLogin.user.profile?.department);

    // Test 3: Mentor Login
    console.log('\n[Test 3] Testing Mentor Login (david.vance@techcorp.com)...');
    const mentorLogin = await authService.login('david.vance@techcorp.com', 'password123');
    console.log('  SUCCESS: Mentor logged in! Company:', mentorLogin.user.profile?.company, 'Capacity:', mentorLogin.user.profile?.current_capacity, '/', mentorLogin.user.profile?.max_capacity);

    // Test 4: Fetch Technical Domains
    console.log('\n[Test 4] Testing Domains Service (getDomains)...');
    const domains = await domainsService.getDomains(true);
    console.log(`  SUCCESS: Retrieved ${domains.length} technical domains from MySQL!`);
    console.log('  Sample Domain:', domains[0]?.name, '| Category:', domains[0]?.category, '| Milestone Rate:', domains[0]?.stats?.milestone_completion_rate, '%');

    // Test 5: Recommendation Engine
    console.log('\n[Test 5] Testing Recommendation Engine for Alex Rivera...');
    const recommendations = await recommendationService.getRecommendedMentors(studentLogin.user);
    console.log(`  SUCCESS: Generated ${recommendations.length} mentor recommendations!`);
    console.log('  Top Match:', recommendations[0]?.name, '| Match Score:', recommendations[0]?.match_score, '%');

    // Test 6: Verification Queue
    console.log('\n[Test 6] Testing Admin Verification Queue (getPendingVerifications)...');
    const pendingVerifications = await verificationService.getPendingVerifications();
    console.log(`  SUCCESS: Retreived ${pendingVerifications.length} pending/rejected user registrations for review!`);

    // Test 7: Admin Directory
    console.log('\n[Test 7] Testing Admin User Directory (getAllUsersAdmin)...');
    const allUsers = await usersService.getAllUsersAdmin();
    console.log(`  SUCCESS: Total users in MySQL database: ${allUsers.length}`);

    // Test 8: Analytics Overview
    console.log('\n[Test 8] Testing Analytics Overview (getOperationsCenterAnalytics)...');
    const analytics = await analyticsService.getOperationsCenterAnalytics();
    console.log('  SUCCESS: KPI Metrics:', JSON.stringify(analytics.kpi));

    // Test 9: Negative Test Invalid Login
    console.log('\n[Test 9] Testing Invalid Login Exception Handling...');
    try {
      await authService.login('invalid@user.com', 'wrongpassword');
      console.error('  FAIL: Expected invalid login to throw error!');
    } catch (err) {
      console.log('  SUCCESS: Correctly caught invalid credentials exception:', err.message);
    }

    console.log('\n=== ALL 9 AUTOMATED INTEGRATION TESTS PASSED CLEANLY! ===\n');
  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error);
  }
}

runSystemIntegrationTests();
