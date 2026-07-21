# TrustLab

An interactive online cognitive study on how people calibrate trust in AI assistants.
Static site, zero dependencies, zero backend, all participant data stays on-device.

**Live:** https://nhiqmaii.github.io/trustlab/

## What it is

TrustLab is a small vehicle for one research question:

> How well do people calibrate their trust in an AI assistant's answers,
> and how does the AI's stated confidence shift that calibration?

Participants complete a short (~5 minute) trivia task in which a scripted AI
assistant offers each answer with a stated confidence level. On every trial the
participant either accepts the AI's answer or overrides it with their own.
Behind the scenes we log the decision, response time, and correctness.

After finishing, participants see a personal decision profile
(reliance, confidence sensitivity, accuracy, response time) alongside a
simulated aggregate for reference.

## Design decisions

- **Scripted AI, not a live LLM.** The AI's response is a controlled variable,
  not a source of noise. Every participant sees the exact same stimulus,
  which lets us attribute variance in behavior to the manipulation rather than
  to model flakiness. Full rationale in `methodology.html`.
- **Local-only data.** All session data lives in the participant's browser via
  `localStorage`. Nothing is sent to a server (there is no server). Participants
  can export or wipe their data in one click.
- **Simulated aggregate for launch.** The dashboard is built against a seeded
  synthetic participant sample (N = 147), clearly labeled as such. When a real
  backend is added, `js/aggregate.js` gets replaced with a `fetch()` call and
  every chart on the dashboard keeps working.

## Structure

```
trustlab/
  index.html            # Landing / hook
  experiment.html       # The task itself
  results.html          # Personal report after a session
  dashboard.html        # Aggregate view (simulated pilot data)
  methodology.html      # How the study is designed
  ethics.html           # Privacy + AI-ethics policy
  css/                  # base.css, home.css, experiment.css, data.css
  js/                   # store, stimuli, experiment, analytics,
                        # aggregate, charts, results, dashboard, nav
  icons/icon.svg
```

## Running locally

```
cd trustlab
python3 -m http.server 8080
open http://localhost:8080
```

Everything is static. No install, no build step.

## Roadmap

- Expand the item pool from 10 to 30+ trials and randomize order.
- Add a domain manipulation (trivia vs. medical vignettes vs. creative tasks).
- Optional post-task demographic questions.
- Real backend for actual aggregate results (Supabase or a small serverless function).
- Publish a formal write-up once a real sample has been collected.
