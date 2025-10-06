// Utility functions to normalize and format phone numbers

const LETTER_TO_DIGIT = {
  A: '2', B: '2', C: '2',
  D: '3', E: '3', F: '3',
  G: '4', H: '4', I: '4',
  J: '5', K: '5', L: '5',
  M: '6', N: '6', O: '6',
  P: '7', Q: '7', R: '7', S: '7',
  T: '8', U: '8', V: '8',
  W: '9', X: '9', Y: '9', Z: '9'
};

export function convertAlphaToDigits(value) {
  return (value || '').replace(/[A-Za-z]/g, (ch) => LETTER_TO_DIGIT[ch.toUpperCase()] || ch);
}

export function stripAllowedPunctuation(value) {
  // Keep plus if it is the very first character; strip all -, (, ), spaces, [, ]
  if (!value) return '';
  const firstPlus = value[0] === '+' ? '+' : '';
  const rest = value.slice(firstPlus ? 1 : 0).replace(/[\-() \[\]]/g, '');
  return firstPlus + rest;
}

export function normalizeToE164Candidate(input) {
  // 1) convert alpha to digits
  let value = convertAlphaToDigits(input);
  // 2) strip allowed punctuation
  value = stripAllowedPunctuation(value);
  // 3) keep only leading + and digits
  const hasPlus = value.startsWith('+');
  let digits = value.replace(/\D/g, '');
  // 4) if has plus, keep it
  return hasPlus ? ('+' + digits) : digits;
}

function mapLettersToDigits(text) {
  return (text || '').replace(/[A-Za-z]/g, (ch) => LETTER_TO_DIGIT[ch.toUpperCase()] || '');
}

function normalizeVanityUsIfApplicable(originalInput) {
  const hasLetters = /[A-Za-z]/.test(originalInput || '');
  if (!hasLetters) return null;
  const m = (originalInput || '').match(/^\+?1?[^0-9]*([0-9]{3})/);
  if (!m) return null;
  const area = m[1];
  const lettersOnly = (originalInput || '').replace(/[^A-Za-z]/g, '');
  if (lettersOnly.length < 7) return null;
  
  // For vanity numbers, we need exactly 7 digits after the area code
  // Take first 3 letters + next 4 letters (not last 4)
  const first3 = lettersOnly.slice(0, 3);
  const next4 = lettersOnly.slice(3, 7);
  const local7 = mapLettersToDigits(first3) + mapLettersToDigits(next4);
  if (local7.length !== 7) return null;
  return '+1' + area + local7;
}

export function formatInternationalFlexible(raw) {
  // First try vanity number conversion for US numbers with letters
  const vanity = normalizeVanityUsIfApplicable(raw);
  if (vanity) {
    return formatInternationalFlexible(vanity);
  }
  
  // Special handling for +18 and +180 patterns before normalization
  if (raw.startsWith('+18')) {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('180') && digits.length >= 13) {
      const rest10 = digits.slice(3, 13);
      return `+180 (${rest10.slice(0,3)}) ${rest10.slice(3,6)}-${rest10.slice(6,10)}`;
    }
    if (digits.startsWith('180') && digits.length >= 6) {
      // Progressive formatting for +180 as user types
      const rest = digits.slice(3);
      if (rest.length <= 3) return `+180 ${rest}`;
      if (rest.length <= 6) return `+180 (${rest.slice(0,3)}) ${rest.slice(3)}`;
      if (rest.length <= 10) return `+180 (${rest.slice(0,3)}) ${rest.slice(3,6)}-${rest.slice(6)}`;
      return `+180 (${rest.slice(0,3)}) ${rest.slice(3,6)}-${rest.slice(6,10)}`;
    }
    if (digits.startsWith('18') && digits.length >= 12) {
      const rest10 = digits.slice(2, 12);
      return `+18 (${rest10.slice(0,3)}) ${rest10.slice(3,6)}-${rest10.slice(6,10)}`;
    }
    if (digits.startsWith('18') && digits.length >= 5) {
      // Progressive formatting for +18 as user types
      const rest = digits.slice(2);
      if (rest.length <= 3) return `+18 ${rest}`;
      if (rest.length <= 6) return `+18 (${rest.slice(0,3)}) ${rest.slice(3)}`;
      if (rest.length <= 10) return `+18 (${rest.slice(0,3)}) ${rest.slice(3,6)}-${rest.slice(6)}`;
      return `+18 (${rest.slice(0,3)}) ${rest.slice(3,6)}-${rest.slice(6,10)}`;
    }
  }
  
  // Accept: +<cc><nsn> with 11-14 digits total, or plain digits 10-14
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  // If US/Canada +1 or leading 1 with 11 total, format NANP
  if (hasPlus && digits.startsWith('1')) {
    const us = digits.slice(1);
    if (us.length <= 3) return `+1 ${us}`;
    if (us.length <= 6) return `+1 (${us.slice(0,3)}) ${us.slice(3)}`;
    return `+1 (${us.slice(0,3)}) ${us.slice(3,6)}-${us.slice(6,10)}`;
  }
  if (!hasPlus && digits.startsWith('1') && digits.length >= 11) {
    const us = digits.slice(1, 11);
    if (us.length <= 3) return `+1 ${us}`;
    if (us.length <= 6) return `+1 (${us.slice(0,3)}) ${us.slice(3)}`;
    return `+1 (${us.slice(0,3)}) ${us.slice(3,6)}-${us.slice(6,10)}`;
  }

  // If plain 10-digit North America without + or leading 1
  if (!hasPlus && digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
  }

  // If plain 11-digit number starting with 1 (US/Canada)
  if (!hasPlus && digits.length === 11 && digits.startsWith('1')) {
    const us = digits.slice(1);
    return `+1 (${us.slice(0,3)}) ${us.slice(3,6)}-${us.slice(6,10)}`;
  }

  // If plain 12+ digit number, try to format as international
  if (!hasPlus && digits.length >= 12) {
    // Try common country codes
    if (digits.startsWith('44') && digits.length >= 12) {
      const rest = digits.slice(2);
      if (rest.length <= 3) return `+44 ${rest}`;
      if (rest.length <= 6) return `+44 ${rest.slice(0,3)} ${rest.slice(3)}`;
      if (rest.length <= 10) return `+44 ${rest.slice(0,2)} ${rest.slice(2,6)} ${rest.slice(6)}`;
      return `+44 ${rest.slice(0,2)} ${rest.slice(2,6)} ${rest.slice(6,10)}${rest.length>10? ' ' + rest.slice(10) : ''}`;
    }
    if (digits.startsWith('49') && digits.length >= 12) {
      const rest = digits.slice(2);
      if (rest.length <= 3) return `+49 ${rest}`;
      if (rest.length <= 6) return `+49 ${rest.slice(0,3)} ${rest.slice(3)}`;
      if (rest.length <= 10) return `+49 ${rest.slice(0,3)} ${rest.slice(3,6)} ${rest.slice(6)}`;
      return `+49 ${rest.slice(0,3)} ${rest.slice(3,7)} ${rest.slice(7,11)}${rest.length>11? ' ' + rest.slice(11) : ''}`;
    }
    if (digits.startsWith('91') && digits.length >= 12) {
      const rest = digits.slice(2);
      if (rest.length <= 5) return `+91 ${rest}`;
      return `+91 ${rest.slice(0,5)} ${rest.slice(5)}`;
    }
    if (digits.startsWith('61') && digits.length >= 12) {
      const rest = digits.slice(2);
      if (rest.length <= 1) return `+61 ${rest}`;
      if (rest.length <= 5) return `+61 ${rest.slice(0,1)} ${rest.slice(1)}`;
      if (rest.length <= 9) return `+61 ${rest.slice(0,1)} ${rest.slice(1,5)} ${rest.slice(5)}`;
      return `+61 ${rest.slice(0,1)} ${rest.slice(1,5)} ${rest.slice(5,9)}${rest.length>9? ' ' + rest.slice(9) : ''}`;
    }
    // Generic international formatting for unknown codes
    if (digits.length >= 12) {
      return `+${digits}`;
    }
  }

  // Country code specific grouping (expandable)
  if (hasPlus) {
    // Special handling for +18 and +180 where next 10 digits should be grouped NANP-style
    if (digits.startsWith('180') && digits.length >= 13) {
      const rest10 = digits.slice(3, 13);
      return `+180 (${rest10.slice(0,3)}) ${rest10.slice(3,6)}-${rest10.slice(6,10)}`;
    }
    if (digits.startsWith('18') && digits.length >= 12) {
      const rest10 = digits.slice(2, 12);
      return `+18 (${rest10.slice(0,3)}) ${rest10.slice(3,6)}-${rest10.slice(6,10)}`;
    }
    const cc2 = digits.slice(0,2);
    const cc3 = digits.slice(0,3);
    // UK (+44): common grouping +44 20 7123 4567 or +44 7712 345678
    if (cc2 === '44') {
      const rest = digits.slice(2);
      if (rest.length <= 3) return `+44 ${rest}`;
      if (rest.length <= 6) return `+44 ${rest.slice(0,3)} ${rest.slice(3)}`;
      if (rest.length <= 10) return `+44 ${rest.slice(0,2)} ${rest.slice(2,6)} ${rest.slice(6)}`;
      return `+44 ${rest.slice(0,2)} ${rest.slice(2,6)} ${rest.slice(6,10)}${rest.length>10? ' ' + rest.slice(10) : ''}`;
    }
    // Germany (+49): +49 30 123456 or +49 1512 3456789
    if (cc2 === '49') {
      const rest = digits.slice(2);
      if (rest.length <= 3) return `+49 ${rest}`;
      if (rest.length <= 6) return `+49 ${rest.slice(0,3)} ${rest.slice(3)}`;
      if (rest.length <= 10) return `+49 ${rest.slice(0,3)} ${rest.slice(3,6)} ${rest.slice(6)}`;
      return `+49 ${rest.slice(0,3)} ${rest.slice(3,7)} ${rest.slice(7,11)}${rest.length>11? ' ' + rest.slice(11) : ''}`;
    }
    // India (+91): +91 98765 43210
    if (cc2 === '91') {
      const rest = digits.slice(2);
      if (rest.length <= 5) return `+91 ${rest}`;
      return `+91 ${rest.slice(0,5)} ${rest.slice(5)}`;
    }
    // Australia (+61): +61 4 1234 5678 or +61 2 1234 5678
    if (cc2 === '61') {
      const rest = digits.slice(2);
      if (rest.length <= 1) return `+61 ${rest}`;
      if (rest.length <= 5) return `+61 ${rest.slice(0,1)} ${rest.slice(1)}`;
      if (rest.length <= 9) return `+61 ${rest.slice(0,1)} ${rest.slice(1,5)} ${rest.slice(5)}`;
      return `+61 ${rest.slice(0,1)} ${rest.slice(1,5)} ${rest.slice(5,9)}${rest.length>9? ' ' + rest.slice(9) : ''}`;
    }
    // Canada handled by +1 above

    // Fallback: leave ungrouped for unknown codes
    return `+${digits}`;
  }

  // Fallback: return digits as-is
  return digits;
}

export function normalizeForLookup(input) {
  // Heuristic for US vanity numbers with letters
  const vanity = normalizeVanityUsIfApplicable(input);
  if (vanity) return vanity;
  const raw = normalizeToE164Candidate(input);
  const digits = raw.replace(/\D/g, '');
  
  // If 10 digits without country code, assume US and prepend +1
  if (digits.length === 10) {
    return '+1' + digits;
  }
  
  return '+' + digits;
}


