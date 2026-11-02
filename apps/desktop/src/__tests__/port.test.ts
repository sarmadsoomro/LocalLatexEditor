import net from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { findFreePort } from "../port";

const servers: net.Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

// Ports come from the OS (listen on 0): fixed numbers can fall in ranges
// Windows reserves (Hyper-V, WinNAT), where listen fails with EACCES.
function occupyAny(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    servers.push(s);
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => resolve((s.address() as net.AddressInfo).port));
  });
}

describe("findFreePort", () => {
  it("returns the preferred port when it is free", async () => {
    const port = await occupyAny();
    await new Promise((r) => servers.pop()!.close(r));
    expect(await findFreePort(port, 1)).toBe(port);
  });

  it("moves past the preferred port when it is taken", async () => {
    const port = await occupyAny();
    const found = await findFreePort(port, 50);
    expect(found).toBeGreaterThan(port);
    expect(found).toBeLessThan(port + 50);
  });

  it("fails when every port in the range is taken", async () => {
    const port = await occupyAny();
    await expect(findFreePort(port, 1)).rejects.toThrow(/No free port/);
  });
});
