import type { Metadata } from "next";

import { LoanApplicationWizard } from "@/components/accounts/loan-application-wizard";

export const metadata: Metadata = {
  title: "New loan application · AIMSCAMS",
};

export default function CreateLoanApplicationPage() {
  return <LoanApplicationWizard />;
}
