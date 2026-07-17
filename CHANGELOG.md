# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-07-17

### Added

- IATA dataset refresh workflow for updating airport and airline data (hot-kb2z).

### Fixed

- Clearer guidance and validation for IATA dataset refreshes (hot-kb2z).

## [0.1.2] - 2026-07-17

### Changed

- Updated Cheerio and its transitive `undici` dependency to remediate reported vulnerabilities.
- Pinned the remote airport dataset to an immutable upstream commit.
- Documented Google Hotels scraping, privacy, and reliability limitations.
- Restricted CI workflow permissions to read-only repository contents.
- Clarified that the service is unofficial (hot-fe21).

### Fixed

- Validate the pinned airport dataset before use (hot-fe21).

## [0.1.1] - 2026-07-17

### Changed

- Refreshed the README quick start with date placeholders and clearer guidance to use future travel dates.
- Streamlined installation and usage documentation to focus on the CLI.

### Removed

- Removed README implementation, project-structure, and known-limitations sections.

## [0.1.0] - 2026-07-17

### Added

- Hotel search via Google Hotels scraping
- Plain text and JSON output formats (`--json` flag)
- Sort options for results (`--sort` flag with price, rating, distance)
- Verbose mode for detailed logging (`--verbose` flag)
- Debug mode for troubleshooting (`--debug` flag)
- NO_COLOR environment variable support for accessibility

[Unreleased]: https://github.com/crcatala/hotella/commits/main
