import net from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { findFreePort } from "../port";

const servers: net.Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

function occupy(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    servers.push(s);
    s.once("error", reject);
    s.listen(port, "127.0.0.1", () => resolve());
  });
}

describe("findFreePort", () => {
  it("returns the preferred port when it is free", async () => {
    const start = 45000 + Math.floor(Math.random() * 1000);
    expect(await findFreePort(start, 5)).toBe(start);
  });

  it("moves to the next port when the preferred one is taken", async () => {
    const start = 46000 + Math.floor(Math.random() * 1000);
    await occupy(start);
    expect(await findFreePort(start, 5)).toBe(start + 1);
  });

  it("fails when every port in the range is taken", async () => {
    const start = 47000 + Math.floor(Math.random() * 1000);
    await occupy(start);
    await occupy(start + 1);
    await expect(findFreePort(start, 2)).rejects.toThrow(/No free port/);
  });
});
