import type { Metadata } from "next";
import { AccountImportBatchesPage } from "@/components/import/account-import-batches-page";
export const metadata: Metadata = { title: "Account import batches · AIMSCAMS" };
export default function Route() { return <AccountImportBatchesPage />; }
