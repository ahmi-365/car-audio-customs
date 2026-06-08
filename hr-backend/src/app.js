import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import invoiceRoutes from "./routes/invoices.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/corsorigen", (_req, res) => {
  res.json({ origins: "*" });
});
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

export default app;
