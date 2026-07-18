import crypto from "node:crypto";
import http from "node:http";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import hpp from "hpp";

import { env } from "./config/env";
import { connectMongo } from "./db/mongoose";
import { connectRedis, disconnectRedis } from "./db/redis";
import { disconnectMongo } from "./db/mongoose";
import { csrfErrorHandler, csrfProtection } from "./middleware/csrf";
import { httpLogger } from "./middleware/logger";
import { globalLimiter } from "./middleware/rateLimiters";
import { apiRouter } from "./routes";
import { initSocket } from "./socket";
// import session from "express-session";
// import { SessionEntity } from "./entity/Session";
// import { TypeormStore } from "connect-typeorm";


const app = express();
app.set("trust proxy", env.trustProxy);


const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // allow same-origin / server-to-server / curl
    if (!origin) return callback(null, true);
    if (env.corsOrigins.includes(origin)) return callback(null, true);
    // Pass `false` (not an Error) so blocked origins get a proper CORS
    // failure instead of a confusing 500 from the error handler.
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(compression());
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));
app.use(cookieParser(env.cookieSecret));

app.use(httpLogger);
app.use(globalLimiter);
app.use(hpp());
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);





app.use(helmet());

// For an API-only server, Helmet's defaults are generally sufficient.
// If you later serve HTML, add a full CSP policy (with default-src) at that time.




app.use(csrfProtection());



app.use("/api", apiRouter);

app.use(csrfErrorHandler);


app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!err) return next();
  const message = env.isProd ? "Internal Server Error" : (err instanceof Error ? err.message : String(err));
  res.status(500).json({ ok: false, message });
});

const server = http.createServer(app);
// Reasonable defaults for high-throughput proxies/load balancers.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;
initSocket(server);

async function start(): Promise<void> {
  await connectRedis();
  await connectMongo();
  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`server running on port ${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Startup error", err);
  process.exitCode = 1;
});

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await disconnectMongo().catch(() => {});
    await disconnectRedis().catch(() => {});
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
