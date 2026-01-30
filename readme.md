Greetings prospective employer or collaborator!

### Bitcoin live price and LLM summary project

Grabs price and volume from public crypto feeds then AI writes up text summaries of what's been happening.

*Major tooling (for now) are docker-compose and npm native workspaces for monorepo structure.*

```
# workspaces structure (using native npm workspaces)

bitcoin-llm-commentary/
├── apps/
│   ├── price-ingestor/
│   ├── react-ui/
│   └── web-api/
└── packages/
    └── color-logger/

# root package.json for some dev dependencies (example)

"workspaces": [
  "packages/*",
  "apps/*"
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

####  Two Database Containers

* Postgres for storing price data and summaries.

* Redis for pub/sub.

####  Lambda Functions
These will call an LLM API to generate text summaries when triggered by the price ingestion app.

###  Implementation Notes
Starting with a single EC2 instance and Docker Compose. I'll break it out to other AWS services in phase 2.

####  Reasoning of Resource Choices
* S3 + Cloudfront is standard for hosting React apps with SSL.

* Crypto feed ingress-container is a well defined role.

* Web api host-container is a well defined role.

* AWS Lambda is nice for api key storage and infrequent, short lived tasks like an LLM call.

* Postgres is a typical dependency container.

* Redis is also a typical dependency container.

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

### Use of AI for coding
I'll mostly be using AI for brainstorming high level architecture, crash course explanations of unfamiliar tech, and generating boilerplate code snippets.

I'm not going whole hog agentic AI code-assistant here.

