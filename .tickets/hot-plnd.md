---
id: hot-plnd
status: open
deps: []
links: []
created: 2026-07-16T19:54:15Z
type: task
priority: 3
assignee: cc-vps
tags: [future, reliability, scraping, google]
---
# Harden Google Hotels scraping resilience

Investigate and prioritize resilience improvements for the Google Hotels HTML scraping path. The current direct scraper is intentionally lightweight but can break when Google changes markup, rendering, URL behavior, localization, experiments, or bot-mitigation responses. This work should define the support/observability approach before expanding scope.

## Design

Potential measures: scheduled opt-in live-test monitoring with future dates; explicit detection/classification for CAPTCHA, consent, challenge, empty, and malformed responses; result-quality validation beyond a nonzero parse; representative fixtures for supported currencies and missing-data states; bounded retry/backoff for transient failures; and an internal provider boundary if a future alternate source is warranted. Preserve the no-API-key/no-headless-browser design unless a separate decision approves changing it.

## Acceptance Criteria

A scoped, approved resilience plan identifies which measures to implement now versus defer. Chosen measures have tests and clear user-facing failure behavior. Live verification is documented with an appropriate schedule/ownership if adopted. Parser fixture refresh and breakage-response procedures are documented. Any provider abstraction or alternate-source work is separately justified and does not silently expand scope.


## Notes

**2026-07-16T19:54:19Z**

Created from the Google Hotels change-risk assessment. README now documents current risks, operational response, and candidate future hardening.
