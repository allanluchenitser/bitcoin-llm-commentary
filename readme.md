Portfolio project demonstrating a full stack, multi-container application with LLM integration. Proof of concept inside a single EC2 for cost efficiency.
- _**App**: React, Node.js, TypeScript_
- _**Protocols**: WebSockets, SSE, REST_
- _**Data**: PostgreSQL, Redis (cache, pubsub)_
- _**Infra**: EC2, Docker Compose, S3/CloudFront, Lambda_

### Bitcoin live price and LLM summary project

Grabs price and volume from public crypto feeds then AI writes up text summaries of what's been happening.

*Major tooling (for now) are docker-compose and npm native workspaces for monorepo structure.*

```text
# workspaces structure (using native npm workspaces)

bitcoin-llm-commentary/
├── apps/
│   ├── price-ingestor/
│   ├── react-ui/
│   └── web-api/
├── packages/
│   └── ... (stuff)
└── workers/
    ├── llm-lambda-worker/
    └── postgres-worker/

# root package.json for some dev dependencies (example)

"workspaces": [
  "packages/*",
  "apps/*",
  "workers/*"
],
"devDependencies": {
  "@types/node": "^25.0.9",
  "typescript": "^5.9.3"
}
```

###  Application stack
PERN: Postgres, Express, React, Nodejs

####  Front End
S3 + Cloudfront for React UI and SSL.

####  Three App Containers

* Price ingestor. Ingests price data via websockets from crypto exchanges.

* Web server API using REST and SSE.

* Worker container that calls the LLM.

####  Three Database Containers

* Redis for pub/sub.

* Postgres for storing price data and summaries.

* Worker that calls sends to Postgres.

####  Lambda Functions
These will call an LLM API to generate text summaries when triggered by the price ingestion app.

###  Implementation Notes
Starting with a single EC2 instance and Docker Compose. I'll break it out to other AWS services in phase 2.

####  Reasoning of Resource Choices
* S3 + Cloudfront is standard for hosting React apps with SSL.

* Crypto feed ingress-container is a well defined role and is the primary event publisher.

* Web api host-container is a well defined role and is the primary event consumer and client interface.

* AWS Lambda scales nice for a short lived task like an LLM call.

* Postgres is a typical dependency container.

* Redis is also a typical dependency container for pub/sub.

#### Current Flow Diagram

```
[Kraken api] -> [🐳 Price Ingestor]
                        |
                        v
               __[🐳 Redis Pub/Sub]___
              |         |            |
              |         |            v
              |         |   [🐳 LLM Lambda worker] -> [AWS Lambda LLM]
              |         |
              |         v
              |   [🐳 Web API, SSE] -> [React UI]
              |
              v
        [🐳 Postgres worker] -> [🐳 Postgres]
```

* If pub/sub looks good, I might later include redis streams for reliable message delivery.

### Use of AI
Using AI for brainstorming high level architecture, crash course explanations of unfamiliar tech, and generating boilerplate code snippets.

I dislike using AI for typing readmes, etc. since it gives everything a flat feeling imo.



