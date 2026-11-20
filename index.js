import { fileURLToPath } from "node:url";

export const name = "rea-local-inspection";
export const inject = ["mcpManager"];

export function apply(ctx) {
  const entry = fileURLToPath(new URL("./inspection.mjs", import.meta.url));

  // The manager ties the server and its tools to the plugin's lifetime.
  ctx.mcpManager.register("rea", {
    transport: "stdio",
    command: process.execPath,
    args: [entry],
    env: process.versions.electron ? { ELECTRON_RUN_AS_NODE: "1" } : {},
  });
}
