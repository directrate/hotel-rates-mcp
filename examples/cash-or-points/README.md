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

## In your own stack

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

On the Claude API you do not need an MCP client of your own: Anthropic's
[MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) takes the same
URL, with your key as its `authorization_token`.

## What it costs

One credit per tool call on Hyatt, so two for the question when the agent calls `hotels` and `award`.
Every answer states its own price, and a call that fails costs nothing. The Free plan's 250 credits a
month cover about 125 questions like this one. Other chains weigh differently:
<https://directrate.dev/docs/credits-and-pricing>.

The same walk-through on the site: <https://directrate.dev/docs/cash-or-points-agent>.
