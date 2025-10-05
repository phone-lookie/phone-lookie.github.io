/**
 * Runtime configuration backed by localStorage.
 *
 * We expose dynamic getters so `config.TWILIO_*` always reflects
 * the latest values saved in localStorage.
 */

const STORAGE_KEYS = {
  TWILIO_ACCOUNT_SID: 'twilioAccountSid',
  TWILIO_AUTH_TOKEN: 'twilioAuthToken'
};

const config = {};

Object.defineProperties(config, {
  TWILIO_ACCOUNT_SID: {
    get() {
      if (typeof window === 'undefined') return '';
      return window.localStorage.getItem(STORAGE_KEYS.TWILIO_ACCOUNT_SID) || '';
    }
  },
  TWILIO_AUTH_TOKEN: {
    get() {
      if (typeof window === 'undefined') return '';
      return window.localStorage.getItem(STORAGE_KEYS.TWILIO_AUTH_TOKEN) || '';
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

export default config;