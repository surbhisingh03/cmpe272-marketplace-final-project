import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import marketplaceRoutes from "./routes/marketplace.js";
import reviewRoutes from "./routes/reviews.js";
import userDashboardRoutes from "./routes/userDashboard.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5001);
const CLIENT = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isDev = process.env.NODE_ENV !== "production";

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

app.use("/api/auth", authRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userDashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const code = err?.code;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return res.status(503).json({
      error: "Database is unreachable. Start MySQL and check MYSQL_HOST / MYSQL_PORT in .env.",
    });
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_DBACCESS_DENIED_ERROR") {
    return res.status(503).json({
      error: "MySQL credentials failed. Check MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE in .env.",
    });
  }
  res.status(500).json({ error: "Internal server error" });
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
