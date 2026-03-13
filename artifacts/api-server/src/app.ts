import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built React frontend from watch-earn/dist/public
if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(__dirname, "../../watch-earn/dist/public");
  app.use(express.static(staticDir));
  // Catch-all: serve index.html for any non-API route (SPA routing)
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
