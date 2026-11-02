/**
 * One compile per project at a time.
 *
 * While a compile runs, the first new request is queued and later requests
 * join that queued job (keeping the newest options), so typing with
 * auto-compile on never stacks up more than one follow-up compile.
 */
export interface QueuedCompile<O> {
  jobId: string;
  options: O;
}

interface ProjectSlot<O> {
  runningJobId: string;
  queued?: QueuedCompile<O>;
}

export type EnqueueResult = { jobId: string; state: "started" | "queued" | "joined" };

export class CompileQueue<O> {
  private readonly slots = new Map<string, ProjectSlot<O>>();

  constructor(private readonly start: (projectId: string, job: QueuedCompile<O>) => Promise<void>) {}

  /** newJobId is used only when a new job has to be created. */
  enqueue(projectId: string, newJobId: string, options: O): EnqueueResult {
    const slot = this.slots.get(projectId);
    if (!slot) {
      this.slots.set(projectId, { runningJobId: newJobId });
      this.launch(projectId, { jobId: newJobId, options });
      return { jobId: newJobId, state: "started" };
    }
    if (slot.queued) {
      slot.queued.options = options;
      return { jobId: slot.queued.jobId, state: "joined" };
    }
    slot.queued = { jobId: newJobId, options };
    return { jobId: newJobId, state: "queued" };
  }

  isBusy(projectId: string): boolean {
    return this.slots.has(projectId);
  }

  private launch(projectId: string, job: QueuedCompile<O>): void {
    void this.start(projectId, job)
      .catch(() => undefined)
      .finally(() => {
        const slot = this.slots.get(projectId);
        if (!slot) return;
        const next = slot.queued;
        if (next) {
          this.slots.set(projectId, { runningJobId: next.jobId });
          this.launch(projectId, next);
        } else {
          this.slots.delete(projectId);
        }
      });
  }
}
