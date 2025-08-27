// Minimal Discord client shim so modules can import "../discord/client.js".
// It doesn't connect to Discord; it just satisfies the runtime and typings.

import { EventEmitter } from "node:events";

class MockDiscordClient extends EventEmitter {
  public user: { id: string; tag: string } | null = {
    id: "0",
    tag: "mock#0000",
  };

  async login(_token?: string): Promise<string> {
    // No-op login; return a fake shard/id string so callers are happy.
    return "mock-login";
  }

  // Add no-op destroy for graceful shutdown calls, if any:
  async destroy(): Promise<void> {
    // no-op
  }
}

const client = new MockDiscordClient();
export default client;
