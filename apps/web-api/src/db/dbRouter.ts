import {
  Router,
  type Request,
  type Response
} from "express";
import { pgClient } from "./initDb.js";

export function createDbRouter(path: string) {
  const router = Router();

  router.get(path, async (req: Request, res: Response) => {
    console.log(`GET ${path} hit`);
    const limit = Number(req.query.limit) || 5000; // default to 5000 rows if not specified
    try {
      const history = await pgClient.getInstrumentHistory('kraken', 'BTC/USD', limit);
      console.log('history rows returned', history.length);
      let json = res.json(history);
      return json;

    } catch (err) {
      console.log('Error fetching history:', err);
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
}
