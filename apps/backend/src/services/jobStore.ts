import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface JobStatus {
  jobId: string;
  projectId: string;
  status: 'pending' | 'compiling' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  result?: {
    success: boolean;
    outputPath?: string;
    logOutput: string;
    errors: Array<{
      line: number;
      column: number;
      message: string;
      type: 'error' | 'warning';
    }>;
    warnings: Array<{
      line: number;
      column: number;
      message: string;
      type: 'error' | 'warning';
    }>;
    duration: number;
  };
  createdAt: Date;
}

const JOBS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.local-latex-editor', 'jobs');
const JOBS_INDEX_FILE = path.join(JOBS_DIR, 'index.json');

class JobStore {
  private memoryCache: Map<string, JobStatus> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(JOBS_DIR, { recursive: true });
      await this.loadIndex();
      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(JOBS_INDEX_FILE, 'utf-8');
      const jobs: JobStatus[] = JSON.parse(data);
      for (const job of jobs) {
        job.createdAt = new Date(job.createdAt);
        this.memoryCache.set(job.jobId, job);
      }
    } catch {
      // Index doesn't exist yet, that's fine
    }
  }

  private async persistIndex(): Promise<void> {
    const jobs = Array.from(this.memoryCache.values());
    const tempFile = path.join(JOBS_DIR, `index.tmp.${nanoid()}`);
    await fs.writeFile(tempFile, JSON.stringify(jobs, null, 2), 'utf-8');
    await fs.rename(tempFile, JOBS_INDEX_FILE);
  }

  async set(jobId: string, job: JobStatus): Promise<void> {
    this.memoryCache.set(jobId, job);
    await this.persistIndex();
  }

  async get(jobId: string): Promise<JobStatus | undefined> {
    return this.memoryCache.get(jobId);
  }

  async delete(jobId: string): Promise<void> {
    this.memoryCache.delete(jobId);
    await this.persistIndex();
  }

  async getAll(): Promise<JobStatus[]> {
    return Array.from(this.memoryCache.values());
  }

  async cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [jobId, job] of this.memoryCache.entries()) {
      const jobAge = now - new Date(job.createdAt).getTime();
      if (jobAge > maxAgeMs && (job.status === 'complete' || job.status === 'failed' || job.status === 'cancelled')) {
        toDelete.push(jobId);
      }
    }
    
    for (const jobId of toDelete) {
      this.memoryCache.delete(jobId);
    }
    
    if (toDelete.length > 0) {
      await this.persistIndex();
    }
  }
}

export const jobStore = new JobStore();
