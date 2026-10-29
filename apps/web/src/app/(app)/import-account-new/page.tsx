import type { Metadata } from "next";
import { AccountImportWizardPage } from "@/components/import/account-import-wizard-page";
export const metadata: Metadata = { title: "Account import wizard · AIMSCAMS" };
export default function Route() { return <AccountImportWizardPage />; }
