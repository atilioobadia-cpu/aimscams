import type { Metadata } from "next";

import { SystemLogsPage } from "@/components/settings/system-logs-page";

export const metadata: Metadata = {
  title: "System logs · AIMSCAMS",
};

export default function SystemLogsRoute() {
  return <SystemLogsPage />;
}
