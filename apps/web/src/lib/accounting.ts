import { apiRequest } from "@/lib/api";

export type MoneyString = string;

export type JournalStatus = "draft" | "posted";

export type GlAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: "debit" | "credit";
  isPostable: boolean;
  isAssumption: boolean;
};

export type FiscalPeriod = {
  id: string;
  startsOn: string;
  endsOn: string;
  status: "open" | "closed";
};

export type PolicyAmount = "total" | "principal" | "interest" | "penalty" | "charges";

export type PolicyLine = {
  account: string;
  side: "debit" | "credit";
  amount: PolicyAmount;
};

export type PostingPolicy = {
  id: string;
  eventCode: string;
  version: number;
  lines: PolicyLine[];
  note: string;
  isAssumption: boolean;
};

export type AccountingSettings = {
  organisation: { id: string; code: string; name: string; dialect: string } | null;
  settings: {
    taxRateBp: number;
    interBranchEnabled: boolean;
    updatedAt: string | null;
  };
  periods: FiscalPeriod[];
  policies: PostingPolicy[];
  accounts: GlAccount[];
};

export type JournalEntrySummary = {
  id: string;
  entryNo: string;
  entryDate: string;
  eventCode: string;
  sourceType: string;
  sourceId: string;
  description: string;
  status: JournalStatus;
  reversalOf: string | null;
  postedAt: string | null;
  createdAt: string;
  lineCount: number;
  debitMinor: MoneyString;
  creditMinor: MoneyString;
};

export type JournalLine = {
  id: string;
  lineNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  normalBalance: "debit" | "credit";
  debitMinor: MoneyString;
  creditMinor: MoneyString;
  memo: string;
};

export type JournalEntryDetail = Omit<JournalEntrySummary, "lineCount"> & {
  lines: JournalLine[];
};

export type JournalEntryFilters = {
  status?: string;
  eventCode?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type LedgerRow = {
  lineId: string;
  entryId: string;
  entryNo: string;
  entryDate: string;
  description: string;
  eventCode: string;
  memo: string;
  debitMinor: MoneyString;
  creditMinor: MoneyString;
  runningMinor: MoneyString;
};

export type LedgerPage = {
  account: {
    id: string;
    code: string;
    name: string;
    normalBalance: "debit" | "credit";
  } | null;
  /** Opening, closing and running balances already sit on the account's normal side. */
  openingMinor: MoneyString;
  closingMinor: MoneyString;
  total: number;
  rows: LedgerRow[];
};

export type EntryLineInput = {
  account: string;
  debit?: string;
  credit?: string;
  memo?: string;
};

/**
 * Parse a typed major-unit amount ("1500.50") into integer minor units without
 * touching a float. Returns null when the text is not a non-negative amount with
 * at most two decimals, so the form can show a field-level error.
 */
export function parseMajorToMinor(value: string): bigint | null {
  const text = value.trim().replace(/,/g, "");
  if (!text) return 0n;
  if (!/^\d+(\.\d{0,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
}

function queryString(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    const text = String(value).trim();
    if (text) params.set(key, text);
  }
  const result = params.toString();
  return result ? `?${result}` : "";
}

export function getAccountingSettings(): Promise<AccountingSettings> {
  return apiRequest<AccountingSettings>("/accounting/settings");
}

export function updateAccountingSettings(body: {
  taxRateBp: number;
  interBranchEnabled: boolean;
}) {
  return apiRequest<{ taxRateBp: number; interBranchEnabled: boolean }>("/accounting/settings", {
    method: "PATCH",
    body,
  });
}

export function createFiscalPeriod(body: { startsOn: string; endsOn: string }) {
  return apiRequest<{ id: string; status: "open" | "closed" }>("/accounting/periods", {
    method: "POST",
    body,
  });
}

export function updateFiscalPeriod(id: string, body: { status: "open" | "closed" }) {
  return apiRequest<{ id: string; status: "open" | "closed" }>(`/accounting/periods/${id}`, {
    method: "PATCH",
    body,
  });
}

export function updatePostingPolicy(eventCode: string, body: { lines: PolicyLine[]; note?: string }) {
  return apiRequest<PostingPolicy | null>(`/accounting/posting-policies/${eventCode}`, {
    method: "PUT",
    body,
  });
}

export function listJournalEntries(filters: JournalEntryFilters) {
  return apiRequest<{ total: number; entries: JournalEntrySummary[] }>(
    `/accounting/entries${queryString(filters)}`,
  );
}

export function getJournalEntry(id: string) {
  return apiRequest<JournalEntryDetail>(`/accounting/entries/${id}`);
}

export function createJournalEntry(body: {
  entryDate: string;
  description: string;
  eventCode?: string;
  lines: EntryLineInput[];
  post?: boolean;
}) {
  return apiRequest<JournalEntryDetail>("/accounting/entries", {
    method: "POST",
    body,
  });
}

export function postJournalEntry(id: string) {
  return apiRequest<JournalEntryDetail>(`/accounting/entries/${id}/post`, {
    method: "POST",
    body: {},
  });
}

export function reverseJournalEntry(
  id: string,
  body: { entryDate: string; description?: string },
) {
  return apiRequest<JournalEntryDetail>(`/accounting/entries/${id}/reverse`, {
    method: "POST",
    body,
  });
}

export function getLedger(filters: {
  accountId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest<LedgerPage>(`/accounting/ledger${queryString(filters)}`);
}
