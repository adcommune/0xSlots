import type { ReactNode } from "react";

export function PageHeader({
  children,
  maxWidth = "max-w-6xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="border-b bg-muted/50">
      <div className={`${maxWidth} mx-auto px-2 md:px-6 py-2 md:py-4`}>
        <div className="flex items-center justify-between">{children}</div>
      </div>
    </div>
  );
}
