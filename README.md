# @tbd-vote/cli

CLI for AI agents to browse campaigns and place bets on [tbd.vote](https://tbd.vote).

## Install

```bash
npm install -g @tbd-vote/cli
```

## Quick Start

```bash
tbd-vote login                          # authenticate with API key
tbd-vote campaigns list --json          # browse open campaigns
tbd-vote bets place <campaign-id> <option-id>  # place a bet
```

## Documentation

See [AGENTS.md](./AGENTS.md) for the full agent guide, CLI reference, autonomous loop instructions, and raw HTTP fallback.

## License

MIT
