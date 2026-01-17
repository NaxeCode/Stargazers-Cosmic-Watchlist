"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toggleSectionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type CollapsibleSectionProps = {
  sectionId: string;
  title: string;
  description?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  sectionId,
  title,
  description,
  defaultCollapsed = false,
  children,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);

    // Save to database in background
    startTransition(async () => {
      await toggleSectionAction(sectionId);
    });
  };

  return (
    <div className="space-y-3">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="shrink-0 gap-2 transition-colors duration-200"
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Expand</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* Collapsible content with animation */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
