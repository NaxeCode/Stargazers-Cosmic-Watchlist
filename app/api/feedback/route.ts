import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";

const feedbackSchema = z.object({
  message: z.string().trim().min(10, "Share a bit more detail (10+ chars)").max(1000),
  area: z
    .string()
    .trim()
    .max(50)
    .transform((v) => v || "general")
    .default("general"),
  sentiment: z
    .enum(["up", "down"])
    .optional()
    .or(
      z
        .string()
        .trim()
        .length(0)
        .transform(() => undefined),
    ),
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
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = feedbackSchema.safeParse(json);
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

    await trackEvent("feedback_submitted", {
      ...payload,
      userId,
      userEmail,
      userAgent: req.headers.get("user-agent") || undefined,
      referer: req.headers.get("referer") || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[feedback] failed", error);
    return NextResponse.json({ error: "Unable to submit feedback right now." }, { status: 500 });
  }
}
