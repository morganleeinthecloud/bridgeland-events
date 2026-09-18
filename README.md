# Bridgeland & Renfrew Events

A static community calendar for Bridgeland, Riverside and Renfrew (inner-Calgary), built from
community sources and republished daily.

**Live:** https://morganleeinthecloud.github.io/bridgeland-events/

## How it works

```
Hermes cron job (08:00 MT)           ->  scans 8 sources, writes a digest + a JSON block
  ~/.hermes/scripts/publish_events.py ->  merges the JSON into public/data/events.json,
                                           prunes to [-7 days, +60 days], regenerates the .ics,
                                           commits and pushes (no LLM cost)
GitHub Actions                       ->  builds Vite/React and deploys to GitHub Pages
```

Sources: Bridgeland Love (FB group), Bridgeland/Riverside (FB group), BRCA and Renfrew CA
(FB pages), brcacalgary.org, renfrewyyc.ca, renfrew.getcommunal.com, RCA Google Calendar.

## Data

`public/data/events.json` — one windowed file, rewritten daily. Every event carries a stable id
(`fb:<group>:<post>`, `gc:<program>`, `cal:<uid>`, `web:<slug>`), so history survives rewrites;
git history is the audit trail of what changed and when. Nothing older than 7 days, or further out
than 60 days, is kept in the payload.

`public/bridgeland.ics` — the same window as a calendar feed. Subscribe to it from any phone or
desktop calendar app.

## Local development

```bash
npm install
npm run dev      # Vite dev server (prints its own URL)
npm run build    # type-check + build to dist/
node scripts/validate-data.mjs
```

## Front end

Vite + React + TypeScript, FullCalendar (month / week / agenda), hand-rolled CSS with a dark and
light theme. Responsive to phone width: under 700px the calendar opens on Agenda, filter rows
become swipeable strips, and the event sheet becomes a bottom sheet. Filters: neighbourhood, category, source, new-only, recurring, free, date window and
free-text search. No backend, no database, no runtime API keys.
