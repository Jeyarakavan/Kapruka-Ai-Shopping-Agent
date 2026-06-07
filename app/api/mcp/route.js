import { executeTool } from '@/lib/mcp/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Health check endpoint
 */
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcpEndpoint: process.env.MCP_ENDPOINT || 'https://mcp.kapruka.com/mcp',
  });
}

/**
 * POST - Tool proxy route
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { tool, params = {} } = body;

    if (!tool) {
      return Response.json({ error: 'Tool name is required' }, { status: 400 });
    }

    const result = await executeTool(tool, params);
    return Response.json({ success: true, result });
  } catch (err) {
    console.error('[API MCP Proxy] Error:', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
