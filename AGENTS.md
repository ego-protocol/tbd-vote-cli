---
name: TBD
description: Prediction market for crypto, sports, politics, and culture
cli_package: "@tbd-vote/cli"
auth_method: api_key
auth_prefix: "tbd_api_"
supported_assets:
  - USDC
default_bet_size: 1.00
rate_limits:
  campaigns_read: 60/min
  place_bet: 10/min
---

# TBD — Agent Guide

TBD is a prediction market where you can browse campaigns and place bets using USDC. This guide helps AI agents get started programmatically.

## Quick Start

### 1. Install the CLI

```bash
npm install -g @tbd-vote/cli
```

### 2. Authenticate

Interactive (recommended for first-time setup):

```bash
tbd-vote login
```

Non-interactive (for scripting/CI):

```bash
tbd-vote login --key tbd_api_<your-key>
```

To get an API key: visit https://tbd.vote, log in, go to Profile → Agent Access → Generate API Key.

### 3. Place your first bet

```bash
# Browse open campaigns
tbd-vote campaigns list --json --limit 3

# Pick a campaign and place a bet
tbd-vote bet <campaign-id> <option-id>
```

## CLI Reference

All commands support `--json` for machine-readable output. Errors go to stderr, data to stdout.

### Authentication

```bash
tbd-vote login                    # Interactive API key setup
tbd-vote login --key <key>        # Non-interactive
tbd-vote auth status              # Check if authenticated
tbd-vote auth logout              # Remove stored API key
```

### Strategy

```bash
tbd-vote strategy                 # View current strategy file
tbd-vote strategy init            # Create starter STRATEGY.md template
tbd-vote strategy init --force    # Overwrite existing strategy file
```

### Configuration

```bash
tbd-vote config set bet-size 2.50       # Set default bet amount
tbd-vote config get bet-size            # Get a config value
tbd-vote config list                    # Show all config
```

| Key | Default | Description |
|-----|---------|-------------|
| `api-url` | `https://production-tbd-bets-api.tbd.vote` | API base URL |
| `bet-size` | `1.00` | Default bet amount (USDC) |
| `default-status` | `open` | Default status filter |
| `default-limit` | `20` | Default page size |

### Browsing Campaigns

```bash
tbd-vote campaigns list --json                          # All open campaigns
tbd-vote campaigns list --json --status open --limit 5  # Filtered
tbd-vote campaigns list --json --filter trending        # Trending campaigns
tbd-vote campaigns list --json --cursor <cursor>        # Pagination
tbd-vote campaigns get <campaign-id> --json             # Campaign detail
```

### Placing Bets

```bash
tbd-vote bet <campaign-id> <option-id>        # Uses configured bet-size
tbd-vote bet <campaign-id> <option-id> 5.00   # Override amount
tbd-vote bet <campaign-id> <option-id> --json # JSON response
```

Response:
```json
{
  "txSignature": "5xYz...abc",
  "campaignId": "01963b1a-...",
  "campaignTitle": "Will BTC hit $200k by July?",
  "optionId": "opt-1",
  "optionTitle": "Yes",
  "amount": 1.00
}
```

## Autonomous Loop Instructions

The CLI provides primitives for an autonomous browse-analyze-bet loop:

```
1. BROWSE    tbd-vote campaigns list --json --status open
2. ANALYZE   Read campaign data, evaluate odds, pick a bet (your logic)
3. BET       tbd-vote bet <campaign-id> <option-id>
4. REPEAT    Loop back to step 1
```

Example session:

```bash
# Step 1: Get open campaigns
tbd-vote campaigns list --json --status open --limit 10

# Step 2: Agent analyzes the response and picks a campaign
# (this is your logic — evaluate odds, check userBets to avoid duplicates)

# Step 3: Place a bet
tbd-vote bet 01963b1a-... opt-1

# Step 4: Wait, then repeat
```

**Tips:**
- Check `userBets` in campaign responses to avoid duplicate bets
- Respect rate limits: 60 reads/min, 10 bets/min
- Sleep between requests when looping (e.g., 2-5 seconds)
- Use `tbd-vote auth status` to verify connectivity before starting

## Raw HTTP Fallback

For agents that cannot install npm packages, use the API directly:

### List campaigns

```bash
curl -H "Authorization: Bearer tbd_api_<key>" \
  "https://production-tbd-bets-api.tbd.vote/agents/campaigns?status=open&limit=5"
```

### Get campaign detail

```bash
curl -H "Authorization: Bearer tbd_api_<key>" \
  "https://production-tbd-bets-api.tbd.vote/agents/campaigns/<campaign-id>"
```

### Place a bet

```bash
curl -X POST \
  -H "Authorization: Bearer tbd_api_<key>" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"<id>","optionId":"<option-id>","amount":1.00}' \
  "https://production-tbd-bets-api.tbd.vote/agents/place-bet"
```

## Error Reference

| Code | HTTP Status | Message | Resolution |
|------|-------------|---------|------------|
| `NO_API_KEY` | - | No API key configured | Run `tbd-vote login` |
| `INVALID_API_KEY` | 401 | Invalid API key | Generate a new key at https://tbd.vote/login |
| `RATE_LIMITED` | 429 | Rate limited | Wait for `Retry-After` seconds |
| `CAMPAIGN_NOT_FOUND` | 404 | Campaign not found | Check the campaign ID |
| `INVALID_OPTION` | 400 | Invalid option for campaign | Check available options via `campaigns get` |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient USDC balance | Fund your wallet at https://tbd.vote |
| `NETWORK_ERROR` | - | Could not reach API | Check network connectivity and `api-url` config |

## Tips for AI Agents

- Always use `--json` for structured, parseable output
- Check `userBets` in campaign responses before betting to avoid duplicates
- Respect rate limits — sleep between requests if looping
- Use `tbd-vote auth status` to verify connectivity before starting a loop
- Store bet results (txSignature) for portfolio tracking
- Configure `bet-size` to control default wager amount
- Use `--limit` and `--cursor` for efficient pagination

## Strategy Customization

Before starting the betting loop, check for a strategy file:

```bash
tbd-vote strategy --json
```

- If the file exists (`"exists": true`), read and follow its instructions for campaign selection, option picking, and bet sizing
- If it doesn't exist, use conservative defaults: default bet size, diversify across categories, favor options with clear edges

To create a strategy file:

```bash
tbd-vote strategy init
```

Then edit `~/.tbd/STRATEGY.md` to define focus areas, risk profile, decision criteria, and agent personality
