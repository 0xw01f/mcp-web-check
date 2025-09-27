# Web Check MCP

A lightweight Model Context Protocol (MCP) server that exposes Web Check's domain scanning capability through a single `scanDomain` command. The server performs SSL, DNS, header, technology, port, and performance checks, and optionally enriches the results with Shodan, SecurityTrails, and WHOIS data when API keys are provided.

## Installation

```bash
git clone https://github.com/lissy93/web-check.git
cd web-check
npm install
```

> **Note:** If you are using this code as a fork or standalone package, adjust the clone URL accordingly.

## Configuration

Create a `.env` file (or export environment variables) to configure optional integrations and server behaviour:

| Variable | Purpose |
| --- | --- |
| `MCP_PORT` | Port used by the MCP HTTP server (default: `4000`). |
| `MCP_MAX_BODY_BYTES` | Maximum JSON payload size the server accepts (default: `1000000`). |
| `SCAN_TIMEOUT_MS` | Default timeout applied to internal scanning operations (default: `45000`). |
| `HTTP_TIMEOUT_MS` | Timeout for HTTP requests used in header and performance checks (default: `12000`). |
| `PORTS_TO_CHECK` | Comma-separated list of ports to probe (default set includes common service ports). |
| `PORT_CHECK_TIMEOUT_MS` | Timeout per port probe in milliseconds (default: `1500`). |
| `SHODAN_API_KEY` | If set, Shodan warnings are added to the response. |
| `SECURITYTRAILS_API_KEY` | If set, SecurityTrails warnings are added to the response. |
| `SECURITYTRAILS_ENDPOINT` | Override the SecurityTrails API endpoint. |
| `WHOIS_API_KEY` | If set, WHOIS warnings are added to the response (defaults to WhoisXML API). |
| `WHOIS_API_ENDPOINT` | Override the WHOIS API endpoint. |
| `EXTERNAL_API_TIMEOUT_MS` | Timeout used for Shodan, SecurityTrails, and WHOIS requests (default: `10000`). |

Leave any of the API key variables unset to skip those external lookups automatically.

## Starting the MCP Server

```bash
npm start
# or run the CLI directly
./bin/mcp.js start --port 5000
```

When the server starts it logs the port it is listening on. The CLI handles `SIGINT`/`SIGTERM` for a graceful shutdown.

## Calling `scanDomain`

Send a JSON-RPC 2.0 request to the MCP server. The example below uses `curl` against the default port:

```bash
curl -s \
  -H "Content-Type: application/json" \
  -X POST http://localhost:4000/ \
  -d '{
    "jsonrpc": "2.0",
    "id": "example",
    "method": "scanDomain",
    "params": { "domain": "example.com" }
  }'
```

Example response (truncated for brevity):

```json
{
  "jsonrpc": "2.0",
  "id": "example",
  "result": {
    "domain": "example.com",
    "ssl": {
      "valid": true,
      "issuer": "Let's Encrypt",
      "expires": "2025-09-15"
    },
    "headers": {
      "Server": "ECS (dcb/7F83)",
      "Strict-Transport-Security": "max-age=63072000"
    },
    "dns": {
      "A": ["93.184.216.34"],
      "MX": [],
      "TXT": ["v=spf1 include:_spf.google.com ~all"]
    },
    "techStack": ["Nginx", "Google Workspace"],
    "openPorts": [80, 443],
    "securityWarnings": [
      "Content-Security-Policy header is missing.",
      "Open ports detected: 80, 443."
    ],
    "performance": {
      "loadTimeMs": 230,
      "score": 95
    }
  }
}
```

The actual values will vary based on the target domain and the availability of optional integrations.

## Development Notes

- The server implements a minimal JSON-RPC 2.0 endpoint suitable for MCP clients.
- All outputs are normalised to plain JSON and avoid returning HTML or verbose logs.
- External integrations are opt-in; missing API keys simply omit that enrichment.

## License

This project remains under the MIT License (see `LICENSE`).
