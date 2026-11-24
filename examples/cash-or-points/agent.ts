/**
 * Cash or points? A hotel question answered by Claude, with directrate's MCP server as its tools.
 *
 *   export ANTHROPIC_API_KEY=...     # https://console.anthropic.com
 *   export DIRECTRATE_API_KEY=...    # https://directrate.dev/dashboard/keys (the Free plan is enough)
 *   npx tsx agent.ts "Hyatt Place Chicago Downtown The Loop, 2 nights from 15 January"
 *
 * There is no tool loop in this file. Anthropic's MCP connector calls https://api.directrate.dev/mcp
 * itself, with your directrate key as the bearer token, and the whole exchange comes back in one
 * response: the tool calls Claude made, what they returned, and the answer.
 */
import Anthropic from "@anthropic-ai/sdk";

const question = process.argv.slice(2).join(" ") || "Hyatt Place Chicago Downtown The Loop, 2 nights from 15 January";
const directrateKey = process.env.DIRECTRATE_API_KEY;
if (!directrateKey) {
  console.error("Set DIRECTRATE_API_KEY. A key is free at https://directrate.dev/dashboard/keys");
  process.exit(1);
}

const SYSTEM = `You answer one question for a traveller: is this hotel stay better paid in cash or in points?

Your tools read live prices from the hotel chain's own booking system.
- If you were not given the chain's hotel code, find it with \`hotels\`: one search by the hotel's name and city.
- Then call \`award\` once for the stay. It returns the price in points, the cash price of the same stay and the cents per point (cpp) that the points would buy.

Answer in at most six short lines: the hotel and the dates, the cash price (and the member rate when it is lower), the price in points, the cents per point, and the verdict as a break-even, for example "use points if you value a point at less than 1.4 cents". The traveller knows what a point is worth to them and you do not, so do not judge with a valuation of your own unless they gave one.

If the stay cannot be booked with points, or a tool fails, say so plainly and give the cash price if you have it. End with the number of credits the calls cost.`;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const messages: Anthropic.Beta.BetaMessageParam[] = [
  // today's date goes with the question, so "15 January" means the next one
  { role: "user", content: `Today is ${new Date().toISOString().slice(0, 10)}.\n\n${question}` },
];

/** One request. Claude calls the tools on Anthropic's side, so this resolves with the finished turn. */
const ask = () =>
  client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages,
    mcp_servers: [{ type: "url", url: "https://api.directrate.dev/mcp", name: "directrate", authorization_token: directrateKey }],
    // two of the server's sixteen tools are all this question needs; the rest stay out of the prompt
    tools: [{
      type: "mcp_toolset",
      mcp_server_name: "directrate",
      default_config: { enabled: false },
      configs: { hotels: { enabled: true }, award: { enabled: true } },
    }],
    betas: ["mcp-client-2025-11-20", "server-side-fallback-2026-07-01"],
    // if Claude declines the request, the API retries it on a fallback model inside the same call
    fallbacks: "default",
  });

let response: Anthropic.Beta.BetaMessage;
for (let turn = 0; ; turn++) {
  try {
    response = await ask();
  } catch (e) {
    // most specific first: what the person can fix themselves, then everything else
    if (e instanceof Anthropic.AuthenticationError) console.error("Claude did not accept the API key. Check ANTHROPIC_API_KEY.");
    else if (e instanceof Anthropic.RateLimitError) console.error("Claude's rate limit was reached. Try again in a minute.");
    else if (e instanceof Anthropic.APIError) console.error(`Claude API error ${e.status}: ${e.message}`);
    else console.error(e instanceof Error && /authentication method/i.test(e.message) ? "Set ANTHROPIC_API_KEY (https://console.anthropic.com)." : e);
    process.exit(1);
  }

  // what happened, in order: each tool call, the first line of what it returned, then the answer
  for (const block of response.content) {
    if (block.type === "mcp_tool_use") {
      console.log(`→ ${block.name}(${JSON.stringify(block.input)})`);
    } else if (block.type === "mcp_tool_result") {
      const text = typeof block.content === "string" ? block.content : block.content.map((c) => c.text).join("\n");
      console.log(`  ${block.is_error ? "failed: " : ""}${text.split("\n")[0]}`);
    } else if (block.type === "text") {
      console.log(`\n${block.text}`);
    }
  }

  // a long run of tool calls can pause; sending the turn back lets the server carry on where it stopped
  if (response.stop_reason !== "pause_turn" || turn >= 4) break;
  messages.push({ role: "assistant", content: response.content });
}

if (response.stop_reason === "refusal") {
  console.error(`\nThe request was declined (${response.stop_details?.category ?? "no category"}).`);
  process.exit(1);
}
const u = response.usage;
console.log(`\n[${response.model} · ${u.input_tokens} tokens in, ${u.output_tokens} out]`);
