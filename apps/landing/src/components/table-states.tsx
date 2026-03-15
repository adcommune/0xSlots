export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border p-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-6 bg-muted animate-pulse mb-2 rounded" />
      ))}
    </div>
  );
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
