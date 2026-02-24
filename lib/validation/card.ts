export function normalizeCardNumber(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidCardNumber(input: string): boolean {
  const digits = normalizeCardNumber(input);

  // Most card schemes use lengths between 13 and 19 digits.
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10);

    if (Number.isNaN(digit)) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

