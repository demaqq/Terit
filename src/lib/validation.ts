import { CompanyProfile } from '../types/inventory';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 256) return false;
  return EMAIL_REGEX.test(trimmed);
};

/**
 * Validates Ethiopian (+251..., 09..., 07..., 011...) and international phone numbers.
 * Accepts digits, spaces, parentheses, dashes, and optional leading +.
 */
export const isValidPhone = (phone: string): boolean => {
  const trimmed = phone.trim();
  if (!trimmed || trimmed.length > 64) return false;
  // Must not contain letters
  if (/[a-zA-Z]/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return false;
  // Reject obvious synthetic filler such as all identical digits (e.g., 0000000000 / 1111111111)
  if (/^(\d)\1+$/.test(digits)) return false;
  // If local Ethiopian leading 0, must be 10 digits (09..., 07..., 01...)
  if (trimmed.startsWith('0') && digits.length !== 10) return false;
  // If +251 country code, must be 12 digits (+251 9XX XXX XXX / +251 11 XXX XXXX)
  if (digits.startsWith('251') && digits.length !== 12) return false;
  return true;
};

export const isValidAddress = (city?: string, streetOrSubcity?: string): boolean => {
  const cleanCity = (city || '').trim();
  const cleanStreet = (streetOrSubcity || '').trim();
  return cleanCity.length >= 2 && cleanStreet.length >= 3;
};

export interface ProfileCriteriaResult {
  valid: boolean;
  missingFields: ('companyName' | 'contactName' | 'phone' | 'email' | 'city' | 'address')[];
}

export const validateCompanyProfileCriteria = (
  profile?: Partial<CompanyProfile> | null
): ProfileCriteriaResult => {
  const missingFields: ProfileCriteriaResult['missingFields'] = [];
  if (!profile?.companyName || profile.companyName.trim().length < 2) {
    missingFields.push('companyName');
  }
  if (!profile?.contactName || profile.contactName.trim().length < 2) {
    missingFields.push('contactName');
  }
  if (!isValidPhone(profile?.phone || '')) {
    missingFields.push('phone');
  }
  if (!isValidEmail(profile?.email || '')) {
    missingFields.push('email');
  }
  if (!profile?.city || profile.city.trim().length < 2) {
    missingFields.push('city');
  }
  const streetOrSubcity = profile?.subcity || profile?.address || '';
  if (streetOrSubcity.trim().length < 3) {
    missingFields.push('address');
  }
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const isCompanyProfileComplete = (
  profile?: Partial<CompanyProfile> | null
): boolean => validateCompanyProfileCriteria(profile).valid;
