"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Params = Record<string, string | string[] | undefined>;

export function ItemSearch({
  currentTitle,
  currentTag,
  params,
  uniqueTags,
}: {
  currentTitle: string;
  currentTag: string;
  params: Params;
  uniqueTags: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tagInput, setTagInput] = useState(currentTag);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = (form.get("q") as string)?.trim();
    const tag = (form.get("tag") as string)?.trim();

    const next = new URLSearchParams(searchParams.toString());
    // reset page when searching
    next.set("page", "1");

    if (title) next.set("q", title);
    else next.delete("q");

    if (tag) next.set("tag", tag);
    else next.delete("tag");

    router.push(`/?${next.toString()}`, { scroll: false });
    setShowSuggestions(false);
  };

  const filteredTags = useMemo(() => {
    if (!tagInput) return [];
    const inputs = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const last = inputs[inputs.length - 1] ?? "";
    const lower = last.toLowerCase();
    return uniqueTags
      .filter((tag) => tag.toLowerCase().includes(lower) && !inputs.slice(0, -1).includes(tag))
      .slice(0, 8);
  }, [tagInput, uniqueTags]);

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3">
      <div className="flex min-w-[200px] flex-1 items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="q">
          Title
        </label>
        <Input id="q" name="q" defaultValue={currentTitle} placeholder="Search title..." />
      </div>
      <div className="flex min-w-[180px] items-center gap-2">
        <span className="text-xs text-muted-foreground">by tag</span>
        <div className="relative flex-1">
          <Input
            id="tag"
            name="tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. horror"
            autoComplete="off"
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && filteredTags.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border/60 bg-popover shadow-card">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Suggestions</div>
              <div className="max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition hover:bg-secondary/70 hover:text-foreground"
                    onClick={() => {
                      const parts = tagInput
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      parts[parts.length - 1] = tag;
                      const deduped = Array.from(new Set(parts)).join(", ");
                      setTagInput(deduped);
                      setShowSuggestions(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  );
}
