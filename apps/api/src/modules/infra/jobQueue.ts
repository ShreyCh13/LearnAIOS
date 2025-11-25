import { prisma } from '../../core/database';
import { logger } from '../../core/logger';

export interface Job<T = any> {
  id: string;
  type: string;
  payload: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class JobQueue {
  async add<T>(type: string, payload: T): Promise<Job<T>> {
    const job = await prisma.job.create({
      data: {
        type,
        payload: payload as any,
        status: 'pending',
      },
    });
    logger.info(`Job enqueued: ${job.id} (${type})`);
    return job as Job<T>;
  }

  async processNext(type: string, handler: (job: Job) => Promise<any>) {
    // Simple polling implementation for MVP
    const job = await prisma.job.findFirst({
      where: { type, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) return null;

    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    try {
      const result = await handler(job as Job);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed', result: result as any },
      });
      logger.info(`Job completed: ${job.id}`);
    } catch (error: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error.message,
          attempts: { increment: 1 },
        },
      });
      logger.error(`Job failed: ${job.id}`, error);
    }
  }
}

export const jobQueue = new JobQueue();


