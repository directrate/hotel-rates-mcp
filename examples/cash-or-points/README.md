# Cash or points?

A traveller asks: *Hyatt Place Chicago Downtown The Loop, 2 nights from 15 January: cash or points?*
Two of the server's tools answer it:

| Tool | What it answers |
|---|---|
| `hotels` | The chain's code for a hotel named in words: "Hyatt Place Chicago Downtown The Loop" is `CHIZP` |
| `award` | The stay in points, the cash price of the same stay, and the cents per point the points would buy |

The agent's answer is a break-even: the stay is worth paying in points if a point is worth less to
you than so many cents.

## In Claude, with no code

Add directrate as a connector ([steps](../../README.md#claudeai-claude-desktop-chatgpt)), switch it on
in a chat from the **+** menu, and ask the question in your own words. Claude decides which tools to
call; when we asked on 24 November 2026 it called `hotels`, `shop` and `award`, which cost 3 credits.

## On the Claude API, in one file

[`agent.ts`](agent.ts) is the whole agent, under a hundred lines, with no tool loop. Anthropic's
[MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) calls the MCP
server on Claude's side, so one request returns the tool calls, what they returned, and the answer.

```sh
export DIRECTRATE_API_KEY=dr_live_...   # free at https://directrate.dev/dashboard/keys
export ANTHROPIC_API_KEY=sk-ant-...     # https://console.anthropic.com
npm install
npx tsx agent.ts "Hyatt Place Chicago Downtown The Loop, 2 nights from 15 January"
```

It prints each tool call as Claude made it, the first line of what the server answered, then Claude's
answer. Three things in the file are worth a second look:

- **The connector block.** `mcp_servers` names the server and carries your directrate key as
  `authorization_token`; Anthropic sends it as the bearer token when it calls us. It is your key, your
  credits and your quota, so use a key made for this and revoke it when you are done.
- **Two tools, not sixteen.** `default_config: { enabled: false }` with two entries in `configs` keeps
  the other fourteen tool descriptions out of the prompt.
- **A break-even, not a verdict.** The prompt asks for "use points if you value a point at less than
  1.4 cents", because what a point is worth is the traveller's call and not the model's.

This file is new. It is checked against the types of `@anthropic-ai/sdk` 1.13.0, and the two tool
calls it leads to are the ones `tools.ts` below makes against the live server. If it does not run for
you, write to <hello@directrate.dev>.

## With another model, or no model

[`tools.ts`](tools.ts) makes the two calls with the MCP TypeScript SDK and no model at all: connect
with your key as a bearer token, list the tools to hand to your model, run the calls it asks for.

```sh
export DIRECTRATE_API_KEY=dr_live_...   # free at https://directrate.dev/dashboard/keys
npm install
npx tsx tools.ts
```

Its output on 24 November 2026; the prices are live, so yours will differ:

```
16 tools: shop, award, parity, calendar, compset, stay, hotels, hotel, matrix, job, job_cells, watches, watch_create, watch_delete, chains, usage

hotels → CHIZP Hyatt Place Chicago/Downtown-The Loop
award  → 12000 points a night, 174.56 USD a night in cash, 1.45 cents per point (1 credit)
```

Hand your model two of the sixteen tools, `hotels` and `award`, to keep its prompt small, and ask it
for a break-even ("use points if you value a point at less than 1.4 cents") and not a verdict: what a
point is worth is the traveller's call, not the model's. Add `parity` to compare the hotel's own price
with Booking.com, Expedia, Hotels.com, Trip.com and Agoda, or `calendar` for a month of nights in one
call.

## What it costs

**directrate:** one credit per tool call on Hyatt, so two for the question when the agent calls
`hotels` and `award`.
Every answer states its own price, and a call that fails costs nothing. The Free plan's 250 credits a
month cover about 125 questions like this one. Other chains weigh differently:
<https://directrate.dev/docs/credits-and-pricing>.

**Your model:** its own tokens. With two tools enabled the request is small.

The same walk-through on the site: <https://directrate.dev/docs/cash-or-points-agent>.
