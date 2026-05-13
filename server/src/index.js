import "./env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import marketplaceRoutes from "./routes/marketplace.js";
import reviewRoutes from "./routes/reviews.js";
import userDashboardRoutes from "./routes/userDashboard.js";
import adminRoutes from "./routes/admin.js";
import { getPool } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const CLIENT = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isDev = process.env.NODE_ENV !== "production";

/** Verbose JSON errors: dev, explicit flag, or API hit on localhost (when NODE_ENV is production by mistake). */
function shouldExposeApiErrors(req) {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.FUSIONHUB_EXPOSE_ERRORS === "1") return true;
  const host = String(req.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  const ip = String(req.ip || req.socket?.remoteAddress || "")
    .replace(/^::ffff:/i, "")
    .toLowerCase();
  return ip === "127.0.0.1" || ip === "::1";
}

/* Dev: reflect any localhost / 127.0.0.1 origin (e.g. :5173 vs :5174) so signup/login work */
app.use(
  cors({
    origin: isDev ? true : CLIENT,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/health/db", async (req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: String(err?.message || err) });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userDashboardRoutes);
app.use("/api/admin", adminRoutes);

getPool();

app.use((err, req, res, next) => {
  console.error(err);
  const code = err?.code;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return res.status(503).json({
      error: "Database is unreachable. Check DATABASE_URL in server/.env (Supabase Postgres connection string).",
    });
  }
  if (code === "28P01" || code === "ER_ACCESS_DENIED_ERROR" || code === "ER_DBACCESS_DENIED_ERROR") {
    return res.status(503).json({
      error: "Database credentials failed. Check the password in DATABASE_URL (server/.env).",
    });
  }
  const expose = shouldExposeApiErrors(req);
  const msg = String(err?.message || err || "");
  if (expose && msg) {
    return res.status(500).json({ error: msg || "Internal server error" });
  }
  res.status(500).json({
    error: "Internal server error",
    hint:
      "Check the API terminal for the stack trace. For local dev set NODE_ENV=development in server/.env (or FUSIONHUB_EXPOSE_ERRORS=1), restart the API, and verify DATABASE_URL.",
  });
});

const server = app.listen(PORT, () => {
  console.log(`FusionHub API http://localhost:${PORT}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use (another process is listening).\n` +
        `  • You may already have the API running—try the app in the browser.\n` +
        `  • Or free the port:  lsof -i :${PORT} -sTCP:LISTEN   then   kill <PID>\n`
    );
    process.exit(1);
  }
  throw err;
});
