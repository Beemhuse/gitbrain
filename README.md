# DevBrain

DevBrain is a modular Node.js CLI for generating developer-facing content from Git commits and analyzing pull request risk.

## Features

- `devbrain content`: fetches the latest 5 commits and formats them as a developer-ready thread
- `devbrain risk`: computes a risk score based on diff summary metrics
- Clean modular architecture for future commands, AI summarization, and GitHub Actions support

## Install

```bash
npm install
npm link
```

## Usage

```bash
devbrain content

devbrain risk
```

## Project structure

- `bin/index.js`: CLI entrypoint
- `src/commands`: command handlers
- `src/core`: Git integration, analysis, and formatting
- `src/services`: future AI and helper services
- `src/utils`: reusable CLI utilities

## Development

Run the CLI locally:

```bash
npm run start -- content
npm run start -- risk
```

## Notes

- Requires Node.js 18 or later
- Designed to be extended with additional commands like `today`, AI summarization, and CI integration
