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
Pretty standard.

####  Three App Containers

* Price ingestor. Ingests price data via websockets from crypto exchanges. Send to Redis & Postgres.

* Web server API using REST and SSE

* Worker container that monitors price movements via Redis pub/sub and triggers AWS Lambda to call LLM for text summaries.

####  Two Database Containers

* Postgres for storing price data and summaries.

* Redis for pub/sub between the two app containers.

####  Lambda Functions
These will call LLM APIs to generate text summaries when triggered by the price ingestion app. Probably OpenAI GPT-4 or similar.

###  Implementation Notes
I'm starting this project by hosting containers on a single EC2 instance using Docker Compose. I intend to migrate capabilities onto specialized AWS services later, piece by piece.

####  Reasoning of Resource Choices
* S3 + Cloudfront is standard for hosting React apps with SSL.

* Crypto feed ingress container is a well defined role.

* Web api host container is a well defined role.

* AWS Lambda is nice for api key storage and infrequent, short lived tasks like an LLM call.

* Since we're doing containers: Postgres is a typical dependency container.

* Redis is also a typical dependency container.

#### Current Flow Diagram

```
[Kraken api] -> [🐳 Price Ingestor]
                        |
                        v
               __[🐳 Redis Pub/Sub]___
              |         |            |
              |         |            v
              |         |   [🐳 Signal worker] -> [AWS Lambda LLM]
              |         |
              |         v
              |   [🐳 Web API, SSE] -> [React UI]
              |
              v
        [🐳 Postgres]
```


### Use of AI for coding
I'll mostly be using AI for brainstorming high level architecture, crash course explanations of unfamiliar tech, and generating boilerplate code snippets.

I'm not going whole hog agentic AI code-assistant here.

