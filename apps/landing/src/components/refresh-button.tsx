export function RefreshButton({
  onRefresh,
  isFetching,
}: {
  onRefresh: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex justify-end mb-3">
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
      >
        {isFetching ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
