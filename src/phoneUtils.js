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
  // First check if this is a vanity number before converting letters
  const vanity = normalizeVanityUsIfApplicable(input);
  if (vanity) {
    return vanity;
  }
  
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
  // Handle vanity numbers first - they are always +1 followed by 10 digits
  if (raw.startsWith('+1') && raw.length === 12) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      const us = digits.slice(1);
      return `+1 (${us.slice(0,3)}) ${us.slice(3,6)}-${us.slice(6,10)}`;
    }
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

/**
 * Extract country code from a phone number in E164 format
 * @param {string} phoneNumber - Phone number in E164 format (e.g., +11234567890, +441234567890)
 * @returns {string|null} - Country code (e.g., "1", "44") or null if not found
 */
export function extractCountryCode(phoneNumber) {
  if (!phoneNumber) return null;
  
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 0) return null;
  
  // Common 1-digit country codes: US/Canada (+1)
  if (digits.startsWith('1') && digits.length >= 11) {
    return '1';
  }
  
  // Common 2-digit country codes
  const twoDigitCodes = ['44', '49', '91', '61', '86', '81', '33', '39', '34', '46', '47', '48', '31', '32', '41', '43', '45', '52', '55', '56', '57', '58', '60', '62', '63', '64', '65', '66', '82', '84', '90', '92', '93', '94', '95', '98'];
  for (const code of twoDigitCodes) {
    if (digits.startsWith(code)) {
      return code;
    }
  }
  
  // Common 3-digit country codes
  const threeDigitCodes = ['180', '186', '187', '188', '190', '193', '194', '195', '197', '198', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];
  for (const code of threeDigitCodes) {
    if (digits.startsWith(code)) {
      return code;
    }
  }
  
  // Fallback: try to extract first 1-3 digits as country code
  // This is a heuristic and may not be accurate for all countries
  if (digits.length >= 10) {
    // Try 2-digit code first
    if (digits.length >= 12) {
      return digits.slice(0, 2);
    }
    // Try 1-digit code
    if (digits.length >= 11) {
      return digits.slice(0, 1);
    }
  }
  
  return null;
}

/**
 * Extract area code for US phone numbers
 * @param {string} phoneNumber - Phone number in E164 format (e.g., +11234567890)
 * @returns {string|null} - Area code (e.g., "123") or null if not a US number or not found
 */
export function extractUSAreaCode(phoneNumber) {
  if (!phoneNumber) return null;
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  // US numbers start with 1 and have 11 digits total
  if (digits.startsWith('1') && digits.length === 11) {
    // Area code is digits 2-4 (after the country code "1")
    return digits.slice(1, 4);
  }
  
  // Handle 10-digit US numbers (without country code)
  if (digits.length === 10 && !phoneNumber.startsWith('+')) {
    // Area code is first 3 digits
    return digits.slice(0, 3);
  }
  
  return null;
}

/**
 * Get state(s) for a US area code
 * @param {string} areaCode - 3-digit area code (e.g., "212", "415")
 * @returns {string|null} - State name(s) or null if not found
 */
export function getStateFromAreaCode(areaCode) {
  if (!areaCode || areaCode.length !== 3) return null;
  
  // Comprehensive US area code to state mapping
  const areaCodeToState = {
    // Alabama
    '205': 'Alabama', '251': 'Alabama', '256': 'Alabama', '334': 'Alabama', '938': 'Alabama',
    // Alaska
    '907': 'Alaska',
    // Arizona
    '480': 'Arizona', '520': 'Arizona', '602': 'Arizona', '623': 'Arizona', '928': 'Arizona',
    // Arkansas
    '479': 'Arkansas', '501': 'Arkansas', '870': 'Arkansas',
    // California
    '209': 'California', '213': 'California', '310': 'California', '323': 'California', '408': 'California',
    '415': 'California', '424': 'California', '442': 'California', '510': 'California', '530': 'California',
    '559': 'California', '562': 'California', '619': 'California', '626': 'California', '628': 'California',
    '650': 'California', '657': 'California', '661': 'California', '669': 'California', '707': 'California',
    '714': 'California', '747': 'California', '760': 'California', '805': 'California', '818': 'California',
    '831': 'California', '858': 'California', '909': 'California', '916': 'California', '925': 'California',
    '949': 'California', '951': 'California',
    // Colorado
    '303': 'Colorado', '719': 'Colorado', '720': 'Colorado', '970': 'Colorado',
    // Connecticut
    '203': 'Connecticut', '475': 'Connecticut', '860': 'Connecticut', '959': 'Connecticut',
    // Delaware
    '302': 'Delaware',
    // District of Columbia
    '202': 'District of Columbia',
    // Florida
    '239': 'Florida', '305': 'Florida', '321': 'Florida', '352': 'Florida', '386': 'Florida',
    '407': 'Florida', '561': 'Florida', '689': 'Florida', '727': 'Florida', '754': 'Florida',
    '772': 'Florida', '786': 'Florida', '813': 'Florida', '850': 'Florida', '863': 'Florida',
    '904': 'Florida', '941': 'Florida', '954': 'Florida',
    // Georgia
    '229': 'Georgia', '404': 'Georgia', '470': 'Georgia', '478': 'Georgia', '678': 'Georgia',
    '706': 'Georgia', '762': 'Georgia', '770': 'Georgia', '912': 'Georgia',
    // Hawaii
    '808': 'Hawaii',
    // Idaho
    '208': 'Idaho', '986': 'Idaho',
    // Illinois
    '217': 'Illinois', '224': 'Illinois', '309': 'Illinois', '312': 'Illinois', '331': 'Illinois',
    '447': 'Illinois', '464': 'Illinois', '618': 'Illinois', '630': 'Illinois', '708': 'Illinois',
    '730': 'Illinois', '773': 'Illinois', '779': 'Illinois', '815': 'Illinois', '847': 'Illinois',
    '872': 'Illinois',
    // Indiana
    '219': 'Indiana', '260': 'Indiana', '317': 'Indiana', '463': 'Indiana', '574': 'Indiana',
    '765': 'Indiana', '812': 'Indiana', '930': 'Indiana',
    // Iowa
    '319': 'Iowa', '515': 'Iowa', '563': 'Iowa', '641': 'Iowa', '712': 'Iowa',
    // Kansas
    '316': 'Kansas', '620': 'Kansas', '785': 'Kansas', '913': 'Kansas',
    // Kentucky
    '270': 'Kentucky', '364': 'Kentucky', '502': 'Kentucky', '606': 'Kentucky', '859': 'Kentucky',
    // Louisiana
    '225': 'Louisiana', '318': 'Louisiana', '337': 'Louisiana', '504': 'Louisiana', '985': 'Louisiana',
    // Maine
    '207': 'Maine',
    // Maryland
    '240': 'Maryland', '301': 'Maryland', '410': 'Maryland', '443': 'Maryland', '667': 'Maryland',
    // Massachusetts
    '339': 'Massachusetts', '351': 'Massachusetts', '413': 'Massachusetts', '508': 'Massachusetts',
    '617': 'Massachusetts', '774': 'Massachusetts', '781': 'Massachusetts', '857': 'Massachusetts',
    '978': 'Massachusetts',
    // Michigan
    '231': 'Michigan', '248': 'Michigan', '269': 'Michigan', '313': 'Michigan', '517': 'Michigan',
    '586': 'Michigan', '616': 'Michigan', '734': 'Michigan', '810': 'Michigan', '906': 'Michigan',
    '947': 'Michigan', '989': 'Michigan',
    // Minnesota
    '218': 'Minnesota', '320': 'Minnesota', '507': 'Minnesota', '612': 'Minnesota', '651': 'Minnesota',
    '763': 'Minnesota', '952': 'Minnesota',
    // Mississippi
    '228': 'Mississippi', '601': 'Mississippi', '662': 'Mississippi', '769': 'Mississippi',
    // Missouri
    '314': 'Missouri', '417': 'Missouri', '573': 'Missouri', '636': 'Missouri', '660': 'Missouri',
    '816': 'Missouri',
    // Montana
    '406': 'Montana',
    // Nebraska
    '308': 'Nebraska', '402': 'Nebraska', '531': 'Nebraska',
    // Nevada
    '702': 'Nevada', '725': 'Nevada', '775': 'Nevada',
    // New Hampshire
    '603': 'New Hampshire',
    // New Jersey
    '201': 'New Jersey', '551': 'New Jersey', '609': 'New Jersey', '640': 'New Jersey', '732': 'New Jersey',
    '848': 'New Jersey', '856': 'New Jersey', '862': 'New Jersey', '908': 'New Jersey', '973': 'New Jersey',
    // New Mexico
    '505': 'New Mexico', '575': 'New Mexico',
    // New York
    '212': 'New York', '315': 'New York', '332': 'New York', '347': 'New York', '516': 'New York',
    '518': 'New York', '585': 'New York', '607': 'New York', '631': 'New York', '646': 'New York',
    '680': 'New York', '716': 'New York', '718': 'New York', '838': 'New York', '845': 'New York',
    '914': 'New York', '917': 'New York', '929': 'New York', '934': 'New York',
    // North Carolina
    '252': 'North Carolina', '336': 'North Carolina', '704': 'North Carolina', '743': 'North Carolina',
    '828': 'North Carolina', '910': 'North Carolina', '919': 'North Carolina', '980': 'North Carolina',
    '984': 'North Carolina',
    // North Dakota
    '701': 'North Dakota',
    // Ohio
    '216': 'Ohio', '220': 'Ohio', '234': 'Ohio', '326': 'Ohio', '330': 'Ohio', '380': 'Ohio',
    '419': 'Ohio', '440': 'Ohio', '513': 'Ohio', '567': 'Ohio', '614': 'Ohio', '740': 'Ohio',
    '937': 'Ohio',
    // Oklahoma
    '405': 'Oklahoma', '539': 'Oklahoma', '572': 'Oklahoma', '580': 'Oklahoma', '918': 'Oklahoma',
    // Oregon
    '458': 'Oregon', '503': 'Oregon', '541': 'Oregon', '971': 'Oregon',
    // Pennsylvania
    '215': 'Pennsylvania', '223': 'Pennsylvania', '267': 'Pennsylvania', '272': 'Pennsylvania',
    '412': 'Pennsylvania', '445': 'Pennsylvania', '484': 'Pennsylvania', '570': 'Pennsylvania',
    '610': 'Pennsylvania', '717': 'Pennsylvania', '724': 'Pennsylvania', '814': 'Pennsylvania',
    '878': 'Pennsylvania',
    // Rhode Island
    '401': 'Rhode Island',
    // South Carolina
    '803': 'South Carolina', '839': 'South Carolina', '843': 'South Carolina', '854': 'South Carolina',
    '864': 'South Carolina',
    // South Dakota
    '605': 'South Dakota',
    // Tennessee
    '423': 'Tennessee', '615': 'Tennessee', '629': 'Tennessee', '731': 'Tennessee', '865': 'Tennessee',
    '901': 'Tennessee', '931': 'Tennessee',
    // Texas
    '210': 'Texas', '214': 'Texas', '254': 'Texas', '281': 'Texas', '325': 'Texas', '346': 'Texas',
    '361': 'Texas', '409': 'Texas', '430': 'Texas', '432': 'Texas', '469': 'Texas', '512': 'Texas',
    '713': 'Texas', '726': 'Texas', '737': 'Texas', '806': 'Texas', '817': 'Texas', '830': 'Texas',
    '832': 'Texas', '903': 'Texas', '915': 'Texas', '936': 'Texas', '940': 'Texas', '945': 'Texas',
    '956': 'Texas', '972': 'Texas', '979': 'Texas',
    // Utah
    '385': 'Utah', '435': 'Utah', '801': 'Utah',
    // Vermont
    '802': 'Vermont',
    // Virginia
    '276': 'Virginia', '434': 'Virginia', '540': 'Virginia', '571': 'Virginia', '703': 'Virginia',
    '757': 'Virginia', '804': 'Virginia',
    // Washington
    '206': 'Washington', '253': 'Washington', '360': 'Washington', '425': 'Washington', '509': 'Washington',
    '564': 'Washington',
    // West Virginia
    '304': 'West Virginia', '681': 'West Virginia',
    // Wisconsin
    '262': 'Wisconsin', '414': 'Wisconsin', '534': 'Wisconsin', '608': 'Wisconsin', '715': 'Wisconsin',
    '920': 'Wisconsin',
    // Wyoming
    '307': 'Wyoming',
    // US Territories and Special Numbers
    '340': 'US Virgin Islands', '670': 'Northern Mariana Islands', '671': 'Guam', '684': 'American Samoa',
    // Toll-free and special services
    '800': 'Toll-free', '833': 'Toll-free', '844': 'Toll-free', '855': 'Toll-free', '866': 'Toll-free',
    '877': 'Toll-free', '888': 'Toll-free',
    // Canadian area codes (some overlap with US)
    '204': 'Manitoba, Canada', '226': 'Ontario, Canada', '236': 'British Columbia, Canada',
    '249': 'Ontario, Canada', '250': 'British Columbia, Canada', '289': 'Ontario, Canada',
    '306': 'Saskatchewan, Canada', '343': 'Ontario, Canada', '365': 'Ontario, Canada',
    '367': 'Quebec, Canada', '368': 'Alberta, Canada', '403': 'Alberta, Canada',
    '416': 'Ontario, Canada', '418': 'Quebec, Canada', '431': 'Manitoba, Canada',
    '437': 'Ontario, Canada', '438': 'Quebec, Canada', '450': 'Quebec, Canada',
    '467': 'Ontario, Canada', '468': 'Quebec, Canada', '474': 'Saskatchewan, Canada',
    '506': 'New Brunswick, Canada', '514': 'Quebec, Canada', '519': 'Ontario, Canada',
    '548': 'Ontario, Canada', '579': 'Quebec, Canada', '581': 'Quebec, Canada',
    '587': 'Alberta, Canada', '604': 'British Columbia, Canada', '613': 'Ontario, Canada',
    '639': 'Saskatchewan, Canada', '647': 'Ontario, Canada', '672': 'British Columbia, Canada',
    '705': 'Ontario, Canada', '709': 'Newfoundland and Labrador, Canada', '742': 'Ontario, Canada',
    '753': 'Ontario, Canada', '778': 'British Columbia, Canada', '782': 'Nova Scotia, Canada',
    '807': 'Ontario, Canada', '819': 'Quebec, Canada', '825': 'Alberta, Canada',
    '867': 'Yukon/Northwest Territories/Nunavut, Canada', '873': 'Quebec, Canada',
    '902': 'Nova Scotia/Prince Edward Island, Canada', '905': 'Ontario, Canada',
    '942': 'Alberta, Canada'
  };
  
  return areaCodeToState[areaCode] || null;
}


