"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PlusCircle, Sparkles, Image as ImageIcon, Star, X, Loader2, Search } from "lucide-react";
import { createItemAction } from "@/app/actions";
import { ITEM_TYPES, STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

type ActionState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type Suggestion = { title: string; type: string; year?: number; posterUrl?: string };

export function ItemFormRedesigned() {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [titleValue, setTitleValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, startSuggestionsTransition] = useTransition();
  const [typeValue, setTypeValue] = useState<string>("anime");
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [lockedTitle, setLockedTitle] = useState<string | null>(null);
  const [autofillPreview, setAutofillPreview] = useState<{
    releaseYear?: number;
    runtimeMinutes?: number;
    synopsis?: string;
    cast?: string[];
    posterUrl?: string | null;
    genres?: string[];
  } | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createItemAction,
    {},
  );

  // Auto-search for suggestions
  useEffect(() => {
    if (lockedTitle) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    const controller = new AbortController();
    startSuggestionsTransition(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${encodeURIComponent(typeValue)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((json) => {
          if (json?.ok && Array.isArray(json.results)) {
            setSuggestions(json.results);
            setSuggestionsOpen(true);
          } else {
            setSuggestions([]);
            setSuggestionsOpen(false);
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setSuggestions([]);
          setSuggestionsOpen(false);
        });
    });
    return () => controller.abort();
  }, [titleValue, typeValue, lockedTitle]);

  // Handle form submission success
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      setAutofillPreview(null);
      setTitleValue("");
      setSuggestions([]);
      setSuggestionsOpen(false);
      setLockedTitle(null);
      setRatingValue(0);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  const onAutofill = async () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const title = (formData.get("title") as string | null)?.trim();
    const type = (formData.get("type") as string | null)?.trim() || "movie";
    if (!title) {
      toast.error("Enter a title first.");
      return;
    }
    setIsAutofilling(true);
    try {
      const res = await fetch(
        `/api/metadata?title=${encodeURIComponent(title)}&type=${encodeURIComponent(type)}`,
      );
      const json = await res.json();
      if (!json?.ok || !json.metadata) {
        toast.error(json?.error || "No metadata found.");
        return;
      }
      const meta = json.metadata as any;

      // Merge genres into tags
      if (meta.genres?.length && tagsRef.current) {
        const existing = tagsRef.current.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...meta.genres])).join(", ");
        tagsRef.current.value = merged;
      }

      // Fill synopsis into notes if empty
      if (meta.synopsis && notesRef.current && !notesRef.current.value.trim()) {
        notesRef.current.value = String(meta.synopsis).slice(0, 1800);
      }

      setAutofillPreview({
        releaseYear: meta.releaseYear ?? undefined,
        runtimeMinutes: meta.runtimeMinutes ?? undefined,
        synopsis: meta.synopsis ?? undefined,
        cast: meta.cast ?? [],
        posterUrl: meta.posterUrl ?? null,
        genres: meta.genres ?? [],
      });
      toast.success("Auto-filled from TMDB");
    } catch (error) {
      toast.error("Failed to auto-fill metadata.");
    } finally {
      setIsAutofilling(false);
    }
  };

  return (
    <div className={`grid w-full gap-4 ${autofillPreview ? 'lg:grid-cols-[1fr,400px]' : ''}`}>
      {/* Form Section */}
      <form ref={formRef} action={formAction} className="w-full space-y-4">
        {/* Title Search */}
        <div className="w-full space-y-2">
          <div className="flex w-full items-center justify-between">
            <label className="text-sm font-medium">Search & Add</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAutofill}
                disabled={isAutofilling || isPending || !titleValue}
              >
                {isAutofilling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="ml-2">Auto-fill</span>
              </Button>
            </div>
          </div>

          <div className="relative w-full">
            {/* Title Input */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              {lockedTitle ? (
                <div className="flex h-14 w-full items-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-4 pl-12">
                  <input type="hidden" name="title" value={lockedTitle} />
                  <span className="flex-1 font-medium">{lockedTitle}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLockedTitle(null);
                      setTitleValue("");
                      setAutofillPreview(null);
                      setSuggestionsOpen(false);
                      setSuggestions([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  ref={titleRef}
                  id="title"
                  name="title"
                  value={titleValue}
                  onChange={(e) => {
                    setTitleValue(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  placeholder="Search for anime, movies, TV shows, or games..."
                  className="h-14 w-full pl-12 text-base"
                  autoComplete="off"
                  required
                />
              )}
            </div>

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {suggestionsOpen && suggestions.length > 0 && !lockedTitle && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg"
                >
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {suggestionsLoading ? "Searching..." : `${suggestions.length} Results`}
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((s, idx) => (
                        <motion.button
                          key={`${s.title}-${s.year ?? ""}-${s.type}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          type="button"
                          onClick={() => {
                            setTitleValue(s.title);
                            setTypeValue(s.type);
                            setLockedTitle(s.title);
                            setSuggestionsOpen(false);
                            setSuggestions([]);
                          }}
                          className="group flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                        >
                          {/* Poster */}
                          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {s.posterUrl ? (
                              <img
                                src={s.posterUrl}
                                alt={s.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 overflow-hidden">
                            <div className="font-semibold group-hover:text-primary">
                              {s.title}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{s.type}</span>
                              {s.year && (
                                <>
                                  <span>•</span>
                                  <span>{s.year}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {fieldError("title") && (
            <p className="text-sm text-destructive">{fieldError("title")}</p>
          )}
        </div>

        {/* Type and Status */}
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="w-full space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <Select name="type" value={typeValue} onValueChange={setTypeValue}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select name="status" defaultValue="planned">
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rating */}
        <div className="w-full space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <input type="hidden" name="rating" value={ratingValue || ""} />
          <div className="flex w-full items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingValue(star === ratingValue ? 0 : star)}
                className="group p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= ratingValue
                      ? "fill-primary text-primary"
                      : "text-muted-foreground group-hover:text-primary/50"
                  }`}
                />
              </button>
            ))}
            {ratingValue > 0 && (
              <span className="ml-2 text-sm font-medium">{ratingValue}/10</span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="w-full space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags
          </label>
          <Input
            id="tags"
            name="tags"
            ref={tagsRef}
            placeholder="action, thriller, rewatch"
            className="w-full font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Comma-separated tags</p>
        </div>

        {/* Notes */}
        <div className="w-full space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <Textarea
            id="notes"
            name="notes"
            ref={notesRef}
            placeholder="Your thoughts, standout moments, why you want to watch this..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PlusCircle className="h-5 w-5" />
          )}
          <span className="ml-2">{isPending ? "Adding..." : "Add to Watchlist"}</span>
        </Button>
      </form>

      {/* Preview Section */}
      <AnimatePresence mode="wait">
        {autofillPreview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:block"
          >
            <div className="sticky top-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Preview</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/40 shadow-card">
                {/* Poster */}
                {autofillPreview.posterUrl && (
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={autofillPreview.posterUrl}
                      alt="Poster"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-3 p-4">
                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-2">
                    {autofillPreview.releaseYear && (
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {autofillPreview.releaseYear}
                      </div>
                    )}
                    {autofillPreview.runtimeMinutes && (
                      <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                        {autofillPreview.runtimeMinutes}m
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {autofillPreview.genres && autofillPreview.genres.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Genres
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {autofillPreview.genres.slice(0, 5).map((genre) => (
                          <div
                            key={genre}
                            className="rounded-md border bg-muted/50 px-2 py-1 text-xs"
                          >
                            {genre}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cast */}
                  {autofillPreview.cast && autofillPreview.cast.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Cast
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {autofillPreview.cast.slice(0, 4).join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Synopsis */}
                  {autofillPreview.synopsis && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Synopsis
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {autofillPreview.synopsis.slice(0, 300)}
                        {autofillPreview.synopsis.length > 300 ? "..." : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
