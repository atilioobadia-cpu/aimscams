import type { Metadata } from "next";

import { RequestCentrePage } from "@/components/transactions/request-centre-page";

export const metadata: Metadata = {
  title: "Request centre · AIMSCAMS",
};

export default function RequestsPage() {
  return <RequestCentrePage />;
}
