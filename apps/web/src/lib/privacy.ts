export function maskNationalId(value: string | null | undefined): string {
  if (!value) return "N/A";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "N/A";
  if (digits.length <= 16) return digits;
  return `${digits.slice(0, 16)}****`;
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

export function titleCase(value: string | null | undefined): string {
  if (!value) return "N/A";
  return value
    .toLowerCase()
    .replace(/(^|\s|[-_])([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}
