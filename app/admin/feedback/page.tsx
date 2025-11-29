import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { events, users } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function AdminFeedbackPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return notFound();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { admin: true },
  });
  if (!user?.admin) return notFound();

  const rows = await db.query.events.findMany({
    orderBy: [desc(events.createdAt)],
    limit: 200,
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <Badge variant="glow" className="text-xs uppercase tracking-[0.2em]">
          Admin
        </Badge>
        <h1 className="text-2xl font-semibold">Feedback & bug reports</h1>
      </div>
      {rows.length === 0 ? (
        <Card className="rounded-2xl border border-border/70 bg-secondary/40 p-6 text-sm text-muted-foreground">
          No submissions yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Card
              key={row.id}
              className="rounded-2xl border border-border/70 bg-secondary/40 p-4 shadow-card"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{row.name}</span>
                <span>{row.createdAt?.toISOString()}</span>
              </div>
              {row.userId && (
                <p className="text-xs text-muted-foreground/80">user: {row.userId}</p>
              )}
              {row.userAgent && (
                <p className="text-xs text-muted-foreground/80">agent: {row.userAgent}</p>
              )}
              <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-foreground/90">
                {JSON.stringify(row.payload, null, 2)}
              </pre>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
