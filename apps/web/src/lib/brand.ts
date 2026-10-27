/**
 * Tenant brand assets for the demo deployment.
 *
 * The demo institution is branded with the Mafanikio lockup. Production installations
 * resolve the same slot from the organisation record instead of a static file; the
 * component contract (src, width, height) stays identical, so only this module changes.
 */
export const tenantLogo = {
  name: "Mafanikio Financial Services Limited",
  monogram: "MFS",
  src: "/brand/mafanikio-logo.png",
  /** Intrinsic pixel size of the shipped asset (300x43, ratio 6.98:1). */
  width: 300,
  height: 43,
} as const;
