const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Nigerian mobile numbers: 0803..., 0703..., +234803... */
const NG_PHONE_RE = /^(?:\+234|234|0)[789][01]\d{8}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidNigerianPhone(value: string): boolean {
  return NG_PHONE_RE.test(value.replace(/[\s-]/g, ''));
}

/** At least 8 chars, one letter and one number. */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function isValidAccountNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}
