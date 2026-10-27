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
export type FeePenaltyKind = "FEE" | "PENALTY";
export type FeeAmountType = "FIXED" | "PERCENTAGE";
export type FeePenaltyStatus = "ACTIVE" | "INACTIVE";

export type FeePenalty = {
  id: string;
  code: string;
  name: string;
  kind: FeePenaltyKind;
  amountType: FeeAmountType;
  amountMinor: string | null;
  rateBp: number | null;
  glAccountId: string | null;
  status: FeePenaltyStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeePenaltyListResponse = {
  items: FeePenalty[];
  canView: boolean;
  canEdit: boolean;
};

export type FeePenaltyResponse = {
  item: FeePenalty;
  canEdit: boolean;
};

export async function listFeePenalties(filter: { q?: string; status?: string; kind?: string } = {}): Promise<FeePenaltyListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  if (filter.kind) params.set("kind", filter.kind);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<FeePenaltyListResponse>(`/settings/products/fee-penalties${suffix}`);
}

export async function createFeePenalty(payload: {
  code: string;
  name: string;
  kind: FeePenaltyKind;
  amountType: FeeAmountType;
  amountMinor?: string | null;
  rateBp?: number | null;
  glAccountId?: string | null;
  description?: string | null;
}): Promise<FeePenaltyResponse> {
  return apiRequest<FeePenaltyResponse>("/settings/products/fee-penalties", {
    method: "POST",
    body: payload,
  });
}

export async function updateFeePenalty(id: string, payload: Partial<{
  code: string;
  name: string;
  kind: FeePenaltyKind;
  amountType: FeeAmountType;
  amountMinor: string | null;
  rateBp: number | null;
  glAccountId: string | null;
  status: FeePenaltyStatus;
  description: string | null;
}>): Promise<FeePenaltyResponse> {
  return apiRequest<FeePenaltyResponse>(`/settings/products/fee-penalties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export type ProvisioningRuleStatus = "ACTIVE" | "INACTIVE";

export type ProvisioningRule = {
  id: string;
  code: string;
  name: string;
  status: ProvisioningRuleStatus;
  daysFrom: number;
  daysTo: number | null;
  rateBp: number;
  glAccountId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProvisioningRuleListResponse = {
  items: ProvisioningRule[];
  canView: boolean;
  canEdit: boolean;
};

export type ProvisioningRuleResponse = {
  item: ProvisioningRule;
  canEdit: boolean;
};

export async function listProvisioningRules(filter: { q?: string; status?: string } = {}): Promise<ProvisioningRuleListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<ProvisioningRuleListResponse>(`/settings/products/provisioning-rules${suffix}`);
}

export async function createProvisioningRule(payload: {
  code: string;
  name: string;
  status?: string;
  daysFrom: number;
  daysTo?: number | null;
  rateBp: number;
  glAccountId?: string | null;
  description?: string | null;
}): Promise<ProvisioningRuleResponse> {
  return apiRequest<ProvisioningRuleResponse>("/settings/products/provisioning-rules", {
    method: "POST",
    body: payload,
  });
}
export type MembershipPolicyStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type MembershipPolicy = {
  id: string;
  code: string;
  name: string;
  status: MembershipPolicyStatus;
  description: string | null;
  memberType: string;
  minNextOfKin: number;
  maxNextOfKin: number;
  dormantDays: number;
  allowWithdraw: boolean;
  autoActiveUponDeposit: boolean;
  enableMemberVerification: boolean;
  verificationType: string | null;
  boardApproval: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MembershipPolicyListResponse = {
  items: MembershipPolicy[];
  canView: boolean;
  canEdit: boolean;
};

export type MembershipPolicyResponse = {
  item: MembershipPolicy;
  canEdit: boolean;
};

export async function listMembershipPolicies(filter: { q?: string; status?: string } = {}): Promise<MembershipPolicyListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<MembershipPolicyListResponse>(`/settings/policies/membership${suffix}`);
}

export async function createMembershipPolicy(payload: {
  code: string;
  name: string;
  status?: string;
  description?: string | null;
  memberType?: string;
  minNextOfKin?: number;
  maxNextOfKin?: number;
  dormantDays?: number;
  allowWithdraw?: boolean;
  autoActiveUponDeposit?: boolean;
  enableMemberVerification?: boolean;
  verificationType?: string | null;
  boardApproval?: unknown;
}): Promise<MembershipPolicyResponse> {
  return apiRequest<MembershipPolicyResponse>("/settings/policies/membership", {
    method: "POST",
    body: payload,
  });
}
export type CreditProductPolicyStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type CreditProductPolicy = {
  id: string;
  code: string;
  name: string;
  status: CreditProductPolicyStatus;
  description: string | null;
  content: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CreditProductPolicyListResponse = {
  items: CreditProductPolicy[];
  canView: boolean;
  canEdit: boolean;
};

export type CreditProductPolicyResponse = {
  item: CreditProductPolicy;
  canEdit: boolean;
};

export async function listCreditProductPolicies(filter: { q?: string; status?: string } = {}): Promise<CreditProductPolicyListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<CreditProductPolicyListResponse>(`/settings/policies/credit-product${suffix}`);
}

export async function createCreditProductPolicy(payload: {
  code: string;
  name: string;
  status?: string;
  description?: string | null;
  content?: unknown;
}): Promise<CreditProductPolicyResponse> {
  return apiRequest<CreditProductPolicyResponse>("/settings/policies/credit-product", {
    method: "POST",
    body: payload,
  });
}
export type Holiday = {
  id: string;
  name: string;
  holidayDate: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HolidayListResponse = {
  items: Holiday[];
  canView: boolean;
  canEdit: boolean;
};

export type HolidayResponse = {
  item: Holiday;
  canEdit: boolean;
};

export async function listHolidays(): Promise<HolidayListResponse> {
  return apiRequest<HolidayListResponse>("/settings/policies/holidays");
}

export async function createHoliday(payload: {
  name: string;
  holidayDate: string;
  branchId?: string | null;
}): Promise<HolidayResponse> {
  return apiRequest<HolidayResponse>("/settings/policies/holidays", {
    method: "POST",
    body: payload,
  });
}
export async function getMembershipPolicy(id: string): Promise<MembershipPolicyResponse> {
  return apiRequest<MembershipPolicyResponse>(`/settings/policies/membership/${encodeURIComponent(id)}`);
}

export async function updateMembershipPolicy(id: string, payload: Partial<{
  code: string;
  name: string;
  status: string;
  description: string | null;
  memberType: string;
  minNextOfKin: number;
  maxNextOfKin: number;
  dormantDays: number;
  allowWithdraw: boolean;
  autoActiveUponDeposit: boolean;
  enableMemberVerification: boolean;
  verificationType: string | null;
}>): Promise<MembershipPolicyResponse> {
  return apiRequest<MembershipPolicyResponse>(`/settings/policies/membership/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export async function getCreditProductPolicy(id: string): Promise<CreditProductPolicyResponse> {
  return apiRequest<CreditProductPolicyResponse>(`/settings/policies/credit-product/${encodeURIComponent(id)}`);
}
export async function updateCreditProductPolicy(id: string, payload: Partial<{
  code: string;
  name: string;
  status: string;
  description: string | null;
  content: unknown;
}>): Promise<CreditProductPolicyResponse> {
  return apiRequest<CreditProductPolicyResponse>(`/settings/policies/credit-product/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export async function updateLoanProduct(id: string, payload: { status?: string; name?: string }): Promise<LoanProductResponse> {
  return apiRequest<LoanProductResponse>(`/settings/products/loans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export async function updateInterestRate(id: string, payload: { status?: string }): Promise<InterestRateResponse> {
  return apiRequest<InterestRateResponse>(`/settings/products/interest-rates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function updateProvisioningRule(id: string, payload: { status?: string }): Promise<ProvisioningRuleResponse> {
  return apiRequest<ProvisioningRuleResponse>(`/settings/products/provisioning-rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export type ClientStatus = "ACTIVE" | "INACTIVE" | "PENDING";
export type ClientType = "INDIVIDUAL" | "GROUP";

export type Client = {
  id: string;
  memberNo: string | null;
  referenceNo: string;
  fullName: string;
  clientType: ClientType;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  status: ClientStatus;
  kycStatus: string;
  joinedAt: string | null;
  groupName: string | null;
  branchName: string | null;
  profile: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ClientListResponse = {
  items: Client[];
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
};

export type ClientResponse = {
  client: Client;
  canEdit: boolean;
};

export async function listClients(filter: { q?: string; status?: string; type?: string } = {}): Promise<ClientListResponse> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.status) params.set("status", filter.status);
  if (filter.type) params.set("type", filter.type);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<ClientListResponse>(`/settings/clients${suffix}`);
}

export async function createClient(payload: {
  referenceNo?: string;
  fullName: string;
  clientType?: ClientType;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  branchId?: string | null;
  profile?: unknown;
}): Promise<ClientResponse> {
  return apiRequest<ClientResponse>("/settings/clients", {
    method: "POST",
    body: payload,
  });
}
export async function updateClient(id: string, payload: { status?: string }): Promise<ClientResponse> {
  return apiRequest<ClientResponse>(`/settings/clients/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}
export async function getClient(id: string): Promise<ClientResponse> {
  return apiRequest<ClientResponse>(`/settings/clients/${encodeURIComponent(id)}`);
}
