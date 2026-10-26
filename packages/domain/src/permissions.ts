/**
 * Permission catalogue and role defaults.
 *
 * Permissions are data, not code branches: every check is an `Entity : Action`
 * lookup against the roles a user holds. The seed materialises this catalogue in
 * the database so an administrator can edit role grants without a deploy.
 */

export const PERMISSION_ACTIONS = [
  "View",
  "Create",
  "Edit",
  "Delete",
  "Approve",
  "Reject",
  "Reversal Approval",
  "Disburse",
  "Import",
  "Export",
] as const;

export const PERMISSION_ENTITIES = [
  "Client",
  "Client Group",
  "Savings Account",
  "Loan Account",
  "Transaction",
  "Journal Entry",
  "Accounting Period",
  "Report",
  "Import",
  "Message",
  "Campaign",
  "Business Account",
  "Settings User",
  "Settings Role",
  "Settings Branch",
  "Settings Product",
  "Settings Policy",
  "Settings Accounting",
  "System Log",
  "Audit Event",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionEntity = (typeof PERMISSION_ENTITIES)[number];
export type PermissionKey = `${PermissionEntity} : ${PermissionAction}`;

export function permissionKey(entity: PermissionEntity, action: PermissionAction): PermissionKey {
  return `${entity} : ${action}`;
}

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_ENTITIES.flatMap((entity) =>
  PERMISSION_ACTIONS.map((action) => permissionKey(entity, action)),
);

const READ_ALL = PERMISSION_ENTITIES.map((entity) => permissionKey(entity, "View"));
const EXPORT_ALL = PERMISSION_ENTITIES.map((entity) => permissionKey(entity, "Export"));

const APPROVER_ENTITIES: PermissionEntity[] = [
  "Loan Account",
  "Transaction",
  "Settings Policy",
  "Settings Product",
  "Accounting Period",
];

const APPROVER_PERMISSIONS: PermissionKey[] = APPROVER_ENTITIES.flatMap((entity) => [
  permissionKey(entity, "Approve"),
  permissionKey(entity, "Reject"),
]);

const SETTINGS_ADMIN = PERMISSION_ENTITIES.filter((entity) =>
  entity.startsWith("Settings "),
).flatMap((entity) =>
  PERMISSION_ACTIONS.filter((action) => action !== "Reversal Approval").map((action) =>
    permissionKey(entity, action),
  ),
);

export const ROLE_DEFINITIONS = [
  {
    code: "ADMIN",
    name: "Admin",
    description: "Tenant configuration, users, roles, products and policies.",
    permissions: ALL_PERMISSIONS,
  },
  {
    code: "MANAGING_DIRECTOR",
    name: "Managing Director",
    description: "Final credit sanction and policy approval.",
    permissions: [...READ_ALL, ...EXPORT_ALL, ...APPROVER_PERMISSIONS],
  },
  {
    code: "DIRECTOR",
    name: "Director",
    description: "Board-level oversight and sanctions.",
    permissions: [...READ_ALL, ...EXPORT_ALL, ...APPROVER_PERMISSIONS],
  },
  {
    code: "BOARD_MEMBER",
    name: "Board Member",
    description: "Policy approval and credit committee oversight.",
    permissions: [...READ_ALL, ...EXPORT_ALL, ...APPROVER_PERMISSIONS],
  },
  {
    code: "BOARD_REPRESENTATIVE",
    name: "Board Member Representative",
    description: "Delegated board approval.",
    permissions: [...READ_ALL, ...EXPORT_ALL, ...APPROVER_PERMISSIONS],
  },
  {
    code: "CEO",
    name: "CEO",
    description: "Executive oversight and approvals.",
    permissions: [...READ_ALL, ...EXPORT_ALL, ...APPROVER_PERMISSIONS],
  },
  {
    code: "GENERAL_MANAGER",
    name: "General Manager",
    description: "Cross-branch operations and approvals.",
    permissions: [
      ...READ_ALL,
      ...EXPORT_ALL,
      ...APPROVER_PERMISSIONS,
      permissionKey("Client", "Edit"),
      permissionKey("Loan Account", "Edit"),
      permissionKey("Savings Account", "Edit"),
    ],
  },
  {
    code: "BRANCH_MANAGER",
    name: "Branch Manager",
    description: "Branch-level approvals and staff supervision.",
    permissions: [
      ...READ_ALL,
      permissionKey("Client", "Create"),
      permissionKey("Client", "Edit"),
      permissionKey("Client Group", "Create"),
      permissionKey("Client Group", "Edit"),
      permissionKey("Loan Account", "Approve"),
      permissionKey("Loan Account", "Reject"),
      permissionKey("Transaction", "Reversal Approval"),
      permissionKey("Report", "Export"),
    ],
  },
  {
    code: "CREDIT_COMMITTEE",
    name: "Credit Committee",
    description: "Collective credit sanction stage.",
    permissions: [
      ...READ_ALL,
      permissionKey("Loan Account", "Approve"),
      permissionKey("Loan Account", "Reject"),
    ],
  },
  {
    code: "CREDIT_OFFICER",
    name: "Credit Officer",
    description: "Eligibility and credit verification stage.",
    permissions: [
      ...READ_ALL,
      permissionKey("Client", "Create"),
      permissionKey("Client", "Edit"),
      permissionKey("Loan Account", "Create"),
      permissionKey("Loan Account", "Edit"),
    ],
  },
  {
    code: "LOAN_OFFICER",
    name: "Loan Officer",
    description: "Origination, KYC, documentation and collections.",
    permissions: [
      ...READ_ALL,
      permissionKey("Client", "Create"),
      permissionKey("Client", "Edit"),
      permissionKey("Client Group", "Create"),
      permissionKey("Client Group", "Edit"),
      permissionKey("Loan Account", "Create"),
      permissionKey("Loan Account", "Edit"),
      permissionKey("Message", "Create"),
      permissionKey("Report", "Export"),
    ],
  },
  {
    code: "CLIENT_MANAGER",
    name: "Client Manager",
    description: "Relationship owner for a portfolio of members.",
    permissions: [
      ...READ_ALL,
      permissionKey("Client", "Create"),
      permissionKey("Client", "Edit"),
      permissionKey("Client Group", "Edit"),
      permissionKey("Message", "Create"),
      permissionKey("Report", "Export"),
    ],
  },
  {
    code: "ACCOUNTANT",
    name: "Accountant",
    description: "Journal entries, reconciliation and financial statements.",
    permissions: [
      ...READ_ALL,
      ...EXPORT_ALL,
      ...SETTINGS_ADMIN,
      permissionKey("Journal Entry", "Create"),
      permissionKey("Journal Entry", "Edit"),
      permissionKey("Accounting Period", "Approve"),
      permissionKey("Accounting Period", "Reject"),
      permissionKey("Report", "Create"),
    ],
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description: "Read-only access across the ledger and audit trail.",
    permissions: [...READ_ALL, ...EXPORT_ALL, permissionKey("Audit Event", "Export")],
  },
  {
    code: "TELLER",
    name: "Teller",
    description: "Cash desk: deposits, withdrawals, repayments and till.",
    permissions: [
      permissionKey("Client", "View"),
      permissionKey("Savings Account", "View"),
      permissionKey("Savings Account", "Create"),
      permissionKey("Savings Account", "Edit"),
      permissionKey("Transaction", "View"),
      permissionKey("Transaction", "Create"),
      permissionKey("Loan Account", "View"),
      permissionKey("Report", "View"),
      permissionKey("Business Account", "View"),
    ],
  },
  {
    code: "SUPPORT",
    name: "Support",
    description: "Assisted operations and troubleshooting.",
    permissions: [
      ...READ_ALL,
      permissionKey("Client", "Edit"),
      permissionKey("Message", "Create"),
      permissionKey("Message", "Edit"),
    ],
  },
  {
    code: "CLIENT",
    name: "Client",
    description: "End member using mobile self-service, not the back office.",
    permissions: [],
  },
] as const;

export type RoleCode = (typeof ROLE_DEFINITIONS)[number]["code"];

export const ROLE_PERMISSIONS: Record<RoleCode, PermissionKey[]> = Object.fromEntries(
  ROLE_DEFINITIONS.map((role) => [role.code, role.permissions]),
) as Record<RoleCode, PermissionKey[]>;

export function permissionsForRoles(roleCodes: readonly RoleCode[]): PermissionKey[] {
  return [...new Set(roleCodes.flatMap((code) => ROLE_PERMISSIONS[code] ?? []))].sort();
}

export function hasPermission(granted: readonly PermissionKey[], required: PermissionKey): boolean {
  return granted.includes(required);
}
