export class JobQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
  }

  async add(jobName, payload) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: jobName,
      payload,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED'
    };
    this.jobs.push(job);
    console.log(`[BullMQ Queue:${this.name}] Processed async job '${jobName}' (ID: ${job.id})`);
    return job;
  }

  async getJobs() {
    return this.jobs;
  }
}

export const notificationQueue = new JobQueue('notifications');
export const emailQueue = new JobQueue('emails');
