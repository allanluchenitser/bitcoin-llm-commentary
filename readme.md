Greetings prospective employer or collaborator!

### Bitcoin live price and LLM summary project

Fetches real-time trading info from public crypto feeds then AI writes up text summaries of what's been happening. Summaries are either periodical or triggered real-time by interesting trading activity. Results are displayed on a web dashboard that updates in real-time

```
# workspaces structure

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

####  Application stack
PERN: Postgres, Express, React, Nodejs

####  Front End
S3 + Cloudfront for React UI and SSL.
Pretty standard.

####  Two App Containers

* One which ingests price data via websockets from crypto exchanges.

* Another for general backend API plus Server-Sent Events (SSE) to push updates to the React front end.

####  Two Database Containers

* Postgres for storing price data and summaries.

* Redis for pub/sub between the two app containers.

####  Lambda Functions
These will call LLM APIs to generate text summaries when triggered by the price ingestion app. Probably OpenAI GPT-4 or similar.

###  Implementation Notes
For now, I'm going to start this project by hosting containers on a single EC2 instance using Docker Compose. I intend to migrate capabilities onto specialized AWS services later, piece by piece.

####  Reasoning of Architecture Choices
* S3 + Cloudfront is standard for hosting React apps with SSL. Easy, cheap, handles certificates automatically.

* Crypto feed ingress container is a well defined role. It should scale independently if needed.

* Web api host container is also a well defined role. Likewise above, should scale independently if needed.

* AWS Lambda is nice for api key storage and infrequent, short lived tasks like an LLM call. I think it's nice to separate entirely here.

* Postgres container was a maybe. I suppose I could install it directly on the EC2 instance, but we'll go for portability here.

* Redis container was also a maybe. Could have opted to install directly on the EC2 instance, but again portability / rollback advantage.

#### Use of AI for coding
I'll mostly be using AI for brainstorming high level architecture, crash course explanations of unfamiliar tech, and generating boilerplate code snippets.

I'm not going whole hog agentic AI code-assistant here.

