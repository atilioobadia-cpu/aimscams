"use client";

import { useState } from "react";

type InstitutionLogoProps = {
  src?: string | null;
  alt: string;
  /** Two or three letters shown if the asset cannot be loaded. */
  monogram: string;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Tenant (institution) logo in the application chrome.
 *
 * Rendered as a 44px perfect circle: 2px ring #057573 on a #29aae3 fill, overflow
 * hidden, content centered. A tenant logo image fits inside with object-fit contain;
 * otherwise the tenant initials are shown in white, bold, 16px.
 */
export function InstitutionLogo({ src, alt, monogram }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      role="img"
      aria-label={alt}
      data-testid="tenant-logo"
      className="grid h-[44px] w-[44px] min-h-[44px] min-w-[44px] max-h-[44px] max-w-[44px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#057573] bg-[#29aae3] box-border"
      style={{ flex: "0 0 44px", aspectRatio: "1 / 1" }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          loading="eager"
          onError={() => setFailed(true)}
          className="max-h-full max-w-full object-contain p-[3px]"
        />
      ) : (
        <span className="text-[16px] font-bold leading-none text-white">{monogram}</span>
      )}
    </span>
  );
}
