import { api } from "./api";

export type InstallMethod = "install" | "admin" | "manual";

export interface PackageLookup {
  file: string;
  package: string;
  manager: "tlmgr" | "miktex" | "none";
  method: InstallMethod;
  command: string;
  note?: string;
}

// A lookup searches the online package index, so remember answers for this session.
const lookups = new Map<string, Promise<PackageLookup>>();

export const packageApi = {
  /** Which package provides a missing file, and whether TexCraft can install it. */
  lookup(file: string): Promise<PackageLookup> {
    let pending = lookups.get(file);
    if (!pending) {
      pending = api
        .post<{ lookup: PackageLookup }>("/api/system/packages/lookup", { file })
        .then((r) => r.lookup);
      pending.catch(() => lookups.delete(file));
      lookups.set(file, pending);
    }
    return pending;
  },

  /** Install a package. Can take minutes; on macOS it may show the system password prompt. */
  async install(file: string, pkg: string): Promise<void> {
    await api.post("/api/system/packages/install", { file, package: pkg });
    lookups.delete(file);
  },
};
