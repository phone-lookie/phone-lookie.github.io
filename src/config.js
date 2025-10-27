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
      if (envValue) {
        // Auto-populate localStorage with .env value if it exists
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
      if (envValue) {
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
      if (envValue) {
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

export default config;