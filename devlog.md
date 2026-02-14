_Devlog for for Bitcoin live price and LLM summary project_

### Devlog

#### Jan 17, 2026
I've broken up directories per-app. As the project matures I'll try to turn this thing into a proper monorepo with shared packages and tooling.

#### Jan 21, 2026
Settled on npm native workspaces for monorepo.  There's Turborepo and pnpm but frankly that was starting to take up a lot of time.

Now starting to flesh out program flow and docker setup Postgres, Redis, and three app containers. Introducing a signal worker container for LLM calls.

#### Jan 22, 2026
Conatiner breakout is decided. Now to get ingestion working with Postgres and Redis.

### Fed 14, 2026
Took some seroius time to better understand Wesockets and completely redo the price ingestor. Opted for the older and more feature-rich "ws" client library for nodejs, over the newer native websockets client.
