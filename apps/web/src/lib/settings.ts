import { apiRequest } from "@/lib/api";

export type InstitutionDialect = "TCDC" | "BOT";
export type BranchStatus = "OPEN" | "CLOSED";
export type CouncilType = "CC" | "MC" | "DC" | "TC";

export type BranchHour = {
  weekday: number;
  isClosed: boolean;
  opensMinute: number;
  closesMinute: number;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  addressLine: string | null;
  region: string;
  district: string | null;
  ward: string | null;
  councilType: CouncilType | null;
  employeeCount: number;
  status: BranchStatus;
  isDefault: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  hours: BranchHour[];
};

export type BranchListResponse = {
  items: Branch[];
  canCreate: boolean;
  canEdit: boolean;
};

export type BranchResponse = {
  branch: Branch;
  canEdit: boolean;
};

export type OrganisationBranchOption = {
  id: string;
  code: string;
  name: string;
  status: BranchStatus;
  isDefault: boolean;
};

export type OrganisationSettings = {
  id: string;
  code: string;
  name: string;
  registrationNo: string | null;
  dialect: InstitutionDialect;
  timezone: string;
  locale: string;
  logoUrl: string | null;
  logoUpdatedAt: string | null;
  updatedAt: string;
  defaultBranchId: string | null;
  branches: OrganisationBranchOption[];
  canEdit: boolean;
};

export type OrganisationUpdate = {
  name?: string;
  registrationNo?: string | null;
  dialect?: InstitutionDialect;
  timezone?: string;
  logoUrl?: string;
  defaultBranchId?: string;
};

export type BranchPayload = {
  code: string;
  name: string;
  addressLine: string | null;
  region: string;
  district: string | null;
  ward: string | null;
  councilType: CouncilType | null;
  employeeCount: number;
  status: BranchStatus;
  isDefault: boolean;
  hours: BranchHour[];
};

export const WEEKDAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
] as const;

export const COUNCIL_TYPES: Array<{ value: CouncilType; label: string }> = [
  { value: "CC", label: "City Council (CC)" },
  { value: "MC", label: "Municipal Council (MC)" },
  { value: "DC", label: "District Council (DC)" },
  { value: "TC", label: "Town Council (TC)" },
];

export const COMMON_TIMEZONES = [
  "Africa/Dar_es_Salaam",
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Kigali",
  "Africa/Lusaka",
  "Africa/Harare",
  "Africa/Maputo",
  "UTC",
] as const;

export function defaultBranchHours(): BranchHour[] {
  return [
    { weekday: 1, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 2, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 3, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 4, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 5, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 6, isClosed: false, opensMinute: 8 * 60, closesMinute: 13 * 60 },
    { weekday: 7, isClosed: true, opensMinute: 0, closesMinute: 0 },
  ];
}

export function normaliseHours(hours: BranchHour[] | undefined): BranchHour[] {
  if (!hours || hours.length !== 7) return defaultBranchHours();
  return [...hours].sort((left, right) => left.weekday - right.weekday);
}

export function minutesToTime(minutes: number): string {
  const value = Math.max(0, Math.min(1440, Math.round(minutes)));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours >= 24) return "23:59";
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return 0;
  return Math.max(0, Math.min(1440, hours * 60 + minutes));
}

export function dayLabel(weekday: number): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.label ?? `Day ${weekday}`;
}

export function councilLabel(value: CouncilType | null): string {
  if (!value) return "Not recorded";
  return COUNCIL_TYPES.find((item) => item.value === value)?.label ?? value;
}

export async function getOrganisation(): Promise<OrganisationSettings> {
  return apiRequest<OrganisationSettings>("/settings/organisation");
}

export async function updateOrganisation(input: OrganisationUpdate): Promise<OrganisationSettings> {
  return apiRequest<OrganisationSettings>("/settings/organisation", {
    method: "PATCH",
    body: input,
  });
}

export async function uploadOrganisationLogo(dataUrl: string): Promise<OrganisationSettings> {
  return apiRequest<OrganisationSettings>("/settings/organisation/logo", {
    method: "PUT",
    body: { dataUrl },
  });
}

export async function deleteOrganisationLogo(): Promise<OrganisationSettings> {
  return apiRequest<OrganisationSettings>("/settings/organisation/logo", {
    method: "DELETE",
  });
}

export async function listBranches(
  filter: {
    q?: string;
    status?: string;
  } = {},
): Promise<BranchListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<BranchListResponse>(`/settings/branches${suffix}`);
}

export async function getBranch(id: string): Promise<BranchResponse> {
  return apiRequest<BranchResponse>(`/settings/branches/${encodeURIComponent(id)}`);
}

export async function createBranch(payload: BranchPayload): Promise<BranchResponse> {
  return apiRequest<BranchResponse>("/settings/branches", {
    method: "POST",
    body: payload,
  });
}

export async function updateBranch(id: string, payload: BranchPayload): Promise<BranchResponse> {
  return apiRequest<BranchResponse>(`/settings/branches/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export type LoanProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type LoanProduct = {
  id: string;
  code: string;
  name: string;
  status: LoanProductStatus;
  description: string | null;
  minPrincipalMinor: string;
  maxPrincipalMinor: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  interestRateBp: number;
  interestMethod: string;
  repaymentFrequency: string;
  gracePeriodDays: number;
  arrearsClassificationDays: number;
  managementFeeBp: number;
  penaltyBp: number;
  principalAccountId: string | null;
  interestIncomeAccountId: string | null;
  chargesIncomeAccountId: string | null;
  penaltyIncomeAccountId: string | null;
  workflowStages: unknown;
  createdAt: string;
  updatedAt: string;
};

export type LoanProductListResponse = {
  items: LoanProduct[];
  canView: boolean;
  canEdit: boolean;
};

export type LoanProductResponse = {
  product: LoanProduct;
  canEdit: boolean;
};

export async function listLoanProducts(filter: { q?: string; status?: string } = {}): Promise<LoanProductListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<LoanProductListResponse>(`/settings/products/loans${suffix}`);
}

export async function getLoanProduct(id: string): Promise<LoanProductResponse> {
  return apiRequest<LoanProductResponse>(`/settings/products/loans/${encodeURIComponent(id)}`);
}

export type InterestRateStatus = "ACTIVE" | "INACTIVE";

export type InterestRate = {
  id: string;
  code: string;
  name: string;
  status: InterestRateStatus;
  rateBp: number;
  period: string;
  effectiveFrom: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterestRateListResponse = {
  items: InterestRate[];
  canView: boolean;
  canEdit: boolean;
};

export type InterestRateResponse = {
  rate: InterestRate;
  canEdit: boolean;
};

export async function listInterestRates(filter: { q?: string; status?: string } = {}): Promise<InterestRateListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<InterestRateListResponse>(`/settings/products/interest-rates${suffix}`);
}

export async function createInterestRate(payload: {
  code: string;
  name: string;
  status?: string;
  rateBp: number;
  period?: string;
  description?: string | null;
  effectiveFrom?: string | null;
}): Promise<InterestRateResponse> {
  return apiRequest<InterestRateResponse>("/settings/products/interest-rates", {
    method: "POST",
    body: payload,
  });
}

export type SavingsProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type SavingsProduct = {
  id: string;
  code: string;
  name: string;
  status: SavingsProductStatus;
  description: string | null;
  allowedAsGuarantor: boolean;
  allowedAsCollateral: boolean;
  allowedMultipleAccounts: boolean;
  allowInterestPayout: boolean;
  minBalanceMinor: string;
  interestRateBp: number;
  interestPayoutFrequency: string;
  createdAt: string;
  updatedAt: string;
};

export type SavingsProductListResponse = {
  items: SavingsProduct[];
  canView: boolean;
  canEdit: boolean;
};

export type SavingsProductResponse = {
  product: SavingsProduct;
  canEdit: boolean;
};

export async function listSavingsProducts(filter: { q?: string; status?: string } = {}): Promise<SavingsProductListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<SavingsProductListResponse>(`/settings/products/savings${suffix}`);
}

export async function getSavingsProduct(id: string): Promise<SavingsProductResponse> {
  return apiRequest<SavingsProductResponse>(`/settings/products/savings/${encodeURIComponent(id)}`);
}

export async function createSavingsProduct(payload: {
  code: string;
  name: string;
  status?: string;
  description?: string | null;
  allowedAsGuarantor?: boolean;
  allowedAsCollateral?: boolean;
  allowedMultipleAccounts?: boolean;
  allowInterestPayout?: boolean;
  minBalanceMinor?: string;
  interestRateBp?: number;
  interestPayoutFrequency?: string;
}): Promise<SavingsProductResponse> {
  return apiRequest<SavingsProductResponse>("/settings/products/savings", {
    method: "POST",
    body: payload,
  });
}

export async function updateSavingsProduct(id: string, payload: Partial<{
  code: string;
  name: string;
  status: string;
  description: string | null;
  allowedAsGuarantor: boolean;
  allowedAsCollateral: boolean;
  allowedMultipleAccounts: boolean;
  allowInterestPayout: boolean;
  minBalanceMinor: string;
  interestRateBp: number;
  interestPayoutFrequency: string;
}>): Promise<SavingsProductResponse> {
  return apiRequest<SavingsProductResponse>(`/settings/products/savings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
