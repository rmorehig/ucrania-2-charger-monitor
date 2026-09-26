# Ucrania 2 charger monitor

This repository runs background checks for the public [Calle Ucrania 2 charger status site](https://ucrania-2-cargador.rafamoreno.chatgpt.site/). The site stores browser push subscriptions and sends a notification when either connector changes its reported state.

- `check-charger.yml` calls the site's authenticated monitor endpoint every five minutes and can be run manually.
- `keep-schedule-active.yml` makes a monthly repository commit so GitHub does not disable scheduled workflows for repository inactivity.
- `MONITOR_TOKEN` is a GitHub Actions secret and a matching Sites runtime secret. It is never stored in this repository.

GitHub may delay or skip scheduled runs. A change that happens and reverses between checks may not be observed.
