_Devlog for for Bitcoin live price and LLM summary project_

### Devlog

#### Jan 17, 2026
Attempting mono-repo with native npm workspaces.

#### Jan 21, 2026
Fleshing out program flow and docker setup for Postgres, Redis. Introducing a worker for LLM calls.

#### Jan 22, 2026
Starting exchange price ingestion and redis pub-sub.

### Feb 14, 2026
Websockets is not trivial. Opted for the older "ws" library over the newer native websockets client.

I now have basic ticker data moving from Kraken, to price-ingestor, to redis, to a reactjs UI.

### Feb 18, 2026
Wanting to calculate volume buckets and other trade metrics. Seems like I should
do this at the price ingestor then fan out.

First off I'm wiring up LLM, Lambda for the most basic real-time price summary.
Just to keep momentum. It's fun seeing stuff on the screen yea?