import { FiltersBar } from "@/components/filters-bar";
import { ItemSearch } from "@/components/item-search";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/collapsible-section";
import dynamic from "next/dynamic";

// Dynamic imports for heavy, below-the-fold components
const ItemFormRedesigned = dynamic(() => import("@/components/item-form-redesigned").then(mod => ({ default: mod.ItemFormRedesigned })), {
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
});
const SmartStats = dynamic(() => import("@/components/smart-stats").then(mod => ({ default: mod.SmartStats })), {
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" />,
});
const Recommendations = dynamic(() => import("@/components/recommendations").then(mod => ({ default: mod.Recommendations })), {
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" />,
});
const ItemsView = dynamic(() => import("@/components/items-view").then(mod => ({ default: mod.ItemsView })), {
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
});
const ImportLetterboxd = dynamic(() => import("@/components/import-letterboxd").then(mod => ({ default: mod.ImportLetterboxd })), {
  loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted" />,
});
const SharePanel = dynamic(() => import("@/components/share-panel").then(mod => ({ default: mod.SharePanel })), {
  loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted" />,
});
const FeedbackPanel = dynamic(() => import("@/components/feedback-panel").then(mod => ({ default: mod.FeedbackPanel })), {
  loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted" />,
});

type StatItem = {
  label: string;
  value: string | number;
  trend?: string;
};

type Params = Record<string, string | string[] | undefined>;

type DashboardShellProps = {
  userImage?: string | null;
  userName?: string | null;
  stats: StatItem[];
  isAdmin?: boolean;
  isSignedIn?: boolean;
  aiAvailable: boolean;
  results: any[];
  allItems: any[];
  allItemsForCommand: any[];
  page: number;
  totalPages: number;
  total: number;
  params: Params;
  pageSize: number;
  typeParam?: string;
  statusParam?: string;
  qParam?: string;
  tagValue: string;
  uniqueTags: string[];
  uniqueTitles: string[];
  collapsedSections: string[];
  recommendations: any[];
  shareHandle?: string | null;
  shareEnabled?: boolean;
  isDemo?: boolean;
  basePath?: string;
};

export function DashboardShell({
  userImage,
  userName,
  stats,
  isAdmin,
  isSignedIn = false,
  aiAvailable,
  results,
  allItems,
  allItemsForCommand,
  page,
  totalPages,
  total,
  params,
  pageSize,
  typeParam,
  statusParam,
  qParam,
  tagValue,
  uniqueTags,
  uniqueTitles,
  collapsedSections,
  recommendations,
  shareHandle,
  shareEnabled,
  isDemo = false,
  basePath = "/",
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        userImage={userImage}
        userName={userName}
        stats={stats}
        isAdmin={isAdmin}
        isSignedIn={isSignedIn}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Analytics Dashboard */}
        {allItems.length > 0 && (
          <CollapsibleSection
            sectionId="analytics"
            title="Analytics"
            description="Detailed insights into your watchlist activity"
            defaultCollapsed={collapsedSections.includes("analytics")}
          >
            <SmartStats items={allItems} />
          </CollapsibleSection>
        )}

        {/* Add Item */}
        {!isDemo && (
          <CollapsibleSection
            sectionId="add-item"
            title="Add to Watchlist"
            description="Search and add items to your collection"
            defaultCollapsed={collapsedSections.includes("add-item")}
          >
            <Card>
              <CardContent className="pt-6">
                <ItemFormRedesigned />
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <CollapsibleSection
            sectionId="recommendations"
            title="Recommendations"
            description="Based on your watchlist"
            defaultCollapsed={collapsedSections.includes("recommendations")}
          >
            <Card>
              <CardContent className="pt-6">
                <Recommendations recommendations={recommendations} />
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        {/* Collection */}
        <CollapsibleSection
          sectionId="collection"
          title="Your Collection"
          description={`${results.length} item${results.length === 1 ? "" : "s"} • Sorted by latest`}
          defaultCollapsed={collapsedSections.includes("collection")}
        >
          <Card>
            <CardContent className="space-y-4 pt-6">
              <FiltersBar type={typeParam} status={statusParam} q={qParam} basePath={basePath} />
              <ItemSearch
                currentTitle={qParam ?? ""}
                currentTag={tagValue}
                currentType={typeParam}
                params={params}
                uniqueTags={uniqueTags}
                titles={uniqueTitles}
                basePath={basePath}
              />
              {results.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                  {isDemo
                    ? "No demo items match your filters."
                    : "Nothing here yet. Add your first item to begin tracking."}
                </div>
              ) : (
                <ItemsView
                  items={results}
                  allItems={allItemsForCommand}
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  params={params}
                  pageSize={pageSize}
                  aiAvailable={aiAvailable}
                  readOnly={isDemo}
                  basePath={basePath}
                />
              )}
            </CardContent>
          </Card>
        </CollapsibleSection>

        {/* Settings & Utilities */}
        {!isDemo && (
          <CollapsibleSection
            sectionId="settings"
            title="Settings & Utilities"
            description="Import, share, and manage your profile"
            defaultCollapsed={collapsedSections.includes("settings")}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <ImportLetterboxd />
                  <SharePanel
                    initialHandle={shareHandle ?? null}
                    initialEnabled={shareEnabled ?? false}
                  />
                  <FeedbackPanel />
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}
      </main>
    </div>
  );
}
