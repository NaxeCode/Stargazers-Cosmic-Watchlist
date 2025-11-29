import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";

const DEFAULT_USER_TOTAL_LIMIT = 2000;
const DEFAULT_USER_DAILY_LIMIT = 250;
const DEFAULT_GLOBAL_TOTAL_LIMIT = 200_000;
const DEFAULT_GLOBAL_DAILY_LIMIT = 5_000;

const numEnv = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const LIMITS = {
  userTotal: numEnv("ITEM_USER_TOTAL_LIMIT", DEFAULT_USER_TOTAL_LIMIT),
  userDaily: numEnv("ITEM_USER_DAILY_LIMIT", DEFAULT_USER_DAILY_LIMIT),
  globalTotal: numEnv("ITEM_GLOBAL_TOTAL_LIMIT", DEFAULT_GLOBAL_TOTAL_LIMIT),
  globalDaily: numEnv("ITEM_GLOBAL_DAILY_LIMIT", DEFAULT_GLOBAL_DAILY_LIMIT),
};

export async function assertItemWriteCapacity(userId: string, incoming: number) {
  if (incoming <= 0) return { ok: true as const };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [userTotalRow, userDailyRow, globalTotalRow, globalDailyRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.userId, userId))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.userId, userId), gt(items.createdAt, since)))
      .limit(1),
    db.select({ count: sql<number>`count(*)` }).from(items).limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(gt(items.createdAt, since))
      .limit(1),
  ]);

  const userTotal = userTotalRow[0]?.count ?? 0;
  const userDaily = userDailyRow[0]?.count ?? 0;
  const globalTotal = globalTotalRow[0]?.count ?? 0;
  const globalDaily = globalDailyRow[0]?.count ?? 0;

  if (userTotal + incoming > LIMITS.userTotal) {
    return {
      ok: false as const,
      error: `You have reached the current item limit (${LIMITS.userTotal} items). Remove a few items before adding more.`,
    };
  }

  if (userDaily + incoming > LIMITS.userDaily) {
    return {
      ok: false as const,
      error: `Daily add limit reached (${LIMITS.userDaily} items per 24h). Try again later.`,
    };
  }

  if (globalTotal + incoming > LIMITS.globalTotal) {
    return {
      ok: false as const,
      error: `The service is at capacity right now. Please try again after some items are cleared.`,
    };
  }

  if (globalDaily + incoming > LIMITS.globalDaily) {
    return {
      ok: false as const,
      error: `We’ve hit the daily write capacity. Please try again in a bit.`,
    };
  }

  return { ok: true as const };
}
