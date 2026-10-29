import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Account import wizard · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="Account import wizard"
      description="Upload, map, validate and commit account data."
      detail="This import module arrives with the import phase. It will read and validate files before applying them."
    />
  );
}
