# directrate: hotel rates as MCP tools

Live hotel prices for your agent: the public rate, the member rate and the night in points, as each
hotel chain's own booking system quotes them, with the five big booking sites beside them.

- **Server:** `https://api.directrate.dev/mcp` (remote, Streamable HTTP, stateless)
- **Sources:** 11 chains (Marriott, Hilton, Hyatt, IHG, Choice, Radisson, I Prefer, Wyndham, Meliá,
  Best Western, Premier Inn) and 5 booking sites (Booking.com, Expedia, Hotels.com, Trip.com, Agoda)
- **Price:** 250 credits a month free, no card. A tool call costs what the same API call costs, and
  every answer states its own price.
- **Docs:** <https://directrate.dev/docs/mcp>

This repository holds the connection notes and the examples. The server is hosted; its source is not
here.

## Connect

### Claude.ai, Claude Desktop, ChatGPT

No key to paste: these sign in.

```text
Customize → Connectors → + Add → Add custom connector
Name:  directrate
URL:   https://api.directrate.dev/mcp
→ Continue → keep the two options Claude marks "Detected"
  (Sign in now, Register automatically)
→ Add → Connect → sign in to directrate → choose the API key it may use → Allow
```

The consent page creates a key for the connector, or lets you pick one. Revoke that key in the
[dashboard](https://directrate.dev/dashboard/keys) to disconnect. In ChatGPT: Settings → Connectors →
Create, the same URL, the same sign-in.

The clients below send a key instead. Create one in the
[dashboard](https://directrate.dev/dashboard/keys) and put it in `DIRECTRATE_API_KEY`.

### Claude Code

```sh
claude mcp add --transport http directrate https://api.directrate.dev/mcp --header 'x-api-key: ${DIRECTRATE_API_KEY}'
```

Keep the single quotes: Claude Code stores the header as written and expands the variable each time
it starts, so the key never lands in `~/.claude.json`.

### Cursor

`~/.cursor/mcp.json`, or `.cursor/mcp.json` in the project:

```json
{
  "mcpServers": {
    "directrate": {
      "url": "https://api.directrate.dev/mcp",
      "headers": { "x-api-key": "${env:DIRECTRATE_API_KEY}" }
    }
  }
}
```

### VS Code

`.vscode/mcp.json`. VS Code asks for the key once and keeps it in its secret store:

```json
{
  "servers": {
    "directrate": {
      "type": "http",
      "url": "https://api.directrate.dev/mcp",
      "headers": { "x-api-key": "${input:directrate-key}" }
    }
  },
  "inputs": [
    { "id": "directrate-key", "type": "promptString", "description": "directrate API key", "password": true }
  ]
}
```

### Clients that only run local servers

The [`@directrate/mcp`](https://www.npmjs.com/package/@directrate/mcp) package on npm bridges to the
same endpoint and forwards everything unchanged:

```json
{
  "mcpServers": {
    "directrate": {
      "command": "npx",
      "args": ["-y", "@directrate/mcp"],
      "env": { "DIRECTRATE_API_KEY": "<your key>" }
    }
  }
}
```

The key sits in that file, so keep the file private.

### Any other MCP client

Send the key as `x-api-key`, or as `Authorization: Bearer <key>`, on every request to the URL above.

## Tools

| Tool | What it answers | Credits |
|---|---|---|
| `shop` | Every rate plan of one hotel night: public, member, after tax | 1 on most sources; Radisson 3, Best Western 5, Wyndham 6 |
| `award` | The same night in points, with cents per point and certificates | as `shop` |
| `parity` | The hotel's own rate beside Booking.com, Expedia, Hotels.com, Trip.com and Agoda | the direct shop + 1 per booking site, + 1 when a hotel's id on that site had to be looked up |
| `calendar` | The lowest price per night over up to 60 nights | 0.1 to 0.25 a night where the chain has a priced calendar; the shop weight per night elsewhere |
| `compset` | Up to 25 hotels of one chain, the lowest price of each | 0.25 to 0.5 per hotel, at least 1 a call |
| `stay` | A stay of 2 to 14 nights priced as one, against its nights alone | the shop + the calendar nights |
| `hotels` | A chain's hotel codes around a place; a booking site's id for a hotel's name | 1 a search on most chains |
| `hotel` | Name, address, rating and amenities for one code | 0 from the table, 1 for a live read |
| `matrix` | Up to 200 hotels × 366 nights as a batch job | reserved up front, spent as the job runs |
| `job`, `job_cells` | A batch job's progress, spend and results | free |
| `watch_create` | Refresh nights on a schedule and call a webhook on a condition | per refresh, while active |
| `watches`, `watch_delete` | List or stop watches | free |
| `chains` | Every source with its credit weights and what it returns | free |
| `usage` | Credits used and left this month | free |

A repeat of the same question within its cache window costs a quarter. A call that fails, and a hotel
code the chain does not know, cost nothing. The full rules:
<https://directrate.dev/docs/credits-and-pricing>.

## Examples

- [`examples/cash-or-points`](examples/cash-or-points): is this stay better paid in cash or in points?
  Two tool calls and a break-even, in Claude with no code or in your own stack.

## About the data

The rates are the prices each chain and booking site quotes an anonymous guest, read live from the
same booking systems behind its own website and apps. Every answer says whether it is fresh or came
from a cache, and how old that is. directrate is not affiliated
with any hotel chain or booking site; their names appear because they are what the data is about.

## Questions

<hello@directrate.dev>, or the docs at <https://directrate.dev/docs/quickstart>.

The examples in this repository are under the MIT licence.
