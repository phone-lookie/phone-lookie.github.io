/**
 * Runtime configuration backed by localStorage.
 *
 * We expose dynamic getters so `config.TWILIO_*` and `config.TELNYX_*` always reflects
 * the latest values saved in localStorage.
 */

const STORAGE_KEYS = {
  TWILIO_ACCOUNT_SID: 'twilioAccountSid',
  TWILIO_AUTH_TOKEN: 'twilioAuthToken',
  TELNYX_API_KEY: 'telnyxApiKey'
};

const config = {};

Object.defineProperties(config, {
  TWILIO_ACCOUNT_SID: {
    get() {
      if (typeof window === 'undefined') return '';
      // Check localStorage first
      let stored = window.localStorage.getItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID);
      if (stored) return stored;
      
      // Fall back to environment variable (build-time injection from .env file)
      const envValue = process.env.REACT_APP_TWILIO_ACCOUNT_SID || '';
      if (envValue && envValue !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        // Auto-populate localStorage with .env value if it exists and is not a placeholder
        console.log('📥 Importing Twilio Account SID from .env file');
        window.localStorage.setItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID, envValue);
        return envValue;
      }
      return '';
    }
  },
  TWILIO_AUTH_TOKEN: {
    get() {
      if (typeof window === 'undefined') return '';
      let stored = window.localStorage.getItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN);
      if (stored) return stored;
      
      const envValue = process.env.REACT_APP_TWILIO_AUTH_TOKEN || '';
      if (envValue && envValue !== 'your_twilio_auth_token_here') {
        console.log('📥 Importing Twilio Auth Token from .env file');
        window.localStorage.setItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN, envValue);
        return envValue;
      }
      return '';
    }
  },
  TELNYX_API_KEY: {
    get() {
      if (typeof window === 'undefined') return '';
      let stored = window.localStorage.getItem(STORAGE_KEYS.TELNYX_API_KEY);
      if (stored) return stored;
      
      const envValue = process.env.REACT_APP_TELNYX_API_KEY || '';
      if (envValue && envValue !== 'your_telnyx_api_key_here') {
        console.log('📥 Importing Telnyx API Key from .env file');
        window.localStorage.setItem(STORAGE_KEYS.TELNYX_API_KEY, envValue);
        return envValue;
      }
      return '';
    }
  }
});

export function setTwilioCredentials(accountSid, authToken) {
  if (typeof window === 'undefined') return;
  if (accountSid != null) {
    window.localStorage.setItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID, accountSid);
  }
  if (authToken != null) {
    window.localStorage.setItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN, authToken);
  }
}

export function clearTwilioCredentials() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID);
  window.localStorage.removeItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN);
}

export function setTelnyxCredentials(apiKey) {
  if (typeof window === 'undefined') return;
  if (apiKey != null) {
    window.localStorage.setItem(STORAGE_KEYS.TELNYX_API_KEY, apiKey);
  }
}

export function clearTelnyxCredentials() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.TELNYX_API_KEY);
}

export function importEnvCredentials() {
  if (typeof window === 'undefined') return;
  
  // Import Twilio credentials if not in localStorage
  if (!window.localStorage.getItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID)) {
    const sid = process.env.REACT_APP_TWILIO_ACCOUNT_SID || '';
    if (sid && sid !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      console.log('📥 Importing Twilio Account SID from .env file');
      window.localStorage.setItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID, sid);
    }
  }
  
  if (!window.localStorage.getItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN)) {
    const token = process.env.REACT_APP_TWILIO_AUTH_TOKEN || '';
    if (token && token !== 'your_twilio_auth_token_here') {
      console.log('📥 Importing Twilio Auth Token from .env file');
      window.localStorage.setItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN, token);
    }
  }
  
  // Import Telnyx credentials if not in localStorage
  if (!window.localStorage.getItem(STORAGE_KEYS.TELNYX_API_KEY)) {
    const key = process.env.REACT_APP_TELNYX_API_KEY || '';
    if (key && key !== 'your_telnyx_api_key_here') {
      console.log('📥 Importing Telnyx API Key from .env file');
      window.localStorage.setItem(STORAGE_KEYS.TELNYX_API_KEY, key);
    }
  }
}

export default config;