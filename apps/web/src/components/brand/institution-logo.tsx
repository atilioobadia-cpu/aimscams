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
 * Rendered as a 40px perfect circle: 2px ring #057573 on a #29aae3 fill, overflow
 * hidden, content centered. A tenant logo image fits inside with object-fit contain;
 * otherwise the tenant initials are shown in white, bold, 12.8px.
 */
export function InstitutionLogo({ src, alt, monogram }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      role="img"
      aria-label={alt}
      data-testid="tenant-logo"
      className="grid h-[40px] w-[40px] min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#057573] bg-[#29aae3] box-border"
      style={{ flex: "0 0 40px", aspectRatio: "1 / 1" }}
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
        <span className="text-[12.8px] font-bold leading-none text-white">{monogram}</span>
      )}
    </span>
  );
}
