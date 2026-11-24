# LogiTrack Homepage Upgrade

This package contains the upgraded homepage only.

## Files
- `index.html` — homepage markup and existing navigation destinations
- `style.css` — original styles plus the interaction layer and dark theme
- `script.js` — Vanilla JavaScript interactions (no framework/dependencies)
- `logitrack-hero.jpg` — the original supplied hero image

## Run locally
Keep all four files in the same directory, then open `index.html` in a browser. For the best local development experience, use VS Code Live Server.

## Implemented
- Scroll-aware sticky navbar and responsive mobile menu
- Cmd/Ctrl + K command palette with keyboard navigation
- Notification centre with persistent read state
- Demo profile dropdown and persistent light/dark theme
- Tracking ID validation, suggestions and recent searches
- Data-driven animated homepage KPIs
- Searchable, filterable and sortable demo dispatch board
- Shipment quick actions, recent activity feed, toast messages
- Scroll progress and back-to-top control
- Reduced-motion support and responsive layouts

## Demo limitations
This is a frontend-only demo. Shipment records, notifications and activity are sample data. No real GPS, backend updates, authentication, shipment creation, or push notifications are connected. Existing linked pages are intentionally not included or modified; keep them in your project directory.

## Validation
- `node --check script.js` passed.
- HTML parsed successfully; all five primary nav links and the tracking form are present.
- Local stylesheet, JavaScript and hero image paths verified.
