/**
 * The same two tools without a model: for an agent built on another model or framework.
 *
 *   export DIRECTRATE_API_KEY=...    # https://directrate.dev/dashboard/keys
 *   npx tsx tools.ts
 *
 * directrate is a standard MCP server (Streamable HTTP). Any MCP client connects with the key as a
 * bearer token, lists the tools to hand to its model, and runs the calls the model asks for.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const key = process.env.DIRECTRATE_API_KEY;
if (!key) {
  console.error("Set DIRECTRATE_API_KEY. A key is free at https://directrate.dev/dashboard/keys");
  process.exit(1);
}

const transport = new StreamableHTTPClientTransport(new URL("https://api.directrate.dev/mcp"), {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});
const client = new Client({ name: "cash-or-points", version: "0.1.0" });
await client.connect(transport);

// what you would hand to your model as its tools: name, description and JSON schema of each
const { tools } = await client.listTools();
console.log(`${tools.length} tools: ${tools.map((t) => t.name).join(", ")}\n`);

// the two calls the agent makes: find the hotel's code, then price the stay in points and in cash
const found = await client.callTool({ name: "hotels", arguments: { chain: "hyatt", q: "Hyatt Place Chicago Downtown The Loop", limit: 3 } });
const hotel = (found.structuredContent as { hotels: { code: string; name: string }[] }).hotels[0]!;
console.log(`hotels → ${hotel.code} ${hotel.name}`);

const stay = await client.callTool({ name: "award", arguments: { chain: "hyatt", hotel_code: hotel.code, checkin: "2027-01-15", los: 2 } });
const a = stay.structuredContent as { lowest_points: number | null; cpp: number | null; cash_comparison: { lowest_cash: number | null; currency: string } | null; credits_charged: number };
console.log(`award  → ${a.lowest_points} points a night, ${a.cash_comparison?.lowest_cash} ${a.cash_comparison?.currency} a night in cash, ${a.cpp} cents per point (${a.credits_charged} credit)`);

await client.close();
