"use client";

import { useEnsAvatar, useEnsName } from "@/lib/ens";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/utils";

/**
 * An address shown as a person: ENS avatar + name where one exists, the
 * truncated address otherwise.
 *
 * Both resolutions are independent and either can miss — plenty of names have
 * no avatar record — so each falls back on its own rather than the whole thing
 * collapsing to a raw address.
 *
 * The fallback disc is a deterministic hue from the address, so an
 * avatar-less recipient is still visually distinct from its neighbours in a
 * list instead of a row of identical grey circles.
 */
export function EnsIdentity({
  address,
  size = 16,
  showName = true,
  className,
  nameClassName,
}: {
  address: string;
  size?: number;
  /** Set false for an avatar-only chip. */
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}) {
  const { data: ensName } = useEnsName(address);
  const { data: avatar } = useEnsAvatar(ensName);

  const display = ensName || truncateAddress(address);
  // Hue from the address so the disc is stable per identity, not random.
  const hue = Number.parseInt(address.slice(2, 8), 16) % 360;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {avatar ? (
        // Plain <img>: ENS avatars resolve to arbitrary hosts (and data: URIs),
        // which next/image would need every one of allowlisted.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover shrink-0"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          aria-hidden
          className="rounded-full shrink-0"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 70% 48%))`,
          }}
        />
      )}
      {showName && (
        <span className={cn("truncate", nameClassName)} title={address}>
          {display}
        </span>
      )}
    </span>
  );
}
