import { describe, expect, it } from 'vitest';

import { CompileQueue } from '../services/compileQueue.js';

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('CompileQueue', () => {
  it('runs one compile per project and queues at most one follow-up', async () => {
    const started: Array<{ jobId: string; options: number }> = [];
    const gates: Array<ReturnType<typeof deferred>> = [];
    const queue = new CompileQueue<number>(async (_projectId, job) => {
      started.push(job);
      const gate = deferred();
      gates.push(gate);
      await gate.promise;
    });

    expect(queue.enqueue('p1', 'a', 1)).toEqual({ jobId: 'a', state: 'started' });
    expect(queue.enqueue('p1', 'b', 2)).toEqual({ jobId: 'b', state: 'queued' });
    // later requests join the queued job and update its options
    expect(queue.enqueue('p1', 'c', 3)).toEqual({ jobId: 'b', state: 'joined' });
    expect(queue.enqueue('p1', 'd', 4)).toEqual({ jobId: 'b', state: 'joined' });

    // other projects are independent
    expect(queue.enqueue('p2', 'x', 9)).toEqual({ jobId: 'x', state: 'started' });

    expect(started.map((j) => j.jobId)).toEqual(['a', 'x']);

    gates[0].resolve();
    await tick();
    await tick();
    expect(started.map((j) => j.jobId)).toEqual(['a', 'x', 'b']);
    expect(started[2].options).toBe(4);

    gates[2].resolve();
    gates[1].resolve();
    await tick();
    await tick();
    expect(queue.isBusy('p1')).toBe(false);
    expect(queue.isBusy('p2')).toBe(false);
  });

  it('keeps going after a compile throws', async () => {
    const seen: string[] = [];
    const queue = new CompileQueue<null>(async (_projectId, job) => {
      seen.push(job.jobId);
      if (job.jobId === 'a') throw new Error('boom');
    });
    queue.enqueue('p', 'a', null);
    queue.enqueue('p', 'b', null);
    await tick();
    await tick();
    await tick();
    expect(seen).toEqual(['a', 'b']);
    expect(queue.isBusy('p')).toBe(false);
  });
});
