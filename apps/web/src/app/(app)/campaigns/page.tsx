import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns · AIMSCAMS",
};

export default function CampaignsPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-[var(--fs)] font-semibold text-muted-foreground">Coming soon</p>
    </div>
  );
}
