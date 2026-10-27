export function maskNationalId(value: string | null | undefined): string {
  if (!value) return "N/A";
  const parts = value.split("-");
  if (parts.length !== 4) return "XXXX-XXXXX-XXXXX-XX";
  return `${parts[0].slice(0, 4)}XXXX-XXXXX-XXXXX-${parts[3]}`;
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return "N/A";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return `****${digits}`;
  return `****${digits.slice(-4)}`;
}

export function maskEmail(value: string | null | undefined): string {
  if (!value) return "N/A";
  const [local, domain] = value.split("@");
  if (!domain) return "N/A";
  const first = local.charAt(0) || "*";
  return `${first}*****@${domain}`;
}

export function nationalIdPattern(value: string): boolean {
  return /^\d{8}-\d{5}-\d{5}-\d{2}$/.test(value.trim());
}
