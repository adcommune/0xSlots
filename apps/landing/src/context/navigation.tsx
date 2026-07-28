"use client";

import type { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import {
  type AnchorHTMLAttributes,
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useTransition,
} from "react";
import { CHAIN_PARAM, useChain } from "@/context/chain";

interface NavigationContext {
  push: (href: string) => void;
  /** Adds the active chain to an internal href. */
  withChain: (href: string) => string;
  isPending: boolean;
}

const Ctx = createContext<NavigationContext>({
  push: () => {},
  withChain: (href) => href,
  isPending: false,
});

/**
 * Carry the active chain across in-app navigation. Without this, following any
 * link drops back to the default chain on the next reload.
 */
function appendChain(href: string, chainId: number): string {
  // Leave external and non-path hrefs (mailto:, #anchor, ...) alone.
  if (!href.startsWith("/")) return href;

  const [path, hash] = href.split("#");
  const [pathname, search] = path.split("?");
  const params = new URLSearchParams(search);
  if (!params.has(CHAIN_PARAM)) params.set(CHAIN_PARAM, String(chainId));

  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { chainId } = useChain();
  const [isPending, startTransition] = useTransition();

  const withChain = useCallback(
    (href: string) => appendChain(href, chainId),
    [chainId],
  );

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(withChain(href));
      });
    },
    [router, startTransition, withChain],
  );

  return <Ctx value={{ push, withChain, isPending }}>{children}</Ctx>;
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
  const { push, withChain } = useNavigation();
  const target = typeof href === "string" ? href : href.toString();
  // Resolve the href eagerly so modified clicks (cmd+click → new tab) open on
  // the active chain rather than the default one.
  const resolved = withChain(target);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (cmd+click, ctrl+click) do their default behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.(e);
    push(target);
  };

  return (
    <a href={resolved} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
