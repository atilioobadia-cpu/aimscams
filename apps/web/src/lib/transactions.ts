import { apiRequest } from "@/lib/api";

export type TransactionStatus = "SUBMITTED" | "APPROVED" | "REVERSED" | "CANCELLED";
export type AccountingStatus = "PENDING" | "POSTED" | "FAILED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type Transaction = {
  id: string;
  transactionNo: string;
  type: string;
  category: string;
  amountMinor: string;
  drCr: string;
  paymentMethod: string;
  valueDate: string;
  receiptNo: string;
  status: TransactionStatus;
  accountingStatus: AccountingStatus;
  narration: string;
  createdAt: string;
  clientName: string;
  clientReference: string;
  loanNumber: string;
  accountNumber: string;
  branchName: string;
  tellerName: string;
};

export type TransactionList = {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  summary: { pending: number; failed: number; unposted: number };
  canView: boolean;
};

export type RequestItem = {
  id: string;
  requestNo: string;
  requestType: string;
  amountMinor: string | null;
  status: RequestStatus;
  currentAssignee: string;
  requestedBy: string;
  approvedBy: string;
  approvedAt: string;
  reason: string;
  branchName: string;
  createdAt: string;
};

export type RequestList = {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: {
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    assigned: number;
  };
  canView: boolean;
};

type TransactionFilters = {
  q?: string;
  status?: TransactionStatus;
  accountingStatus?: AccountingStatus;
  category?: string;
  from?: string;
  to?: string;
  tellerId?: string;
  page?: number;
  pageSize?: number;
};

type RequestFilters = {
  q?: string;
  status?: RequestStatus;
  requestType?: string;
  assignedToMe?: boolean;
  page?: number;
  pageSize?: number;
};

function searchParams(filters: Readonly<Record<string, string | number | boolean | undefined>>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function listTransactions(filters: TransactionFilters = {}): Promise<TransactionList> {
  const query = searchParams(filters);
  return apiRequest(`/transactions${query ? `?${query}` : ""}`);
}

export function listRequests(filters: RequestFilters = {}): Promise<RequestList> {
  const query = searchParams(filters);
  return apiRequest(`/transactions/requests${query ? `?${query}` : ""}`);
}
