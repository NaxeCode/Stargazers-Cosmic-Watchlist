import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { ITEM_TYPES, STATUSES } from "@/lib/constants";
import { buildRecommendationsFromItems } from "@/lib/recommendations";
import { DashboardShell } from "@/components/dashboard-shell";

type SearchParam =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

async function getParams(searchParams: SearchParam) {
  return (await Promise.resolve(searchParams)) ?? {};
}

export default async function Dashboard({ searchParams }: { searchParams: SearchParam }) {
  const session = await auth();
  const userId = session?.user?.id;
  const userImage = session?.user?.image ?? null;
  const isAdmin = !!session?.user?.admin;
  const aiAvailable = Boolean(process.env.OPENAI_API_KEY);
  const params = await getParams(searchParams);
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const qParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const tagParam = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const tagValue = (tagParam ?? "").trim();
  const queryValue = (qParam ?? "").trim();
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const pageSizeParam = Array.isArray(params.pageSize) ? params.pageSize[0] : params.pageSize;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(pageSizeParam) || 10));

  if (!userId) {
    redirect("/");
  }

  const conditions = [];

  const allUserItems = await db.query.items.findMany({
    where: eq(items.userId, userId),
    orderBy: [desc(items.createdAt)],
  });

  const typeFilter = typeParam && ITEM_TYPES.includes(typeParam as any) ? (typeParam as (typeof ITEM_TYPES)[number]) : undefined;
  const statusFilter =
    statusParam && STATUSES.includes(statusParam as any)
      ? (statusParam as (typeof STATUSES)[number])
      : undefined;

  if (typeFilter) {
    conditions.push(eq(items.type, typeFilter));
  }
  if (statusFilter) {
    conditions.push(eq(items.status, statusFilter));
  }
  if (queryValue) {
    conditions.push(
      or(
        ilike(items.title, `%${queryValue}%`),
        ilike(sql`coalesce("items"."tags", '')`, `%${queryValue}%`),
      ),
    );
  }
  if (tagValue) {
    conditions.push(ilike(sql`coalesce("items"."tags", '')`, `%${tagValue}%`));
  }

  const whereClause = conditions.length
    ? and(eq(items.userId, userId), ...conditions)
    : eq(items.userId, userId);

  const [{ count }] =
    (await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(whereClause)) ?? [{ count: 0 }];

  const total = Number(count) || 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page) {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "page") return;
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else if (value) next.set(key, value);
    });
    if (safePage > 1) next.set("page", String(safePage));
    redirect(`/dashboard${next.toString() ? `?${next.toString()}` : ""}`);
  }

  const results = await db.query.items.findMany({
    where: whereClause,
    orderBy: [desc(items.createdAt)],
    limit: pageSize,
    offset: (safePage - 1) * pageSize,
  });

  const allItemsForCommand = (await db.query.items.findMany({
    where: whereClause,
    orderBy: [desc(items.createdAt)],
  })) as any[];

  const uniqueTags = Array.from(
    new Set(
      allUserItems
        .flatMap((row) => (row.tags ?? "").split(","))
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const uniqueTitles = Array.from(new Set(allUserItems.map((i) => i.title))).sort((a, b) =>
    a.localeCompare(b),
  );

  const avgRatingRow =
    (await db
      .select({ avg: sql<number>`avg("items"."rating")` })
      .from(items)
      .where(whereClause)) ?? [{ avg: null }];
  const avgRating = Number(avgRatingRow[0]?.avg ?? 0);

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { publicHandle: true, publicEnabled: true, preferences: true },
  });

  const collapsedSections = (userRow?.preferences as { collapsedSections?: string[] })?.collapsedSections || [];

  const recommendations = await buildRecommendationsFromItems(allUserItems);

  // Calculate stats for header
  const completed = allUserItems.filter((item) => item.status === "completed");
  const minutesWatched = completed.reduce((sum, item) => sum + (item.runtimeMinutes ?? 0), 0);
  const hoursWatched = Math.round(minutesWatched / 60);
  const completionRate = Math.round((completed.length / Math.max(allUserItems.length, 1)) * 100);

  const headerStats = [
    {
      label: "Total Items",
      value: allUserItems.length,
      trend: `${completionRate}%`,
    },
    {
      label: "Completed",
      value: completed.length,
    },
    {
      label: "Hours Logged",
      value: `${hoursWatched}h`,
    },
    {
      label: "Avg Rating",
      value: avgRating > 0 ? avgRating.toFixed(1) : "—",
    },
  ];

  return (
    <DashboardShell
      userImage={userImage}
      userName={session?.user?.name}
      stats={headerStats}
      isAdmin={isAdmin}
      isSignedIn={Boolean(userId)}
      aiAvailable={aiAvailable}
      results={results}
      allItems={allUserItems}
      allItemsForCommand={allItemsForCommand}
      page={page}
      totalPages={totalPages}
      total={total}
      params={params}
      pageSize={pageSize}
      typeParam={typeParam}
      statusParam={statusParam}
      qParam={queryValue}
      tagValue={tagValue}
      uniqueTags={uniqueTags}
      uniqueTitles={uniqueTitles}
      collapsedSections={collapsedSections}
      recommendations={recommendations}
      shareHandle={userRow?.publicHandle ?? null}
      shareEnabled={userRow?.publicEnabled ?? false}
      basePath="/dashboard"
    />
  );
}
