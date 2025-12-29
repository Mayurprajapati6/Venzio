import "dotenv/config";
import express from "express";
import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import v2Router from "./routers/v2/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { rawBodyMiddleware } from "./middlewares/raw-body.middleware";
import { db } from "./db";
import cookieParser from "cookie-parser";

import "./crons";

const app = express();


app.use(rawBodyMiddleware);
app.use(express.json());
app.use(cookieParser());


app.use(attachCorrelationIdMiddleware);
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);


app.use(appErrorHandler);
app.use(genericErrorHandler);

app.listen(serverConfig.PORT, async () => {
  logger.info(
    `Server is running on http://localhost:${serverConfig.PORT}`
  );
  logger.info(`Press Ctrl+C to stop the server.`);

  try {
    await db.execute("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed");
    process.exit(1);
  }

  console.log(
    `Server running on http://localhost:${serverConfig.PORT}`
  );
});
