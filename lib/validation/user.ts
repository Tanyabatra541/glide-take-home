import { z } from "zod";

const commonPasswords = ["password", "12345678", "qwerty"];

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .refine((value) => /\d/.test(value), {
    message: "Password must contain at least one digit",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password must contain one special character",
  })
  .refine((value) => !commonPasswords.includes(value.toLowerCase()), {
    message: "Password is too common",
  });

export const dateOfBirthSchema = z
  .string()
  .refine((value) => {
    const dob = new Date(value);
    return !Number.isNaN(dob.getTime());
  }, {
    message: "Invalid date of birth",
  })
  .refine((value) => {
    const dob = new Date(value);
    const today = new Date();
    return dob <= today;
  }, {
    message: "Date of birth cannot be in the future",
  })
  .refine((value) => {
    const dob = new Date(value);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= 18;
  }, {
    message: "You must be at least 18 years old",
  });

  const COMMON_EMAIL_TYPO_TLDS = new Set([
    "con", 
    "cmo",
    "cm",
    "comm",
  ]);
  
  export const emailSchema = z
    .string()
    .trim()
    .email({ message: "Enter a valid email address" })
    .transform((v) => v.toLowerCase())
    .refine((email) => {
      const domain = email.split("@")[1] ?? "";
      const tld = domain.split(".").pop() ?? "";
      return !COMMON_EMAIL_TYPO_TLDS.has(tld);
    }, { message: "Email domain looks incorrect (did you mean .com?)" });

