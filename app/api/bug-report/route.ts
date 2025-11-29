import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";

const bugReportSchema = z.object({
  summary: z.string().trim().min(5, "Add a short summary").max(120),
  steps: z.string().trim().min(5, "Add steps to reproduce").max(2000),
  expected: z.string().trim().min(3, "Add expected result").max(600),
  actual: z.string().trim().min(3, "Add actual result").max(600),
  severity: z.enum(["blocker", "major", "minor"]).default("minor"),
  frequency: z.enum(["always", "sometimes", "rarely"]).default("sometimes"),
  email: z
    .string()
    .email()
    .max(200)
    .optional()
    .or(
      z
        .string()
        .trim()
        .length(0)
        .transform(() => undefined),
    ),
  url: z
    .string()
    .url()
    .optional()
    .or(
      z
        .string()
        .trim()
        .length(0)
        .transform(() => undefined),
    ),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = bugReportSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors[0] ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const session = await auth();
    const payload = parsed.data;
    const userId = session?.user?.id ?? null;
    const userEmail = session?.user?.email ?? payload.email ?? null;

    await trackEvent("bug_reported", {
      ...payload,
      userId,
      userEmail,
      userAgent: req.headers.get("user-agent") || undefined,
      referer: req.headers.get("referer") || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[bug-report] failed", error);
    return NextResponse.json({ error: "Unable to submit a bug right now." }, { status: 500 });
  }
}
