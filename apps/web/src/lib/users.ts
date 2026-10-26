import { apiRequest } from "@/lib/api";

export type UserBranch = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type UserSummary = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  branch: UserBranch | null;
  roles: { code: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

export type BranchSummary = {
  id: string;
  code: string;
  name: string;
  status: string;
  region: string;
};

export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionKeys: string[];
  userCount: number;
};

export type UserFilters = {
  q?: string;
  status?: string;
  role?: string;
  branchId?: string;
};

function queryString(filters: UserFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.role) params.set("role", filters.role);
  if (filters.branchId) params.set("branchId", filters.branchId);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function listUsers(filters: UserFilters = {}): Promise<UserSummary[]> {
  return apiRequest<UserSummary[]>(`/users${queryString(filters)}`);
}

export function getUser(id: string): Promise<UserSummary> {
  return apiRequest<UserSummary>(`/users/${id}`);
}

export function listBranches(): Promise<BranchSummary[]> {
  return apiRequest<BranchSummary[]>("/users/branches");
}

export function listRoles(): Promise<RoleSummary[]> {
  return apiRequest<RoleSummary[]>("/users/roles");
}

export function createUser(body: Record<string, unknown>): Promise<UserSummary> {
  return apiRequest<UserSummary>("/users", { method: "POST", body });
}

export function updateUser(id: string, body: Record<string, unknown>): Promise<UserSummary> {
  return apiRequest<UserSummary>(`/users/${id}`, { method: "PATCH", body });
}

export function unlockUser(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/users/${id}/unlock`, { method: "POST" });
}

export function updateRole(id: string, body: Record<string, unknown>): Promise<RoleSummary> {
  return apiRequest<RoleSummary>(`/users/roles/${id}`, { method: "PATCH", body });
}
