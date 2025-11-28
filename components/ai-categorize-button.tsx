"use client";

import { useState, useTransition } from "react";
import { Sparkles, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aiCategorizeAction } from "@/app/actions";

type Props = {
  disabled?: boolean;
  selectedIds: number[];
};

export function AiCategorizeButtons({ disabled, selectedIds }: Props) {
  const [pendingAll, startAll] = useTransition();
  const [pendingSelected, startSelected] = useTransition();
  const [ranAll, setRanAll] = useState(false);
  const [ranSel, setRanSel] = useState(false);

  const run = (ids?: number[]) => {
    const isSelected = Array.isArray(ids) && ids.length > 0;
    const start = isSelected ? startSelected : startAll;
    start(async () => {
      const res = await aiCategorizeAction(undefined, ids && ids.length ? ids : undefined);
      if (res?.success) {
        isSelected ? setRanSel(true) : setRanAll(true);
        toast.success(res.success);
      } else if (res?.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={ranAll ? "secondary" : "default"}
        size="sm"
        className="gap-2"
        onClick={() => run()}
        disabled={pendingAll || disabled}
      >
        <Sparkles className="h-4 w-4" />
        {pendingAll ? "Tagging..." : "AI all"}
      </Button>
      <Button
        type="button"
        variant={ranSel ? "secondary" : "outline"}
        size="sm"
        className="gap-2"
        onClick={() => run(selectedIds)}
        disabled={pendingSelected || disabled || selectedIds.length === 0}
      >
        <SparklesIcon className="h-4 w-4" />
        {pendingSelected ? "Tagging..." : "AI selected"}
      </Button>
    </div>
  );
}
