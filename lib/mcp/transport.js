import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'https://mcp.kapruka.com/mcp';

class McpClientSingleton {
  constructor() {
    this.client = null;
    this.transport = null;
    this.sessionId = undefined;
    this.connectPromise = null;
  }

  async ensureConnected() {
    if (this.client && this.transport?.sessionId) {
      return this.client;
    }

    if (!this.connectPromise) {
      this.connectPromise = this._connect().finally(() => {
        this.connectPromise = null;
      });
    }

    return this.connectPromise;
  }

  async _connect() {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch {
        // ignore close errors during reconnect
      }
    }

    this.client = new Client({
      name: 'kapruka-genie',
      version: '1.0.0',
    });

    this.transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT), {
      sessionId: this.sessionId,
    });

    this.client.onerror = (error) => {
      console.error('[MCP] Client error:', error.message);
    };

    await this.client.connect(this.transport);
    this.sessionId = this.transport.sessionId;
    console.log(`[MCP] Session established: ${this.sessionId}`);

    return this.client;
  }

  async resetSession() {
    this.sessionId = undefined;
    this.client = null;
    if (this.transport) {
      try {
        await this.transport.close();
      } catch {
        // ignore
      }
    }
    this.transport = null;
  }

  isSessionError(err) {
    const message = err?.message || String(err);
    return (
      message.includes('Missing session ID') ||
      message.includes('Session not found') ||
      message.includes('session') ||
      message.includes('404')
    );
  }

  async callTool(toolName, params = {}) {
    try {
      const client = await this.ensureConnected();
      const result = await client.callTool(
        { name: toolName, arguments: { params } },
        CallToolResultSchema
      );
      return extractResult(result);
    } catch (err) {
      if (this.isSessionError(err)) {
        console.warn(`[MCP] Session error for ${toolName}, reconnecting...`);
        await this.resetSession();
        const client = await this.ensureConnected();
        const result = await client.callTool(
          { name: toolName, arguments: { params } },
          CallToolResultSchema
        );
        return extractResult(result);
      }
      throw err;
    }
  }
}

/**
 * Returns the persistent MCP singleton — never creates a new client per request.
 */
export function getMcpClient() {
  const globalStore = globalThis;
  if (!globalStore.__kaprukaMcpSingleton) {
    globalStore.__kaprukaMcpSingleton = new McpClientSingleton();
    console.log('[MCP] Singleton client created');
  }
  return globalStore.__kaprukaMcpSingleton;
}

function extractResult(result) {
  if (!result) return null;
  if (result.content && Array.isArray(result.content)) {
    const textContent = result.content.find((c) => c.type === 'text');
    if (textContent) {
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }
  }
  return result;
}

/**
 * Raw MCP tool call via persistent singleton client (session reuse).
 */
export async function rawCallTool(toolName, params = {}) {
  console.log(`[MCP] Calling ${toolName}`, params);
  return getMcpClient().callTool(toolName, params);
}
