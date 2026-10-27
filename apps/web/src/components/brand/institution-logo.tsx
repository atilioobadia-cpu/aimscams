"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "cn";

type InstitutionLogoProps = {
  src: string;
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

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        data-testid="tenant-logo-fallback"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-tenant text-fs font-bold text-on-primary ring-2 ring-primary"
      >
        {monogram}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      loading="eager"
      onError={() => setFailed(true)}
      className={cn("w-auto object-contain", className)}
    />
  );
}
