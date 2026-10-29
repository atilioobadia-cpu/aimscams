import type { Metadata } from "next";
import { TransactionImportBatchesPage } from "@/components/import/transaction-import-batches-page";
export const metadata: Metadata = { title: "Transaction import batches · AIMSCAMS" };
export default function Route() { return <TransactionImportBatchesPage />; }
