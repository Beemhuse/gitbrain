# GitBrain

GitBrain is a modular Node.js CLI for generating developer-facing content from Git commits and analyzing pull request risk.

## Features

### `gitbrain content`
Fetches the latest 5 commits and generates a human-friendly dev update thread with:
- **Smart categorization**: commits are classified as features, fixes, refactoring, docs, or other
- **Narrative summary**: auto-generated summary like "shipped 2 features, fixed 1 issue"
- **Highlights**: key features and fixes called out at the top
- **Clean formatting**: organized sections with author attribution

### `gitbrain risk`
Computes a risk score based on diff summary metrics with:
- **Risk level**: LOW / MEDIUM / HIGH
- **Critical file detection**: identifies changes to auth, payment, security, config, and core files
- **AI-powered analysis**: explains risk in plain language and highlights likely failure points
- **Detailed metrics**: files changed, lines added/deleted
- **Smart scoring**: weighted calculation based on scope and criticality of changes

## Critical file categories

The risk analyzer automatically detects changes to critical files and flags them:

- **🔐 Auth**: Files containing authentication logic (auth, oauth, jwt, password, session, token, login)
- **💳 Payment**: Files related to payments (payment, stripe, paypal, checkout, billing, credit, invoice)
- **🔒 Security**: Files related to encryption and security (crypto, secret, encryption, ssl, certificate, tls)
- **⚙️ Config**: Configuration and environment files (config, env, .env, settings, database, connection, api)
- **🔧 Core**: Core application files (core, kernel, engine, main.js, index.js, package.json)

When critical files are detected, the risk score receives a significant boost to flag them for review.

## Install

```bash
npm install
npm link
```

## Environment

GitBrain stores your provider and API key persistently in `~/.gitbrain/config.json`.

- `OPENAI_API_KEY` for OpenAI
- `GEMINI_API_KEY` for Gemini-style endpoints
- Optionally `OPENAI_API_BASE` to override the API host
- Optionally `OPENAI_MODEL` or `GEMINI_MODEL` to set the LLM model

Example:

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-3.5-turbo
```

## Persistent configuration

If no config exists, GitBrain will prompt for provider and API key on first use and save it locally.

To update or reset the stored provider settings, use:

```bash
gitbrain config
```

You can still override the provider on each run:

```bash
gitbrain content --provider openai
gitbrain risk --provider gemini
```

If no key is provided and no local config exists, GitBrain falls back to basic local analysis and shows a warning.

## Error handling

GitBrain includes robust error handling for common issues:

**Not a Git repository**: When you run any command outside a Git repository, you'll see a friendly error message with a suggestion to initialize a repository:

```
error Not a Git repository
  This command must be run inside a Git repository.
  Try: git init
```

This applies to all commands: `content`, `today`, and `risk`.

## Usage

```bash
gitbrain content

gitbrain today

gitbrain risk
```

## Example output

### Content command
```
📝 Dev Update

This sprint I shipped 2 features, fixed 1 issue.

Highlights
✨ Key feature: Add dark mode support
🐛 Fixed: Navigation menu rendering

What changed
Features:
  • Add dark mode support — alice
  • Improve search performance — bob

Fixes:
  • Fix menu click handler — alice

📊 3 commits from current repository
```

### Risk command
```
⚠️  Risk Assessment

Risk Level: MEDIUM  (Score: 68 / 100)

🚨 Critical files detected:
  🔐 Auth: src/auth/login.js
  💳 Payment: src/payment/checkout.js
  ⚙️  Config: .env, config/database.js

Metrics:
  Files changed: 12
  Lines added: 250
  Lines deleted: 120
  Total changes: 370

⚠️ Critical files changed. Require careful review and testing.
```

## Project structure

- `bin/index.js`: CLI entrypoint
- `src/commands`: command handlers
- `src/core`: Git integration, analysis, and formatting
- `src/services`: AI helpers and commit analysis
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

