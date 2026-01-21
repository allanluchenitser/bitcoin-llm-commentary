_Devlog for for Bitcoin live price and LLM summary project_

### Devlog

#### Jan 17, 2026
I've broken up directories per-app. As the project matures I'll try to turn this thing into a proper monorepo with shared packages and tooling.

#### Jan 21, 2026
Settled on npm native workspaces for monorepo.  There's Turborepo and pnpm but frankly that was starting to take up a lot of time.

Now starting to put together docker setup for "dependency" apps Postgres, Redis.