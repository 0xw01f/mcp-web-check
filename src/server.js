import http from 'http';
import { scanDomain } from './scanDomain.js';

const DEFAULT_PORT = process.env.MCP_PORT ? Number.parseInt(process.env.MCP_PORT, 10) : 4000;
const MAX_BODY_SIZE = process.env.MCP_MAX_BODY_BYTES
  ? Number.parseInt(process.env.MCP_MAX_BODY_BYTES, 10)
  : 1_000_000;

const readRequestBody = (request) => {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', (error) => reject(error));
  });
};

const jsonResponse = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
};

const handleJsonRpc = async (requestBody) => {
  let parsed;
  try {
    parsed = JSON.parse(requestBody);
  } catch (error) {
    return {
      statusCode: 400,
      payload: {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Invalid JSON payload',
        },
      },
    };
  }

  const { jsonrpc, method, params, id = null } = parsed;

  if (jsonrpc !== '2.0') {
    return {
      statusCode: 400,
      payload: {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC version',
        },
      },
    };
  }

  if (method !== 'scanDomain') {
    return {
      statusCode: 404,
      payload: {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Unknown method: ${method}`,
        },
      },
    };
  }

  if (!params || typeof params.domain !== 'string') {
    return {
      statusCode: 400,
      payload: {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: 'Missing "domain" parameter',
        },
      },
    };
  }

  try {
    const result = await scanDomain({ domain: params.domain });
    return {
      statusCode: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message,
        },
      },
    };
  }
};

export const startServer = ({ port = DEFAULT_PORT } = {}) => {
  const server = http.createServer(async (request, response) => {
    if (request.method === 'POST') {
      try {
        const body = await readRequestBody(request);
        const { statusCode, payload } = await handleJsonRpc(body);
        jsonResponse(response, statusCode, payload);
      } catch (error) {
        jsonResponse(response, 500, {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: error.message,
          },
        });
      }
      return;
    }

    if (request.method === 'GET' && request.url === '/health') {
      jsonResponse(response, 200, { status: 'ok' });
      return;
    }

    jsonResponse(response, 405, {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32601,
        message: 'Method not allowed',
      },
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => resolve(server));
  });
};
