import type { Metadata } from "next";

import { OnlineCollectionsPage } from "@/components/transactions/online-collections-page";

export const metadata: Metadata = {
  title: "Online collections · AIMSCAMS",
};

export default function OnlineCollectionsRoute() {
  return <OnlineCollectionsPage />;
}
