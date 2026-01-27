---
id: hot-fd0e
status: open
deps: [hot-2758]
links: []
created: 2026-01-27T21:52:17Z
type: feature
priority: 3
assignee: cc-vps
tags: [future, infra]
---
# Proxy support (--proxy flag)

Add --proxy flag for routing requests through a proxy server.

Usage:
  hotella search "Taipei" ... --proxy socks5://localhost:1080

impit already supports proxy configuration — this is mainly about exposing it as a CLI flag and passing it through to the Impit client constructor.

## Acceptance Criteria

- --proxy flag accepts proxy URL (http, https, socks5)
- Proxy is passed to impit client
- Works with SOCKS5 and HTTP proxies

