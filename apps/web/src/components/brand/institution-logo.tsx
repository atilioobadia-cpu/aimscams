"use client";

import { useState } from "react";

type InstitutionLogoProps = {
  src?: string | null;
  alt: string;
  /** Two or three letters shown if the asset cannot be loaded. */
  monogram: string;
  width: number;
  height: number;
  className?: string;
};

/**
 * Tenant (institution) logo in the application chrome.
 *
 * The image is rendered at its intrinsic ratio, never cropped into a circle. If the
 * asset is missing the slot degrades to a 40px tenant monogram so the header keeps its
 * geometry and no broken-image request is shown.
 */
export function InstitutionLogo({
  src,
  alt,
  monogram,
  width,
  height,
  className,
}: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        data-testid="tenant-logo-fallback"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-tenant fs-text font-bold text-on-primary ring-2 ring-primary"
      >
        {monogram}
      </span>
    );
  }

  return (
    // A plain <img> preserves an uploaded logo's intrinsic ratio. next/image needs every
    // allowed remote host at build time, and institution logos are arbitrary URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <span
      className="grid size-[34px] shrink-0 place-items-center overflow-hidden rounded-full bg-surface ring-1 ring-card-border"
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="eager"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
