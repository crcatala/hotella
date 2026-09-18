# Research: Jev and its Potential for `crcatala/hotella`

- **Repository:** `crcatala/hotella` (local checkout `/tmp/jev-research.1FrXpC/hotella`)
- **Research date:** 2026-09-18
- **Evidence basis:** Jev facts are taken from the parent‑verified source dossier (`/tmp/jev-research.1FrXpC/jev-source-dossier.md`) unless noted. Repo facts are direct reads of this checkout. Labels used throughout: **[Vendor claim]**, **[Independent]**, **[Repo — direct evidence]**, **[Inference]** (my own reasoning), **[Assumption]** (repo-fit guess that needs validation).

> **Evidence caveat:** The primary Jev facts below are *parent-fetched* from the linked sources, not independently re-fetched by me in this runtime (no `web_search`/`source_check` available). Vendor performance/cost figures are workload-specific marketing claims, and the architecture post is explicitly black-box speculation. Treat all Jev capability statements as *to be re-validated against the live API and docs* before any build decision.

---

## 1. Executive summary

**What Jev is:** Jev is TypeSafe's first "System One Model" — a hosted model that takes structured state in and returns **typed decisions with probabilities** out (yes/no, choice-among-options, rubric score), rather than free-form text. It is designed to be a fast, cheap, non-generative judgment primitive that ordinary code calls in a loop. **[Vendor claim / dossier]**

**What `hotella` is:** A single-maintainer, MIT-licensed Node CLI (`hotella search <location>`) that scrapes Google Hotels HTML, parses hotel cards with Cheerio, and prints results as plain text, a table, or JSON. It has **no server, no accounts, no API keys, and no persistent state**; its dominant failure modes are anti-bot/rate-limit blocks and fragile CSS-selector parsing. **[Repo — direct evidence]**

**Bottom-line potential impact:** **Medium.** Jev is a genuinely good *shape* match for hotella's hardest reliability problem (deciding "did we get blocked/consent-walled, or did Google just change its layout, or is this result set real?") and for a new *intent-driven* search experience. It is a **poor** match for the features people most often want next (generating hotel summaries/explanations, multimodal input) — those are explicitly outside its interface. The biggest friction is architectural, not technical: adding Jev injects a **network API key and a third-party data processor** into a tool whose entire value proposition is zero-config `npx`, local execution, and no credentials. The realistic win is a **maintainer-side or opt-in** judgment layer, not a mandatory dependency in the default path.

---

## 2. Technical explanation of Jev

### 2.1 What it is (verified from dossier)
- A class of models TypeSafe calls **System One Models**; Jev is the flagship/first public model. Interface is **structured state in → typed decisions/probabilities out**, not chat completion. **[Vendor claim / dossier]**
- **API:** `POST https://api.typesafe.ai/v1/systemone`, bearer API key, model alias `jev-latest`. A request evaluates one `state` (string, JSON object, or array of text values) against a map of **typed questions**. **[Vendor claim / dossier]**
- **Question primitives:**
  - **Noul** — binary yes/no → probability in `[0,1]`.
  - **Choice** — pick among caller-defined options → selected option + probability distribution.
  - **Score** — rate against an ordered, caller-defined rubric → probability-weighted score + legend + distribution + derived `confidence`. **[Vendor claim / dossier]**
- **Confidence** is *derived from the distribution*, not an independent learned guarantee; Noul does not return the same confidence field. **[Vendor claim / dossier]**
- **Control flow belongs to code.** TypeSafe recommends deterministic side effects in code, narrow atomic questions, composing answers in code, and using probability thresholds to act/review/escalate. It is explicitly **not an agent**. **[Vendor claim / dossier]**
- **Input is text-only** (strings/objects/arrays). Images, audio, video are **unsupported**. **[Vendor claim / dossier]**
- **No generation:** it does not produce replies, code, or explanations of reasoning. **[Vendor claim / dossier]**
- **Training direction:** RLCD ("Reinforcement Learning for Calibrated Decisions") — probabilities should track empirical accuracy across groups; calibration is **not** an individual-prediction guarantee. **[Vendor claim / dossier]**
- **Errors:** documented 401, 422, 429, 529 with exponential-backoff guidance. **[Vendor claim / dossier]**
- **Performance/cost (vendor-reported, workload-specific):** ~70–500 ms end-to-end; $0.042/M input tokens ($42/billion); free output tokens; ~40x–200x speedups for System-One-shaped queries; homepage comparisons of 193.6x faster / 444.6x cheaper. **Not independent guarantees.** **[Vendor claim / dossier]**
- **Access/launch status:** early access at launch; launch-post evals compare models on the *same code-defined workflow* using OpenAI/Anthropic predictions as reference probabilities, authored by the model capabilities team (disclosed bias). **[Vendor claim / dossier]**

### 2.2 Independent view
- Archer Hume's post argues Jev's core proposition is **direct decision probabilities over shared state and allowed answers**, rather than generated confidence text, and reconstructs a plausible architecture (shared-state encoding, question branches, direct probability readouts, possibly listwise option processing). The author **labels deeper architectural claims speculative** — do **not** treat causal-transformer / sparse-MoE / KV-sharing / exact readout details as confirmed. **[Independent / dossier]**
- Black-box observations (single early-access version/region) report behavior consistent with **question isolation, option-order sensitivity, listwise option interactions**, and fast server-reported timings — but these **do not uniquely identify** the implementation and are not isolated hardware benchmarks. **[Independent / dossier]**
- A calibration analysis exists on selected benchmark/fresh-math samples, but is **not proof of domain calibration**; each integration still needs held-out, domain-specific threshold calibration and drift monitoring. **[Independent / dossier]**
- `evals.typesafe.ai` shows **code-defined workflows** (example: expense-claim review — classify type, assess description match, then code routes to approval/review). Treat as **vendor-controlled evidence**; inspect methodology before using as a benchmark. **[Vendor / dossier]**

### 2.3 Fit model (from sources)
- **Good fit:** narrow semantic classification, detection, routing, scoring/ranking, retrieval, verification, feature extraction — where the answer space is defined in advance and code owns actions. Especially **high-volume, low-latency checks and confidence-gated routing**. **[Vendor + Independent / dossier]**
- **Poor fit / unsupported:** open-ended generation, code generation, explanations, unconstrained agent loops, multimodal. **[Vendor / dossier]**
- **Safe integration pattern:** deterministic prechecks first → send minimal structured state → ask independent atomic questions → keep thresholds reviewable → log probabilities/outcomes → route low-confidence/high-risk cases to humans or a stronger model → never let a valid typed output bypass authorization/policy/side-effect checks. **[Vendor + dossier]**

---

## 3. `hotella` architecture and workflows (repo — direct evidence)

**Shape:** ESM TypeScript, Node `^22.21 || >=24`, published to npm as `hotella@0.1.3`, MIT. Single command `hotella search <location>`. **[Repo]**

**Pipeline (`src/commands/search.ts`):**
1. Validate dates (future check-in, checkout > check-in), guests (adults 1–9, children 0–8, total ≤ 9), sort mode, limit, currency (USD/EUR/GBP/JPY/TWD).
2. `resolveLocation()` (`src/lib/iata.ts`): if input matches `^[A-Z]{3}$`, resolve IATA → city via a **pinned CSV** (`AIRPORTS_DATA_REVISION`), cached 7 days in `~/.cache/hotella`, with a bundled ~50-airport fallback and hand-maintained metro overrides (JFK→New York, NRT→Tokyo, etc.). **[Repo]**
3. `fetchHotelsHtml()` (`src/lib/fetcher.ts`): builds a Google Travel URL and fetches via **`impit`** (TLS/browser impersonation, `chrome`/`firefox`). Handles 429, other non-OK, and short-HTML (<1000 chars) as rate-limit signals. **[Repo]**
4. `parseHotelsHtml()` (`src/lib/parser.ts`): Cheerio with **hard-coded Google selectors** `div.uaTTDe`, `h2.BgYkof`, `span.KFi5wf.lA0BZ` (rating, with `aria-label "out of 5"` fallback), `span.LtjZ2d` (amenities); regex/heuristic price extraction per currency with locale-aware separators. **[Repo]**
5. Filter (`src/lib/filters.ts`), sort (`src/lib/sort.ts` — `price-asc|price-desc|rating|value`), limit, then format via plain/table/JSON (`src/lib/table.ts`, `src/commands/search.ts`). **[Repo]**

**Operational realities:**
- **No credentials, no accounts, no persistence, no server.** Runs entirely locally under `npx`. **[Repo]**
- **Single, fragile external dependency:** Google's HTML. Selector changes and blocks are the primary breakages; the code even embeds a heuristic "HTML > 5000 chars but 0 hotels → likely layout change" error, dumping `uaTTDe`/`BgYkof` presence into `--debug`. **[Repo]**
- **Privacy posture (documented in README):** searches send location + travel dates + caller IP to Google; the tool is explicitly unofficial. **[Repo]**
- **Testing/CI:** offline unit+integration tests (`scripts/test-unit.sh`, excludes `*.live.test.ts`); separate live tests hit real Google with a request delay; CI runs `pnpm run verify` (tests, lint `oxlint`, typecheck `tsgo`, `prettier`, build, `npm pack` smoke test) on Node 22 & 24. **[Repo]**
- **Governance:** personally maintained; **not accepting code contributions/PRs/feature requests**; bug reports with reproduction welcome; forks encouraged. **[Repo]** — this constrains "ship a big new AI feature" as much as any technical factor.

---

## 4. Repo-specific opportunities for Jev

Legend: **[Inference]** = my reasoning; **[Assumption]** = repo-fit guess needing validation. None of these have been prototyped; all require verifying Jev behaviour and cost against the live API first.

### 4.1 New customer-facing features
1. **Intent-based search ("`hotella ask`") — NL → typed `SearchQuery`.** A new mode where a user types e.g. *"cheap 4-star near the beach in Lisbon next weekend for 2"* and Jev fills typed slots (sort, min-rating, budget band, guest count) via **Choice** among enumerated candidates and **Score** on rubric bands. Because Jev returns typed decisions, the CLI keeps its existing downstream pipeline unchanged. **[Inference]** *Caveat:* free-form entity extraction (arbitrary city/date strings) is closer to generation than Jev's documented primitives; the fit is strongest when the slot values are drawn from **enumerable candidates** (known cities, sort modes, budget bands). **[Assumption]**
2. **Soft-criteria "value" scoring.** Today `--sort value` is just `rating / price` (`src/lib/sort.ts`). Jev **Score** could rate each hotel's amenity/description text against a caller rubric ("good for families", "quiet", "walkable to transit") and produce a probability-weighted score + derived confidence, enabling a ranked "match to my needs" view that code-owned sorting can consume. This is a genuine differentiator that needs **no generation**. **[Inference]**
3. **Ambiguous/misspelled location disambiguation.** Complement IATA resolution: when `resolveLocation` can't map the input, Jev **Choice** over a candidate list (top matches or a bundled gazetteer) can pick the intended place and return a probability so the CLI can ask rather than silently search the wrong city. **[Inference]**
4. **Explicitly NOT good fits (record these to avoid wasted effort):** a generated "why we recommend this hotel" narrative, a chat travel assistant, or photo-of-hotel input — all **unsupported** by Jev's documented interface (no generation, text-only). Any such feature must come from code or a different model. **[Vendor claim + Repo]**

### 4.2 Backend / automation capabilities (the strongest fit)
5. **Scrape-failure / anti-bot triage ("what did we actually receive?").** Replace the crude `html.length` heuristics with a Jev classifier over the fetched HTML/state: `Noul` for consent-wall vs. blocked vs. genuine results, `Choice` to categorise the page type. This directly attacks the tool's #1 fragility and improves error messages and retry logic. **[Inference]** Fast + cheap per vendor figures (but those are workload-specific). **[Vendor claim]**
6. **Result-quality verification ("does this parse look sane?").** After parsing, feed a compact summary of results (names/prices/ratings) to Jev and ask a **Noul** "does this look like a plausible hotel result set, or a degenerate/parse-broken set?" A low-probability signal can downgrade the run to a warning instead of silently emitting garbage. **[Inference]** *Must remain advisory* — never let a typed "OK" substitute for real validation. **[Vendor guidance]**
7. **Batch/portfolio search automation.** For scripted use (`--json | jq`), a wrapper could fan out many city/date queries and use Jev to **route** results ("flag only searches where the cheapest plausible option changed > X%" or "select which results deserve human review"). This is classification/routing, squarely in-fit. **[Inference]**

### 4.3 Developer tooling
8. **Test-fixture and CI triage.** Classify saved live-test failures / captured HTML snapshots into buckets (blocked / consent / layout-changed / genuine-empty) with **Choice**, so maintainers get a clearer signal than "test failed". Especially valuable given the maintainer runs live tests manually with delays. **[Inference]**
9. **Live-test canary.** Use a **Noul** judgment on a live fetch to assert "this looks like a real result page" before running the expensive assertion suite. **[Inference]**

### 4.4 Admin / operations
10. **Error/support triage.** Because bug reports are the accepted contribution channel, Jev **Choice** over incoming reproduction reports/error text could auto-bucket them (network / 429 / parse-break / usage error) for the maintainer. **[Inference]**
11. **Abuse/rate-limit signal classification** if hotella ever fronts a shared service (it currently does not). **[Assumption]**

> **Cross-cutting architectural cost (applies to every item):** hotella today has **zero secrets and zero third-party processors besides Google**. Adopting Jev adds (a) an API key/credential to manage, (b) a second outbound data flow that may include user query text and scraped hotel data, and (c) a hard online dependency that breaks the zero-config offline-ish `npx` story. Any non-optional integration is a **privacy and reliability change**, not just a feature. **[Inference]**

---

## 5. Recommendations

Impact is *predicted* for this specific repo, given its single-maintainer, no-backend, no-credentials shape. Complexity/dependencies/risks are engineering estimates, not measured.

### 🔴 Huge predicted impact

**H1 — Scrape-failure & result-quality judgment layer (items 5 + 6), shipped as an *opt-in/off-critical-path* module.**
- **Expected value:** Attacks the dominant failure mode (blocks/layout changes) and the silent-garbage risk; improves error clarity and trust without changing the core UX.
- **Implementation complexity:** **Medium** — a thin `src/lib/` judge module calling the HTTP API, plus HTML→state reduction, threshold config, and graceful degradation when the key/network is absent.
- **Architectural disruption:** **Medium–High** — introduces a credential + third-party processor + online dependency into a previously credential-free local tool. Must be **opt-in** (`HOTELLA_SYSTEMONE_API_KEY`) with a strict no-op fallback.
- **Dependencies:** TypeSafe API key + early-access access; stable `jev-latest` schema; retry/backoff for 429/529; documented data-handling terms for scraped content.
- **Risks:** false confidence (a typed "OK" masking real breakage); adds a *new* failure mode; vendor cost/latency claims are unverified for this workload; privacy disclosure must be updated.
- **Next experiment:** **Offline**, maintainer-only: collect saved HTML fixtures across known states (real results, consent wall, captcha/block, empty) and evaluate Jev's `Choice`/`Noul` accuracy vs. the current `html.length` heuristic. If no clear accuracy win → do not build. **[Inference]**

**H2 — "Smart search"/intent + soft-criteria scoring as a new `hotella ask` mode (items 1 + 2).**
- **Expected value:** The clearest *customer-facing* unlock — turns flag-driven search into intent-driven, and adds a differentiated "match to my needs" ranking that no simple heuristic provides.
- **Implementation complexity:** **Medium–High** — NL-slot mapping must be designed around enumerable candidates (Jev is not an extractor/generator); prompt/rubric design; UI copy.
- **Architectural disruption:** **Medium** — can reuse the existing downstream pipeline, but still needs the key/processor and a fallback to the classic flag-based CLI.
- **Dependencies:** Same as H1, plus validating that Jev can map free-form phrasing to typed slots well enough to be usable.
- **Risks:** Jev may under-serve free-form extraction (fit uncertainty); adds latency to interactive use; scope creep toward features Jev cannot do.
- **Next experiment:** Build a 30–50 example phrase set with ground-truth intents; measure slot-mapping accuracy using **Choice over enumerated candidates** only; kill the feature if accuracy is not clearly better than a tiny rule/keyword parser. **[Inference / Assumption]**

### 🟡 Medium predicted impact

**M1 — Location disambiguation when IATA/city lookup fails (item 3).**
- **Expected value:** Fewer silently-wrong searches; complements, not replaces, the existing resolver. Narrow, low-risk scope.
- **Complexity:** **Low–Medium.** **Disruption:** **Medium** (still needs the key unless degraded to "ask the user").
- **Dependencies/Risks:** candidate gazetteer quality; probability threshold tuning; risk of extra round-trip latency.
- **Next experiment:** Offline classification of ~100 ambiguous/misspelled inputs against a candidate list; compare Jev to a fuzzy-string baseline. **[Inference]**

**M2 — Maintainer/dev tooling: live-test + fixture triage (items 8 + 9).**
- **Expected value:** Better CI/live-test signal for a solo maintainer; keeps the project healthy. Low blast radius (dev-only).
- **Complexity:** **Low.** **Disruption:** **Low** (CI/dev tooling, not shipped runtime).
- **Dependencies/Risks:** CI secrets for the API key; flaky live tests; cost per CI run.
- **Next experiment:** Run Jev over a folder of archived failing fixtures in CI and compare bucketing vs. current log parsing. **[Inference]**

**M3 — Support/error auto-triage (item 10).**
- **Expected value:** Reduces maintainer toil on the one accepted contribution channel (bug reports).
- **Complexity:** **Low.** **Disruption:** **Low.** **Dependencies/Risks:** low volume may not justify setup; must not auto-close real reports.
- **Next experiment:** Manual pilot over the last N issues/error logs. **[Inference]**

### 🟢 Low predicted impact
- **L1 — Changelog/release-note classification** (`Release-it`/Keep-a-Changelog flow): process is already small and manual; minimal ROI.
- **L2 — PR triage:** **repo does not accept contributions**, so this is moot. **[Repo]**
- **L3 — Any generative/multimodal feature** (hotel summaries, chat assistant, image input): **unsupported by Jev**; would need a different model — out of scope here. **[Vendor claim]**
- **L4 — Prompt-injection/agent guardrails:** only matters if hotella becomes an *agent-consumed* tool at scale; currently it is a local CLI, so speculative. **[Assumption]**

---

## 6. Prioritized roadmap

1. **Validate the interface first (0 code in the shipped CLI).** Re-fetch and confirm the live API schema, current access/early-access status, pricing ($0.042/M input claim), latency, and 429/529 behavior against the actual docs — the dossier is second-hand and vendor-priced. **[Prerequisite to everything]**
2. **Run the H1 offline experiment** (saved-HTML classification + result-sanity) against the current heuristic baseline. *Gate: only proceed if it clearly wins on accuracy.*
3. **If H1 wins, ship an opt-in `HOTELLA_SYSTEMONE_API_KEY` judge** with strict no-op fallback, documented privacy addendum, and thresholds in reviewable config.
4. **Run the H2 slot-mapping experiment** (enumerable-choice only) and the M1 disambiguation experiment in parallel offline.
5. **Only then** consider a user-facing `hotella ask` mode; otherwise ship M2/M3 as maintainer tooling.

**Guiding principle:** because hotella's identity is *zero-config, local, credential-free*, every Jev integration should default to **off**, degrade gracefully, and be *advisory only* (never gate authorization, side effects, or final correctness).

---

## 7. Open questions

- Is Jev/System One **generally available**, and what is **current, non-promotional pricing** and rate-limit policy for a low-volume CLI? **[Vendor claim / dossier]**
- What **data-handling/privacy terms** apply to sending scraped Google content and user query text to TypeSafe? Does that conflict with the tool's neutrality/"unofficial" posture? **[Assumption]**
- Does Jev actually perform well at **JSON-slot mapping from free-form user phrasing**, or only at choosing among provided options? The whole `ask` feature hinges on this. **[Assumption]**
- **Latency in the interactive path:** does a Jev round-trip materially degrade the CLI's feel versus the already-slow Google scrape? **[Vendor claim / dossier]**
- **In-domain calibration:** the independent calibration evidence is not domain-specific; what thresholds are defensible for hotel-page/result-sanity judgments? **[Independent / dossier]**
- **Maintainer bandwidth & non-contribution policy:** even a good feature may not land in a repo that rejects PRs — a fork or an out-of-repo wrapper may be the realistic delivery vehicle. **[Repo]**

## 8. Limitations of this research

- **No first-hand web access in this runtime:** Jev statements come from the parent-supplied dossier, not my own fetches. `source_check` was unavailable, so I could not independently validate the dossier. Re-validate before committing.
- **Vendor claims are workload-specific:** 70–500 ms, $0.042/M, and 40x–200x/193.6x/444.6x figures are TypeSafe marketing for their own workflows, not measured for a CLI scrape path.
- **Architecture is speculative:** the independent post itself labels transformer/MoE/KV-sharing/readout details as black-box inference.
- **Repo-fit items are unprototyped inferences**, not measured outcomes; complexity/disruption/risk estimates are engineering judgement.
- **Freshness:** Jev was early-access at launch and is time-sensitive; verify current docs, pricing, and access before acting.

---

## 9. Sources

**Jev (via parent-fetched dossier; research date 2026-09-18):**
- TypeSafe — *Introducing System One Models and Jev* — https://typesafe.ai/blog/introducing-system-one-models-and-jev — launch claims (capabilities, latency, pricing, evals methodology, early access). **[Vendor claim]**
- TypeSafe — homepage — https://typesafe.ai — positioning of System One Models / Jev; homepage speed/cost comparisons. **[Vendor claim]**
- TypeSafe Docs — *System One concepts* — https://docs.typesafe.ai/concepts/system-one — state-in/typed-decisions-out model, primitives. **[Vendor claim]**
- TypeSafe Docs — *API* — https://docs.typesafe.ai/api — endpoint, `jev-latest`, bearer key, 401/422/429/529, backoff. **[Vendor claim]**
- TypeSafe Docs — *How to build with System One* — https://docs.typesafe.ai/concepts/how-to-build-with-system-one — code-owns-control-flow guidance. **[Vendor claim]**
- TypeSafe Docs — *Confidence* — https://docs.typesafe.ai/confidence — confidence derived from distributions. **[Vendor claim]**
- TypeSafe Docs — *Machine learning primer* — https://docs.typesafe.ai/introduction/machine-learning-primer — RLCD / calibration framing. **[Vendor claim]**
- TypeSafe Evals — https://evals.typesafe.ai — code-defined workflow evaluations (vendor-controlled). **[Vendor evidence]**
- Archer Hume — *Jev's Architecture Unmasked* — https://archerhume.com/posts/jevs-architecture-unmasked — independent black-box analysis; explicitly speculative architecture claims. **[Independent]**
- Archer Hume — evidence bundle — https://archerhume.com/research/jev/evidence.json — public measurements for the post. **[Independent]**

**Repository (direct reads in `/tmp/jev-research.1FrXpC/hotella`):**
- `README.md`, `CONTRIBUTING.md`, `RELEASING.md`, `CHANGELOG.md`, `package.json`
- `src/commands/search.ts`, `src/run.ts`, `src/cli-main.ts`, `src/cli/{program,context,output,errors,spinner,help}.ts`
- `src/lib/{types,fetcher,parser,sort,filters,table,iata}.ts`
- `scripts/{verify.ts,check.sh,test-unit.sh,refresh-iata-data.mjs}`, `.github/workflows/ci.yml`

**Rejected/deprioritized:** none flagged as fabricated; Google Hotels' own terms/robots policy was noted via the repo's README disclaimer rather than fetched, because the research question concerned Jev, not additional scraping-policy confirmation. **[Repo]**
