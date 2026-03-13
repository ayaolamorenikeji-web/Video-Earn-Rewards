import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built React frontend.
// process.cwd() is the repo root on Render (and locally), so this path is stable
// whether running via tsx (dev) or the bundled CJS file (production).
if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(process.cwd(), "artifacts/watch-earn/dist/public");
  app.use(express.static(staticDir));
  // Catch-all: serve index.html for any non-API route (SPA routing)
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
