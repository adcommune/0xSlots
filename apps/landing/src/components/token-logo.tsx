interface TokenLogoProps {
  /** Logo slug from `TokenInfo.logo`. Absent for custom/unknown tokens. */
  slug?: string;
  /** Falls back to this symbol's first letter when there is no slug. */
  symbol?: string;
  className?: string;
}

/**
 * A token's mark, or a monogram disc standing in for one.
 *
 * The fallback is not decoration: the currency select accepts an arbitrary
 * ERC-20 address, so most tokens it can show will never have an asset. A
 * broken image or a blank gap at the left edge of one row would break the
 * alignment of every other row.
 */
export function TokenLogo({
  slug,
  symbol,
  className = "size-5",
}: TokenLogoProps) {
  if (slug) {
    return (
      // Plain <img>: fixed-size local SVGs, so next/image has nothing to
      // optimise. Same call ens-identity.tsx makes for avatars.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/tokens/${slug}.svg`}
        alt=""
        aria-hidden="true"
        className={`${className} shrink-0 rounded-full`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold uppercase`}
    >
      {symbol?.trim()?.[0] ?? "?"}
    </span>
  );
}
