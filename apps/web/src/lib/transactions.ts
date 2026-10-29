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

export type RequestDetail = {
  id: string;
  requestNo: string;
  requestType: string;
  payload: unknown;
  amountMinor: string | null;
  status: RequestStatus;
  currentAssignee: string;
  requestedBy: string;
  approvedBy: string;
  approvedAt: string | null;
  reason: string | null;
  branchName: string;
  createdAt: string;
  canApprove: boolean;
  canReject: boolean;
};

export function getRequest(id: string): Promise<RequestDetail> {
  return apiRequest(`/transactions/requests/${id}`);
}

export function approveRequest(id: string): Promise<{ status: string }> {
  return apiRequest(`/transactions/requests/${id}/approve`, { method: "POST" });
}

export function rejectRequest(id: string, reason: string): Promise<{ status: string }> {
  return apiRequest(`/transactions/requests/${id}/reject`, { method: "POST", body: { reason } });
}

export type TillSession = {
  id: string;
  businessDate: string;
  openingFloatMinor: string;
  closingCountedMinor: string | null;
  systemBalanceMinor: string;
  varianceMinor: string | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  branchName: string;
};

export type TillInfo = {
  businessDate: string;
  session: TillSession | null;
  cashInMinor: string;
  cashOutMinor: string;
  canOpen: boolean;
  canClose: boolean;
};

export function getTill(): Promise<TillInfo> {
  return apiRequest("/transactions/till");
}

export function openTill(payload: { openingFloatMinor: string }): Promise<{ id: string; status: string }> {
  return apiRequest("/transactions/till/open", { method: "POST", body: payload });
}

export function closeTill(payload: { countedMinor: string }): Promise<{ status: string; varianceMinor: string }> {
  return apiRequest("/transactions/till/close", { method: "POST", body: payload });
}

export type TillSessionSummary = {
  id: string;
  businessDate: string;
  openingFloatMinor: string;
  closingCountedMinor: string | null;
  systemBalanceMinor: string | null;
  varianceMinor: string | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  tellerName: string;
  tellerEmail: string;
  branchName: string;
  transactionCount: number;
};

export type TillSessionList = {
  items: TillSessionSummary[];
  canView: boolean;
};

export function listTillSessions(filters: { from?: string; to?: string; tellerId?: string } = {}): Promise<TillSessionList> {
  const query = searchParams(filters);
  return apiRequest(`/transactions/till/sessions${query ? `?${query}` : ""}`);
}

export type CreateTransactionPayload = {
  type: string;
  amountMinor: string;
  clientId?: string;
  savingsAccountId?: string;
  loanId?: string;
  counterAccountCode?: string;
  paymentMethod?: string;
  valueDate?: string;
  narration?: string;
  chequeNo?: string;
  receiptNo?: string;
  externalRef?: string;
  provider?: string;
};

export function createTransaction(payload: CreateTransactionPayload): Promise<{
  id: string;
  transactionNo: string;
  type: string;
  category: string;
  amountMinor: string;
  drCr: string;
  accountingStatus: AccountingStatus;
  status: TransactionStatus;
}> {
  return apiRequest("/transactions", { method: "POST", body: payload });
}
