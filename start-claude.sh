#!/usr/bin/env bash
# =============================================================================
#  start-claude.sh — boot a new Claude Code session for the Sun Punks theme
#
#  Bypasses Claude's permission prompts (--dangerously-skip-permissions) and
#  primes the new session by pointing it at HANDOFF.md before doing anything.
#
#  ⚠  --dangerously-skip-permissions removes the safety prompts that normally
#  ask before running shell commands, editing files, or pushing to git.
#  Use this only when you've reviewed HANDOFF.md and trust the next task.
#
#  Usage:
#      ./start-claude.sh                    # plain handoff
#      ./start-claude.sh "your task here"   # handoff + an immediate task
# =============================================================================

set -e

cd "$(dirname "$0")"

# --- Pre-flight: surface current repo state -----------------------------------
echo ""
echo "================================================================="
echo "  Sun Punks Shopify Theme — Claude Session Handoff"
echo "================================================================="
echo "  Working dir:      $(pwd)"
echo "  Git branch:       $(git branch --show-current 2>/dev/null || echo '(not a git repo)')"
echo "  Latest commit:    $(git log -1 --format='%h  %s' 2>/dev/null || echo '(no history)')"
echo "  Origin URL:       $(git remote get-url origin 2>/dev/null || echo '(no origin)')"
echo "  Local vs remote:  $(if git fetch origin --quiet 2>/dev/null && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main 2>/dev/null)" ]; then echo 'in sync'; else echo 'DIVERGED — pull --rebase before pushing'; fi)"
echo ""
echo "  HANDOFF.md:       $([ -f HANDOFF.md ] && echo "present ($(wc -l < HANDOFF.md | tr -d ' ') lines)" || echo 'MISSING')"
echo "================================================================="
echo ""

if [ ! -f HANDOFF.md ]; then
  echo "ERROR: HANDOFF.md is missing. Aborting." >&2
  exit 1
fi

# --- Compose the priming prompt -----------------------------------------------
EXTRA_TASK="${1:-}"

PROMPT="HANDOFF SESSION — this is a continuation of a previous Claude session.

Your FIRST action is to read /Users/mikeodonnell/sunpunks-overhaul/HANDOFF.md
in full. It contains the complete project context, recent commit history, known
gotchas (especially around Shopify auto-commits and the 50MB theme cap), and
the user's communication preferences.

After reading it:
  1. Confirm in one sentence you've received the handoff.
  2. Summarize the project state in 3 bullets.
  3. Ask the user: 'What's next?'

Do NOT start editing files, running commands, or pushing to git until the user
has answered. Don't paraphrase the entire HANDOFF — they wrote it, they know
what's in it."

if [ -n "$EXTRA_TASK" ]; then
  PROMPT="$PROMPT

Additional task from the user (do this AFTER the handoff confirmation, not before):
$EXTRA_TASK"
fi

# --- Locate the Claude binary -------------------------------------------------
CLAUDE_BIN="$(command -v claude || true)"
if [ -z "$CLAUDE_BIN" ]; then
  echo "ERROR: 'claude' CLI not found on PATH. Install Claude Code first:" >&2
  echo "  https://docs.claude.com/en/docs/claude-code" >&2
  exit 1
fi

# --- Launch -------------------------------------------------------------------
echo "Launching: $CLAUDE_BIN --dangerously-skip-permissions"
echo ""
exec "$CLAUDE_BIN" --dangerously-skip-permissions "$PROMPT"
