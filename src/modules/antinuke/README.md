# Anti-Nuke (A`I project / Phase-A)

**Purpose:** Detect and block destructive mass actions (mass bans/kicks, channel/role/webhook/emoji create/delete).

This module is framework-agnostic: it exposes a **policy** and **detector shims** that your runtime wires into real events later (Discord, etc). Today it logs and routes to the shared enforcement pipeline (no-op by default), so it is safe to enable now.

## What it watches

- Bans / Kicks velocity per actor
- Channel / Role / Webhook / Emoji create+delete spikes
- Optional: permission escalations (future hook)

## Config (data/antinuke-config.json)

- `enabled`: master switch
- `windowMs`: sliding time window
- `thresholds`: per-action limits within window
- `actions`: what to do when tripped (delete/warn/timeout/mute/quarantine/ban/log)

## Commands (via CLI/http module)

- `antinuke:status` → prints current policy
- `antinuke:enable` / `antinuke:disable`
- `antinuke:set <json>` → replace policy atomically (validated)
