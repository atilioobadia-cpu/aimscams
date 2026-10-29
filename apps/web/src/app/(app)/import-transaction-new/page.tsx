import type { Metadata } from "next";
import { TransactionImportWizardPage } from "@/components/import/transaction-import-wizard-page";
export const metadata: Metadata = { title: "Transaction import wizard · AIMSCAMS" };
export default function Route() { return <TransactionImportWizardPage />; }
