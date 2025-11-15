export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(
  password: string,
  requirements: PasswordRequirements
): { strength: 'weak' | 'medium' | 'strong'; score: number } {
  let score = 0;
  const length = password.length;

  // Length scoring (0-25 points)
  if (length >= requirements.minLength) {
    score += 10;
  }
  if (length >= 12) {
    score += 10;
  }
  if (length >= 16) {
    score += 5;
  }

  // Character variety scoring (0-50 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) {
    score += 10; // Bonus for all character types
  }

  // Pattern scoring (0-25 points)
  // Penalize common patterns
  if (!/(.)\1{2,}/.test(password)) score += 5; // No repeated characters
  if (
    !/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password
    )
  ) {
    score += 10; // No sequential patterns
  }
  if (!/(password|123456|qwerty|admin|letmein)/i.test(password)) {
    score += 10; // No common passwords
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return { strength, score: Math.min(100, score) };
}

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(
      `Password must be at least ${requirements.minLength} characters long`
    );
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check numbers
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special characters
  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const { strength, score } = calculatePasswordStrength(password, requirements);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'strong':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get password strength label for UI
 */
export function getPasswordStrengthLabel(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}
