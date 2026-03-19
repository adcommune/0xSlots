"use client";

import type { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

interface NavigationContext {
  push: (href: string) => void;
  isPending: boolean;
}

const Ctx = createContext<NavigationContext>({
  push: () => {},
  isPending: false,
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startTransition],
  );

  return <Ctx value={{ push, isPending }}>{children}</Ctx>;
}

export const useNavigation = () => useContext(Ctx);

/**
 * Drop-in replacement for next/link that triggers the global
 * isPending transition so the logo spins during navigation.
 */
export function NavLink({
  href,
  onClick,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Pick<LinkProps, "href">) {
  const { push } = useNavigation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (cmd+click, ctrl+click) do their default behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.(e);
    push(typeof href === "string" ? href : href.toString());
  };

  return (
    <a href={typeof href === "string" ? href : href.toString()} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
