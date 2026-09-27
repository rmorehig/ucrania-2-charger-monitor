# Ucrania 2 charger monitor

This repository runs background checks for the public [Calle Ucrania 2 charger status site](https://ucrania-2-cargador.rafamoreno.chatgpt.site/). The site stores browser push subscriptions and sends a notification when either connector changes its reported state.

- `cloudflare/` contains a Durable Object alarm that calls the authenticated monitor endpoint every 30 seconds. A one-minute Cron Trigger restarts the alarm if it stops.
- `check-charger.yml` is a manual fallback check; GitHub's unreliable schedule is disabled.
- `MONITOR_TOKEN` is stored as a Cloudflare Worker secret, a Sites runtime secret, and a GitHub Actions secret. It is never stored in this repository.

The site refreshes every 30 seconds while open. A change that happens and reverses between background checks may not be observed, and delivery depends on each browser's push service.
