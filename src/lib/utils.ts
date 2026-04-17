import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  
  // Basic length check (10 for landline, 11 for mobile)
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  // Check for repeated digits (e.g., 1111111111)
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // DDD check: 11-99, second digit not 0
  const dddDigits = digits.substring(0, 2);
  const ddd = parseInt(dddDigits);
  if (ddd < 11 || ddd > 99 || dddDigits[1] === '0') return false;
  
  // If 11 digits, 3rd digit must be 9 (mobile)
  if (digits.length === 11 && digits[2] !== '9') return false;
  
  // If 10 digits, 3rd digit should be 2, 3, 4, or 5 (standard landlines)
  // Permissive check for 10 digits to avoid blocking valid but rare numbers
  if (digits.length === 10 && !['2', '3', '4', '5'].includes(digits[2])) return false;

  return true;
}
