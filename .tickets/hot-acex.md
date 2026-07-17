---
id: hot-acex
status: closed
deps: []
links: []
created: 2026-07-17T11:17:06Z
type: task
priority: 2
assignee: cc-vps
---
# Throttle live Google Hotels tests

Introduce a configurable delay between real Google Hotels requests in the opt-in live suite, modeled on raindrop-cli's live test request delay.

## Acceptance Criteria

Live npm scripts set a 1-second request delay and every external request in the live search test passes through the delay helper.


## Notes

**2026-07-17T11:17:09Z**

Implementing a configurable 1-second live-test delay before each real Google Hotels request; modeled after raindrop-cli's RDCLI_API_DELAY_MS approach.

**2026-07-17T11:18:07Z**

Added HOTELLA_LIVE_REQUEST_DELAY_MS=1000 to live/all scripts and a delay helper before every real request. Verified normal suite (134 tests), typecheck, formatting, and all four throttled live tests.
