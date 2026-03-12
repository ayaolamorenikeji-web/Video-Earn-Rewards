import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

const MIN_CASHOUT_POINTS = 100;
const POINTS_PER_VIDEO = 10;
const DAILY_BONUS_POINTS = 5;

async function getUserById(userId: string) {
  const id = parseInt(userId, 10);
  if (isNaN(id)) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

function isDailyBonusAvailable(lastDailyBonus: Date | null): boolean {
  if (!lastDailyBonus) return true;
  const now = new Date();
  const last = new Date(lastDailyBonus);
  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate()
  );
}

router.get("/user/me", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!rawId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserById(rawId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    userId: String(user.id),
    email: user.email,
    points: user.points,
    lastDailyBonus: user.lastDailyBonus ? user.lastDailyBonus.toISOString() : null,
    canClaimDailyBonus: isDailyBonusAvailable(user.lastDailyBonus),
  });
});

router.post("/user/earn", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!rawId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserById(rawId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const newPoints = user.points + POINTS_PER_VIDEO;
  const [updated] = await db
    .update(usersTable)
    .set({ points: newPoints })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    userId: String(updated.id),
    email: updated.email,
    points: updated.points,
    lastDailyBonus: updated.lastDailyBonus ? updated.lastDailyBonus.toISOString() : null,
    canClaimDailyBonus: isDailyBonusAvailable(updated.lastDailyBonus),
  });
});

router.post("/user/daily-bonus", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!rawId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserById(rawId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (!isDailyBonusAvailable(user.lastDailyBonus)) {
    res.status(409).json({ error: "Daily bonus already claimed today" });
    return;
  }

  const newPoints = user.points + DAILY_BONUS_POINTS;
  const [updated] = await db
    .update(usersTable)
    .set({ points: newPoints, lastDailyBonus: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    userId: String(updated.id),
    email: updated.email,
    points: updated.points,
    lastDailyBonus: updated.lastDailyBonus ? updated.lastDailyBonus.toISOString() : null,
    canClaimDailyBonus: false,
  });
});

router.post("/user/cashout", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!rawId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserById(rawId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.points < MIN_CASHOUT_POINTS) {
    res.status(400).json({ error: `You need at least ${MIN_CASHOUT_POINTS} points to cash out` });
    return;
  }

  const pointsRedeemed = user.points;
  const [updated] = await db
    .update(usersTable)
    .set({ points: 0 })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    message: `Cash out request submitted! ${pointsRedeemed} points have been redeemed. We will process your payment shortly.`,
    pointsRedeemed,
    remainingPoints: updated.points,
  });
});

export default router;
