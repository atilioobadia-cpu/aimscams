"use client";

import { useState } from "react";

type InstitutionLogoProps = {
  src?: string | null;
  alt: string;
  /** Two or three letters shown if the asset cannot be loaded. */
  monogram: string;
  /** Outer diameter in rendered pixels. */
  size?: number;
  /** Hook used by the parity probe. */
  dataParity?: string;
};

/**
 * Tenant (institution) logo in the application chrome.
 *
 * Rendered as a perfect circle with a 2px #057573 ring on a transparent fill.
 * A tenant logo image fits inside (outer size minus the ring); otherwise the
 * tenant initials are shown.
 */
export function InstitutionLogo({
  src,
  alt,
  monogram,
  size = 40.31,
  dataParity,
}: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);
  const imageSrc = src || "/brand/mfsl_logo_systm.jpg";
  const showImage = !failed && Boolean(imageSrc);
  const inner = size - 4;

  return (
    <span
      role="img"
      aria-label={alt}
      data-testid="tenant-logo"
      data-parity={dataParity}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#057573] bg-transparent box-border"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        maxWidth: `${size}px`,
        flex: `0 0 ${size}px`,
        aspectRatio: "1 / 1",
      }}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt={alt}
          loading="eager"
          onError={() => setFailed(true)}
          className="block rounded-full object-cover"
          style={{ width: `${inner}px`, height: `${inner}px` }}
        />
      ) : (
        <span
          className="font-bold leading-none text-[#057573]"
          style={{ fontSize: `${Math.round(inner * 0.34 * 100) / 100}px` }}
        >
          {monogram}
        </span>
      )}
    </span>
  );
}
