import { sessionsService } from './src/modules/sessions/sessions.service.js';
import { db } from './src/config/db.js';

async function testMilestoneCreate() {
  console.log('Testing milestone creation with ISO datetime string...');
  try {
    const activeMentorships = await db.activeMentorships.find();
    if (activeMentorships.length === 0) {
      console.log('No active mentorship found. Exiting test.');
      return;
    }

    const mentorshipId = activeMentorships[0].id;
    console.log('Testing milestone creation for mentorship ID:', mentorshipId);

    const milestone = await sessionsService.createMilestone(mentorshipId, {
      title: 'learn the basics of dev',
      description: 'learn slow and steadily',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
    });

    console.log('SUCCESS: Milestone created cleanly in MySQL! ID:', milestone.id, 'Due Date:', milestone.due_date);
  } catch (error) {
    console.error('FAIL: Milestone creation failed:', error.message);
  }
}

testMilestoneCreate();
