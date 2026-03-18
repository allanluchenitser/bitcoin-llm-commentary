import { useEffect, useRef } from "react";
import {
  Bodies,
  Engine,
  Render,
  Runner,
  World,
  Body,
  type Body as MatterBody,
  type Engine as MatterEngine,
  type Render as MatterRender,
  type Runner as MatterRunner,
} from "matter-js";
import clsx from "clsx";

import {
  BOWL_MAX_ACTIVE_BODIES,
  BOWL_MAX_RADIUS_PX,
  BOWL_MIN_RADIUS_PX,
  BOWL_RADIUS_BASELINE_USD,
  BOWL_TRADE_MIN_NOTIONAL_USD,
  BOWL_TRADE_TTL_MS,
} from "./live-events-config";
import { type NormalizedTrade } from "./types";

type TradeBowlSceneProps = {
  trades: NormalizedTrade[];
  className?: string;
};

type ActiveBody = {
  tradeId: string;
  body: MatterBody;
  expiresAt: number;
};

type SceneSize = {
  width: number;
  height: number;
};

const MAX_SEEN_TRADE_IDS = 6_000;

const colorByExchange: Record<string, string> = {
  coinbase: "#f59e0b",
  kraken: "#0ea5e9",
  bitstamp: "#10b981",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function radiusFromNotional(notionalUsd: number) {
  const normalized = Math.sqrt(Math.max(notionalUsd, BOWL_RADIUS_BASELINE_USD) / BOWL_RADIUS_BASELINE_USD);
  const radius = BOWL_MIN_RADIUS_PX + normalized * 2.5;
  return clamp(radius, BOWL_MIN_RADIUS_PX, BOWL_MAX_RADIUS_PX);
}

function createBowlBodies(width: number, height: number): MatterBody[] {
  const wallThickness = 24;
  const floor = Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness * 2, wallThickness, {
    isStatic: true,
    friction: 0.7,
    restitution: 0.35,
    render: { fillStyle: "#d6d3d1" },
  });

  const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
    isStatic: true,
    restitution: 0.4,
    render: { fillStyle: "#e7e5e4" },
  });

  const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
    isStatic: true,
    restitution: 0.4,
    render: { fillStyle: "#e7e5e4" },
  });

  const bodies = [floor, leftWall, rightWall];

  const centerX = width / 2;
  const radius = Math.min(width * 0.42, height * 0.38);
  const bowlBottomY = height - 16;
  const centerY = bowlBottomY - radius;
  const segments = 24;
  // Use the lower semicircle in screen coordinates (y grows downward)
  // so the bowl opens upward and remains fully visible.
  const angleStart = 0;
  const angleEnd = Math.PI;

  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = angleStart + (angleEnd - angleStart) * t0;
    const a1 = angleStart + (angleEnd - angleStart) * t1;

    const x0 = centerX + Math.cos(a0) * radius;
    const y0 = centerY + Math.sin(a0) * radius;
    const x1 = centerX + Math.cos(a1) * radius;
    const y1 = centerY + Math.sin(a1) * radius;

    const segX = (x0 + x1) / 2;
    const segY = (y0 + y1) / 2;
    const segLength = Math.hypot(x1 - x0, y1 - y0) + 6;
    const segAngle = Math.atan2(y1 - y0, x1 - x0);

    const segment = Bodies.rectangle(segX, segY, segLength, 18, {
      isStatic: true,
      angle: segAngle,
      restitution: 0.42,
      friction: 0.6,
      render: { fillStyle: "#a8a29e" },
    });

    bodies.push(segment);
  }

  return bodies;
}

export default function TradeBowlScene({ trades, className = "" }: TradeBowlSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const renderRef = useRef<MatterRender | null>(null);
  const runnerRef = useRef<MatterRunner | null>(null);

  const sizeRef = useRef<SceneSize>({ width: 0, height: 0 });
  const boundaryBodiesRef = useRef<MatterBody[]>([]);
  const activeBodiesRef = useRef<ActiveBody[]>([]);

  const seenTradeIdsRef = useRef<Set<string>>(new Set());
  const seenTradeOrderRef = useRef<string[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(240, container.clientWidth);
    const height = Math.max(180, container.clientHeight);
    sizeRef.current = { width, height };

    const engine = Engine.create({
      gravity: { x: 0, y: 1.1 },
    });

    const render = Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "#f8fafc",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    const runner = Runner.create();

    const rebuildBoundaries = () => {
      const current = sizeRef.current;

      for (const boundaryBody of boundaryBodiesRef.current) {
        World.remove(engine.world, boundaryBody);
      }
      boundaryBodiesRef.current = createBowlBodies(current.width, current.height);
      World.add(engine.world, boundaryBodiesRef.current);
    };

    const onResize = () => {
      if (!container || !renderRef.current) return;

      const nextWidth = Math.max(240, container.clientWidth);
      const nextHeight = Math.max(180, container.clientHeight);
      sizeRef.current = { width: nextWidth, height: nextHeight };

      Render.setSize(renderRef.current, nextWidth, nextHeight);
      Render.setPixelRatio(renderRef.current, window.devicePixelRatio || 1);
      rebuildBoundaries();
    };

    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = runner;

    rebuildBoundaries();
    Render.run(render);
    Runner.run(runner, engine);

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);

      for (const entry of activeBodiesRef.current) {
        World.remove(engine.world, entry.body);
      }
      for (const boundaryBody of boundaryBodiesRef.current) {
        World.remove(engine.world, boundaryBody);
      }

      activeBodiesRef.current = [];
      boundaryBodiesRef.current = [];
      seenTradeIdsRef.current.clear();
      seenTradeOrderRef.current = [];

      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);

      if (render.canvas.parentNode) {
        render.canvas.parentNode.removeChild(render.canvas);
      }

      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const markTradeSeen = (tradeId: string) => {
      if (seenTradeIdsRef.current.has(tradeId)) return;

      seenTradeIdsRef.current.add(tradeId);
      seenTradeOrderRef.current.push(tradeId);

      if (seenTradeOrderRef.current.length > MAX_SEEN_TRADE_IDS) {
        const dropCount = seenTradeOrderRef.current.length - MAX_SEEN_TRADE_IDS;
        const dropped = seenTradeOrderRef.current.splice(0, dropCount);
        for (const tradeIdToDrop of dropped) {
          seenTradeIdsRef.current.delete(tradeIdToDrop);
        }
      }
    };

    const pruneActiveBodies = () => {
      while (activeBodiesRef.current.length > BOWL_MAX_ACTIVE_BODIES) {
        const oldest = activeBodiesRef.current.shift();
        if (!oldest) break;
        World.remove(engine.world, oldest.body);
      }
    };

    for (const trade of [...trades].reverse()) {
      if (seenTradeIdsRef.current.has(trade.tradeId)) continue;
      markTradeSeen(trade.tradeId);

      if (trade.notionalUsd < BOWL_TRADE_MIN_NOTIONAL_USD) continue;

      const { width } = sizeRef.current;
      const radius = radiusFromNotional(trade.notionalUsd);
      const spawnX = width * (0.12 + Math.random() * 0.76);
      const spawnY = -radius - 8;

      const body = Bodies.circle(spawnX, spawnY, radius, {
        restitution: 0.72,
        friction: 0.01,
        frictionAir: 0.004,
        density: 0.001,
        render: {
          fillStyle: colorByExchange[trade.exchange] ?? "#64748b",
          strokeStyle: "#0f172a",
          lineWidth: 1,
        },
      });

      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 1.4,
        y: Math.random() * 0.4,
      });

      World.add(engine.world, body);
      activeBodiesRef.current.push({
        tradeId: trade.tradeId,
        body,
        expiresAt: Date.now() + BOWL_TRADE_TTL_MS,
      });

      pruneActiveBodies();
    }
  }, [trades]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const timer = window.setInterval(() => {
      const world = engine.world;
      const now = Date.now();
      const { width, height } = sizeRef.current;

      const survivors: ActiveBody[] = [];
      for (const entry of activeBodiesRef.current) {
        const position = entry.body.position;
        const isExpired = entry.expiresAt <= now;
        const tooFarOutside = position.y > height + 250 || position.x < -250 || position.x > width + 250;

        if (isExpired || tooFarOutside) {
          World.remove(world, entry.body);
        } else {
          survivors.push(entry);
        }
      }

      activeBodiesRef.current = survivors;
    }, 450);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className={clsx("relative h-full w-full", className)}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-[0.68rem] font-semibold text-slate-500">
        Trades {">="} ${BOWL_TRADE_MIN_NOTIONAL_USD.toLocaleString()} materialize and settle in the bowl
      </div>
    </div>
  );
}
