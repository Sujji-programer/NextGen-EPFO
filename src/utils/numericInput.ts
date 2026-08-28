import React from 'react';

/**
 * Numeric Input Validation & Sanitization Helpers
 * Strictly prevents leading zeros (e.g., "0500" -> "500"), prevents negative/NaN values,
 * allows clean backspacing to empty string without jumping to "0", and strips non-digit characters.
 */

export interface NumericSanitizeOptions {
  max?: number;
  min?: number;
  allowEmpty?: boolean;
}

/**
 * Sanitizes raw text input into a clean positive integer string.
 * - Strips all non-digit characters.
 * - Strips leading zeros (e.g., "035000" becomes "35000", "00" becomes "0").
 * - Returns "" if the user cleared the input (allowing easy typing/backspacing).
 */
export function sanitizeNumericString(raw: string, options?: NumericSanitizeOptions): string {
  if (raw === undefined || raw === null) return '';

  // 1. Remove all non-digits
  const digitsOnly = String(raw).replace(/\D/g, '');

  if (digitsOnly === '') {
    return options?.allowEmpty !== false ? '' : '0';
  }

  // 2. Strip leading zeros unless the whole string is just "0"
  const stripped = digitsOnly.replace(/^0+(?!$)/, '');
  const cleanStr = stripped === '' ? '0' : stripped;

  // 3. Apply optional max boundary
  if (options?.max !== undefined) {
    const num = Number(cleanStr);
    if (!isNaN(num) && num > options.max) {
      return String(options.max);
    }
  }

  return cleanStr;
}

/**
 * Safe parser from numeric string to integer with fallback.
 */
export function parseNumericString(val: string, fallback: number = 0): number {
  if (!val || val.trim() === '') return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Standard onChange handler for React string-controlled numeric inputs.
 */
export function createNumericChangeHandler(
  setter: (val: string) => void,
  options?: NumericSanitizeOptions
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeNumericString(e.target.value, options);
    setter(sanitized);
  };
}

// Aliases for convenience
export const sanitizeNumericInput = sanitizeNumericString;
export const handleNumericChange = createNumericChangeHandler;

