/**
 * Simple validation utilities to replace the validator package
 */

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const matches = (str1: string, str2: string): boolean => {
  return str1 === str2;
};

export const isNotEmpty = (str: string): boolean => {
  return str.trim().length > 0;
}; 