export function validateUsername(username) {
  if (!username || !username.trim()) return 'Username is required';
  if (!/^[a-z0-9_]+$/.test(username)) return 'Only lowercase letters, numbers, underscore';
  if (username.length > 30) return 'Max 30 characters';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Min 6 characters';
  return null;
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) return `${fieldName} is required`;
  return null;
}

export function validateMaxLength(value, max, fieldName) {
  if (value && value.length > max) return `${fieldName} must be ${max} characters or less`;
  return null;
}
