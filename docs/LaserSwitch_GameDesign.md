# Laser Switch — Game Design Document (Prototype Version)

## 1. Core Pitch
You’re a fast-moving orb on a neon track. Tap anywhere to instantly switch color (Red ↔ Blue). Rule: you can pass through same-color lasers; other color = die. It’s an endless survival with rising speed and tighter patterns.

## 2. Controls
- Single input: tap/click anywhere → toggle color.
- No hold, no multi-touch, no keyboard needed.
- Optional (later): second mode with two buttons (left=red, right=blue) if tests show mistaps.

## 3. Game Loop
1. Auto-scroll forward (constant speed that ramps over time).
2. Encounter a laser gate (red or blue).
3. Player taps to match color → pass; mismatch → death.
4. Score +1 per gate (and distance).
5. On death: instant restart (show best score + retry button).
6. (Later) Offer rewarded revive.

## 4. Visual & Audio (Prototype)
- Dark background, flat neon rectangles for lasers, glow optional.
- Player = simple circle with a colored rim.
- Clarity over style: large gates, generous margins.
- SFX: soft “switch” blip, pass “ping,” fail “crash,” subtle whoosh on speed ramp.

## 5. Difficulty & Fairness
- Initial speed: tuned for ~800–900 ms decision window on first 3–5 gates.
- Target reaction window floor: ≥ 320 ms (do not dip below ~280 ms).
- Ramp: speed +2% every 5 s up to a cap; later vary with waves.
- Gate spacing: enforce min time-between-gates (e.g., ≥ 550 ms early → ≥ 380 ms late).
- Color streaks: allow 2–3 same-color gates in a row for rhythm, but avoid long streak bias.
- Fairness constraints: never spawn a gate inside the player’s current collision box; no instant color flips on spawn.

## 6. Content Model (Endless Patterns)
- Pattern bank (JSON): short motifs (8–12 s) with metadata:
  - density (gates/second), min spacing, color sequence, moving/oscillating lasers flag.
- Composer: randomly stitches motifs by difficulty tier (Easy → Normal → Hard), ensuring fairness rules.

## 7. Scoring & Feedback
- +1 per gate cleared; distance multiplier (tiny, cosmetic).
- Combo: +1 streak for consecutive first-try correct gates (no panic double-taps) → show subtle “Streak xN” and a faint screen bloom.
- Best score stored in localStorage.

## 8. Colorblind Support (from Day 1)
- Red laser = striped texture + triangle icon; Blue laser = dotted texture + square icon.
- Also play distinct pitch on successful pass (low vs high).

## 9. Juice (Add After MVP Feels Fun)
- 120–200 ms time dilation (0.85× speed) on very close passes.
- Micro camera pulse on streak milestones (x5, x10…).
- Trail behind orb (length increases with streak).
- Gate “shatter” particles on pass (color-matched).

## 10. Session & Monetization Plan (Post-Validation)
- Interstitials every 2–3 fails or ~90 s (whichever first).
- Rewarded ad: one-time revive (continue from last safe segment with brief invulnerability).
- Cosmetics: unlock trails/skins via score milestones or rewarded ads (no gameplay impact).
- Daily run (seeded pattern) with leaderboard (portal-side if available).

## 11. Kill/Greenlight Criteria (Playtest)
- Avg session length ≥ 2.5 min (goal 3.0+).
- Median retries per user ≥ 3.
- Time-to-first-death ≥ 20 s.
- Clear understanding without tutorial for ≥80% testers.

## Step-by-Step Build Plan

### Phase A — MVP (1 Day)
Goal: Fun with grey boxes; validate the tap-to-switch loop.

1. Project skeleton: single HTML canvas with requestAnimationFrame.
2. Core systems:
   - Player state {color: RED|BLUE, pos, radius}.
   - Tap handler toggles color; debounce 70–100 ms.
   - Gate model {x, width, color}.
   - Collision logic: if mismatch → death; else score++.
3. Spawning: fixed intervals respecting min spacing.
4. Difficulty ramp: speed *= 1.02 every 5 s until cap.
5. Minimal HUD: score, best, tap-to-restart.
6. Log session length, gates cleared, deaths, retries.

### Phase B — Core Feel & Fairness (0.5–1 Day)
1. Tune min spacing and speed curve.
2. Add grace radius (30–50 ms after contact still counts).
3. Add pattern bank v1 (4–6 motifs).

### Phase C — Readability & Accessibility (0.5 Day)
Add striped/dotted textures + icons; distinct SFX per color; optional high contrast mode.

### Phase D — Retention Hooks (0.5 Day)
Streak meter, local missions (“Clear 25 gates”), save last run stats.

### Phase E — Portal Monetization (1 Day, After Validation)
Interstitial cadence ~90 s or 2–3 deaths; rewarded revive; simple cosmetic unlocks.

## Tuning Cheat-Sheet
- Viewport: Portrait 9:16 (mobile-first), scales to desktop.
- Player radius: 24 px.
- Gate width: 40–56 px; thickness 24–36 px.
- Start speed: 320 px/s.
- Min spacing: 700 ms → 380 ms over 60–90 s.
- Decision floor: never below 320 ms.
- Toggle debounce: 80 ms.
- Close-call slow-mo: trigger <120 ms before impact for 150 ms @ 0.85× time scale.

## Pattern Examples
- E1 — Alternator: R B R B …
- E2 — Twins: R R B B …
- E3 — Breath: wide → normal → tight → normal
- N1 — Nudge: oscillating blue → calm → red
- N2 — Fake-out: fast red after slow blue
- H1 — Stair: spacing shortens across 4 gates

## UX Cheap Wins
- Instant restart ≤150 ms.
- Switch preview glow.
- Hitbox forgiveness (shrink by 2–3 px).
- Audio mixing: fail SFX short, pass SFX slightly louder.

## Test Plan (10–20 Players)
Ask:
1. What’s the rule?
2. Did any death feel unfair?
3. What made you retry?
4. Would you prefer two buttons?

Metrics: session length, retries, first-death time, best score.
Greenlight: avg session ≥2.5 min, median retries ≥3, “unfair death” ≤20%.

## Backlog (Post-Greenlight)
- Third color mechanic.
- Boss waves.
- Daily run + leaderboard.
- Theme packs (space, synthwave, candy, ocean).
- Haptics on mobile.
