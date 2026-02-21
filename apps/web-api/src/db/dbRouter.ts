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
    // const { exchange, symbol } = req.params;
    try {
      const history = await pgClient.getInstrumentHistory('kraken', 'BTC/USD');
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
}
