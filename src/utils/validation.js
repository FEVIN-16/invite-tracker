/**
 * Validates an email address using a standard regex.
 * @param {string} email
 * @returns {{isValid: boolean, error?: string}}
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: true }; // Optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  return { isValid: true };
};

/**
 * Validates an Indian phone number.
 * Supports: +91, 91, 0 prefixes or just 10 digits.
 * Mobile numbers must start with 6-9.
 * @param {string} phone
 * @returns {{isValid: boolean, error?: string}}
 */
export const validatePhone = (phone) => {
  if (!phone) return { isValid: true }; // Optional field
  
  // Strip all non-digit characters except the leading +
  const clean = phone.replace(/[^\d+]/g, '');
  
  // Regex for Indian Mobile numbers:
  // Starts with optional +91, 91, or 0
  // Followed by 10 digits starting with 6, 7, 8, or 9
  const re = /^(\+91|91|0)?[6789]\d{9}$/;
  
  if (!re.test(clean)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210)' 
    };
  }

  return { isValid: true };
};


