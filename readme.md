Greetings prospective employer or collaborator!

Introducing:

**Bitcoin live price and LLM summary project**

Fetches real-time trading info from public crypto feeds then AI writes up summaries of what's been happening.

Summaries are either periodical or triggered real-time by interesting trading activity.

Results are displayed on a web dashboard that updates in real-time.



**Tech stack**

"ERN" for now. Database TBD (if any).

**Infrastructure**

S3 for the front end. EC2 + docker on the backend. Caddy or Nginx as reverse proxy.

If I catch some traffic I'll consider further AWS resources. Lambda, ECS.. whatever is appropriate. High class problem.

Purposely not using Vercel, Supabase so that the project evolves along side my AWS skills.

**General idea**

* Websockets ingress price data.

* SSE fan out to web clients.

* LLM calls to OpenAI API.

* Pub/sub via Redis or maybe just inside nodejs

* React front end, probably with Next.js (yea it's overkill)

Cool? Ok cool.