export type TellerCategory = "CLIENT" | "GENERAL_LEDGER" | "TILL" | "BULK";

export interface TellerType {
  code: string;
  label: string;
  category: TellerCategory;
  cashSide: "DR" | "CR";
  requiresClient?: boolean;
  requiresSavings?: boolean;
  requiresLoan?: boolean;
  requiresCounterAccount?: boolean;
  requiresTwoAccounts?: boolean;
}

export const TELLER_TYPES: readonly TellerType[] = [
  { code: "SAVINGS_DEPOSIT", label: "Savings deposit", category: "CLIENT", cashSide: "DR", requiresSavings: true },
  { code: "SAVINGS_WITHDRAWAL", label: "Savings withdrawal", category: "CLIENT", cashSide: "CR", requiresSavings: true },
  { code: "SHARES_DEPOSIT", label: "Shares deposit", category: "CLIENT", cashSide: "DR", requiresClient: true },
  { code: "SHARES_WITHDRAWAL", label: "Shares withdrawal", category: "CLIENT", cashSide: "CR", requiresClient: true },
  { code: "LOAN_REPAYMENT", label: "Loan repayment", category: "CLIENT", cashSide: "DR", requiresLoan: true },
  { code: "LOAN_DISBURSEMENT", label: "Disburse loan", category: "CLIENT", cashSide: "CR", requiresLoan: true },
  { code: "LOAN_APPLICATION_FEE", label: "Loan application fee", category: "CLIENT", cashSide: "DR", requiresClient: true },
  { code: "FEE_PENALTY_APPLY", label: "Apply fee/penalty", category: "CLIENT", cashSide: "DR", requiresLoan: true },
  { code: "FEE_PENALTY_REVERSE", label: "Reverse fee/penalty", category: "CLIENT", cashSide: "CR", requiresLoan: true },
  { code: "ERROR_CORRECTION", label: "Error correction", category: "CLIENT", cashSide: "DR", requiresClient: true },
  { code: "GL_RECEIPT", label: "Record receipt", category: "GENERAL_LEDGER", cashSide: "DR", requiresCounterAccount: true },
  { code: "GL_PAYMENT", label: "Record payment", category: "GENERAL_LEDGER", cashSide: "CR", requiresCounterAccount: true },
  { code: "OTHER_INCOME", label: "Other income", category: "GENERAL_LEDGER", cashSide: "DR", requiresCounterAccount: true },
  { code: "RECORD_EXPENSE", label: "Record expense", category: "GENERAL_LEDGER", cashSide: "CR", requiresCounterAccount: true },
  { code: "PAY_CORPORATE_TAX", label: "Pay corporate tax", category: "GENERAL_LEDGER", cashSide: "CR" },
  { code: "JOURNAL_ENTRY", label: "Journal entry", category: "GENERAL_LEDGER", cashSide: "DR", requiresTwoAccounts: true },
  { code: "CONTRA", label: "Bank/cash transfer", category: "GENERAL_LEDGER", cashSide: "CR", requiresCounterAccount: true },
  { code: "REVERSE_GL_ENTRY", label: "Reverse GL entry", category: "GENERAL_LEDGER", cashSide: "DR", requiresCounterAccount: true },
  { code: "TILL_OPENING", label: "Till opening", category: "TILL", cashSide: "DR" },
  { code: "TILL_BALANCE", label: "Till balance", category: "TILL", cashSide: "DR" },
  { code: "TILL_TRANSFER", label: "Transfer", category: "TILL", cashSide: "CR", requiresCounterAccount: true },
  { code: "BULK_DEPOSIT", label: "Bulk deposit", category: "BULK", cashSide: "DR", requiresSavings: true },
  { code: "BULK_LOAN_DISBURSEMENT", label: "Bulk loan disbursement", category: "BULK", cashSide: "CR", requiresLoan: true },
] as const;

export const TELLER_TYPE_BY_CODE = new Map(TELLER_TYPES.map((type) => [type.code, type]));

export function tellerType(code: string): TellerType | undefined {
  return TELLER_TYPE_BY_CODE.get(code.trim().toUpperCase());
}
