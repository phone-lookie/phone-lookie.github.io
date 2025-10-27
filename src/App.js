import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './App.css';
import { convertAlphaToDigits, normalizeToE164Candidate, formatInternationalFlexible, normalizeForLookup } from './phoneUtils';
import config, { setTwilioCredentials, clearTwilioCredentials, setTelnyxCredentials, clearTelnyxCredentials, importEnvCredentials } from './config';
import VERSION_INFO from './version';

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lookupHistory, setLookupHistory] = useState([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [telnyxApiKey, setTelnyxApiKey] = useState('');
  const [credentialsVersion, setCredentialsVersion] = useState(0);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  
  const resultsModalRef = useRef(null);
  const historyModalRef = useRef(null);
  const phoneInputRef = useRef(null);
  const buttonRefs = useRef({});

  // PWA Installation Handling
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    });

    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setShowInstallButton(false);
    }

    // Service Worker Registration with Update Handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
          
          // Check for updates immediately
          registration.update();
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is installed and waiting
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
        }
      });

      // Handle controller change (when new service worker takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Load history from localStorage
    const savedHistory = localStorage.getItem('lookupHistory');
    if (savedHistory) {
      setLookupHistory(JSON.parse(savedHistory));
    }

    // Prevent mobile zoom and touch gestures
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventScroll = (e) => {
      // Prevent overscroll bounce on iOS
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault();
      }
    };

    const preventTouchMove = (e) => {
      // Prevent default touch behaviors that could cause zooming or scrolling
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Cleanup function
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('gesturestart', (e) => e.preventDefault());
      document.removeEventListener('gesturechange', (e) => e.preventDefault());
      document.removeEventListener('gestureend', (e) => e.preventDefault());
      document.removeEventListener('touchend', (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      });
    };

    // Initialize settings fields from localStorage-backed config
    // Will automatically fall back to .env values if localStorage is empty
    try {
      // First, try to import from .env if localStorage is empty
      importEnvCredentials();
      
      // Now read the values (from localStorage or .env)
      const twilioSid = config.TWILIO_ACCOUNT_SID || '';
      const twilioToken = config.TWILIO_AUTH_TOKEN || '';
      const telnyxKey = config.TELNYX_API_KEY || '';
      
      setAccountSid(twilioSid);
      setAuthToken(twilioToken);
      setTelnyxApiKey(telnyxKey);
      
      // Check if at least one service is configured after potential .env import
      const hasCredentials = checkCredentials();
      if (!hasCredentials) {
        console.warn('⚠️  No API credentials configured. Please configure at least one service in Settings.');
        console.log('Available services: Twilio or Telnyx');
        console.log('You can:');
        console.log('  1. Create a .env file with your credentials');
        console.log('  2. Click the gear icon to configure in Settings');
      } else {
        // Log which services are configured
        const services = getAvailableServices();
        console.log('✅ API services configured:', services.join(', '));
      }
    } catch (e) {
      console.error('Error initializing credentials:', e);
    }

    // Global keyboard event handler
    const handleGlobalKeyDown = (e) => {
      // Don't interfere if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle Enter key for lookup
      if (e.key === 'Enter') {
        e.preventDefault();
        performLookup();
        return;
      }

      // Handle Backspace/Delete for removing last digit
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (phoneNumber.length > 0) {
          // Extract digits from current phone number
          const currentDigits = phoneNumber.replace(/\D/g, '');
          if (currentDigits.length > 0) {
            // Remove last digit
            const newDigits = currentDigits.slice(0, -1);
            if (newDigits.length === 0) {
              // No more digits, clear the input
              setPhoneNumber('');
            } else {
              // Format the remaining digits
              const candidate = normalizeToE164Candidate(newDigits);
              const formatted = candidate ? formatInternationalFlexible(candidate) : newDigits;
              setPhoneNumber(formatted);
            }
          } else {
            // No digits found, clear the input
            setPhoneNumber('');
          }
        }
        return;
      }

      // Handle number keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        simulateButtonClick(e.key);
        return;
      }

      // Handle plus key
      if (e.key === '+') {
        e.preventDefault();
        simulateButtonClick('0'); // 0 button shows '+' in keypad
        return;
      }

      // Handle alpha characters (convert to numbers)
      if (e.key.match(/[a-zA-Z]/)) {
        e.preventDefault();
        const alphaToDigit = {
          'a': '2', 'b': '2', 'c': '2',
          'd': '3', 'e': '3', 'f': '3',
          'g': '4', 'h': '4', 'i': '4',
          'j': '5', 'k': '5', 'l': '5',
          'm': '6', 'n': '6', 'o': '6',
          'p': '7', 'q': '7', 'r': '7', 's': '7',
          't': '8', 'u': '8', 'v': '8',
          'w': '9', 'x': '9', 'y': '9', 'z': '9'
        };
        const digit = alphaToDigit[e.key.toLowerCase()];
        if (digit) {
          simulateButtonClick(digit);
        }
        return;
      }
    };

    // Function to simulate button click visual effect
    const simulateButtonClick = (key) => {
      const buttonRef = buttonRefs.current[key];
      if (buttonRef) {
        // Focus the button first to trigger focus styles
        buttonRef.focus();
        
        // Programmatically click the button to trigger its natural UI behavior
        buttonRef.click();
        
        // Blur after a short delay to remove focus
        setTimeout(() => {
          buttonRef.blur();
        }, 150);
      }
    };

    // Add global event listener
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [phoneNumber]);

  // Handle update banner visibility
  useEffect(() => {
    if (updateAvailable) {
      document.body.classList.add('update-available');
    } else {
      document.body.classList.remove('update-available');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('update-available');
    };
  }, [updateAvailable]);

  // Check credentials - require either Twilio or Telnyx
  const checkCredentials = () => {
    const hasTwilio = config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN;
    const hasTelnyx = config.TELNYX_API_KEY;
    
    return hasTwilio || hasTelnyx;
  };

  const getAvailableServices = () => {
    const services = [];
    if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
      services.push('twilio');
    }
    if (config.TELNYX_API_KEY) {
      services.push('telnyx');
    }
    return services;
  };

  // Phone number formatting
  const formatPhoneNumberInput = (value) => {
    const candidate = normalizeToE164Candidate(value);
    return formatInternationalFlexible(candidate);
  };

  const isValidPhoneNumber = (phoneNumber) => {
    const hasPlus = phoneNumber.startsWith('+');
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (hasPlus) {
      // Allow 10-15 digits total for international numbers
      return digits.length >= 10 && digits.length <= 15;
    } else {
      // Allow 10-11 digits for US numbers without +
      return digits.length >= 10 && digits.length <= 11;
    }
  };

  const convertAlphaToDigits = (value) => {
    const map = {
      A: '2', B: '2', C: '2',
      D: '3', E: '3', F: '3',
      G: '4', H: '4', I: '4',
      J: '5', K: '5', L: '5',
      M: '6', N: '6', O: '6',
      P: '7', Q: '7', R: '7', S: '7',
      T: '8', U: '8', V: '8',
      W: '9', X: '9', Y: '9', Z: '9'
    };
    return (value || '').replace(/[A-Za-z]/g, (ch) => map[ch.toUpperCase()] || ch);
  };

  const formatPhoneNumber = (number) => {
    const hasPlus = number.startsWith('+');
    const digits = number.replace(/\D/g, '');
    if (hasPlus) {
      const countryCode = digits.slice(0, -10);
      const n = digits.slice(-10);
      return `+${countryCode} (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneInput = (e) => {
    const current = e.target.value || '';
    const candidate = normalizeToE164Candidate(current);
    const formatted = candidate ? formatInternationalFlexible(candidate) : '';
    setPhoneNumber(formatted);
  };

  const handlePhoneBlur = () => {
    if (phoneNumber) {
      setPhoneNumber(formatPhoneNumberInput(phoneNumber));
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    const candidate = normalizeToE164Candidate(pasted);
    const formatted = candidate ? formatInternationalFlexible(candidate) : '';
    setPhoneNumber(formatted);
  };

  const clearPhoneInput = () => {
    setPhoneNumber('');
    phoneInputRef.current?.focus();
  };

  const showError = (message) => {
    // This will be handled by the modal component
    console.error(message);
  };

  const performLookup = async () => {
    const processedNumber = normalizeForLookup(phoneNumber);

    setIsViewingHistory(false);

    if (!checkCredentials()) {
      showError('Please configure at least one API service (Twilio or Telnyx) in Settings.');
      return;
    }

    if (!isValidPhoneNumber(processedNumber)) {
      showError('Please enter a valid phone number:\n' +
               '• US numbers: (XXX) XXX-XXXX\n' +
               '• International: +[country code] (XXX) XXX-XXXX\n' +
               'Examples:\n' +
               '• +1 (123) 456-7890\n' +
               '• +44 (123) 456-7890');
      return;
    }

    try {
      const availableServices = getAvailableServices();
      const results = {
        services: availableServices,
        data: {}
      };

      // Try to fetch from all available services in parallel
      const promises = [];
      
      if (availableServices.includes('twilio')) {
        promises.push(
          fetchTwilioLookupData(processedNumber)
            .then(data => {
              results.data.twilio = data;
              console.log('Twilio data:', data);
            })
            .catch(err => {
              console.error('Twilio error:', err);
              results.data.twilio = { error: err.message };
            })
        );
      }

      if (availableServices.includes('telnyx')) {
        promises.push(
          fetchTelnyxLookupData(processedNumber)
            .then(data => {
              results.data.telnyx = data;
              console.log('Telnyx data:', data);
            })
            .catch(err => {
              console.error('Telnyx error:', err);
              results.data.telnyx = { error: err.message };
            })
        );
      }

      await Promise.all(promises);
      
      saveToHistory(processedNumber, results);
      setResultsData(results);
      setIsResultsOpen(true);
    } catch (error) {
      console.error('Lookup error:', error);
      let errorMessage = 'An error occurred while looking up the phone number.';
      
      if (error.message.includes('401')) {
        errorMessage = 'Authentication error: Invalid Twilio credentials. Please contact the administrator.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Authorization error: Insufficient permissions to perform the lookup.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Twilio service error. Please try again later.';
      }
      
      showError(errorMessage);
    }
  };

  const handleOpenSettings = () => {
    // Try to import from .env before opening settings
    importEnvCredentials();
    
    // Load from localStorage (which may have been populated by importEnvCredentials)
    setAccountSid(config.TWILIO_ACCOUNT_SID || '');
    setAuthToken(config.TWILIO_AUTH_TOKEN || '');
    setTelnyxApiKey(config.TELNYX_API_KEY || '');
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setTwilioCredentials(accountSid.trim(), authToken.trim());
    setTelnyxCredentials(telnyxApiKey.trim());
    setCredentialsVersion(v => v + 1);
    setIsSettingsOpen(false);
  };

  const handleClearSettings = () => {
    clearTwilioCredentials();
    clearTelnyxCredentials();
    setAccountSid('');
    setAuthToken('');
    setTelnyxApiKey('');
    setCredentialsVersion(v => v + 1);
  };

  const fetchTwilioLookupData = async (phoneNumber) => {
    const url = new URL(`https://lookups.twilio.com/v2/PhoneNumbers/${phoneNumber}`);
    url.searchParams.set('Fields', 'caller_name,line_type_intelligence,sim_swap,identity_match');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`)
      }
    });

    if (!response.ok) {
      throw new Error(response.status.toString());
    }

    return response.json();
  };

  const fetchTelnyxLookupData = async (phoneNumber) => {
    const url = `https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Telnyx error: ${response.status}`);
    }

    return response.json();
  };

  const saveToHistory = (phoneNumber, data) => {
    const newHistoryItem = {
      phoneNumber,
      data,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newHistoryItem, ...lookupHistory.slice(0, 49)];
    setLookupHistory(updatedHistory);
    localStorage.setItem('lookupHistory', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setLookupHistory([]);
    localStorage.removeItem('lookupHistory');
  };

  const exportHistoryToCSV = () => {
    if (lookupHistory.length === 0) return;
    
    const headers = ['Phone Number', 'Carrier', 'Type', 'Country Code', 'National Format', 'Caller Name', 'Caller Type', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...lookupHistory.map(item => {
        const carrier = item.data?.carrier?.name || item.data?.line_type_intelligence?.carrier_name || 'N/A';
        const type = item.data?.carrier?.type || item.data?.line_type_intelligence?.type || 'N/A';
        const countryCode = item.data?.country_code || 'N/A';
        const nationalFormat = item.data?.national_format || 'N/A';
        const callerName = item.data?.caller_name?.caller_name || 'N/A';
        const callerType = item.data?.caller_name?.caller_type || 'N/A';
        const timestamp = new Date(item.timestamp).toLocaleString();
        const phoneNumber = formatPhoneNumber(item.phoneNumber);
        
        return [phoneNumber, carrier, type, countryCode, nationalFormat, callerName, callerType, timestamp]
          .map(field => `"${field}"`).join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `phone-lookup-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openJsonModal = (data) => {
    setJsonData(data);
    setIsJsonModalOpen(true);
  };

  const handleUpdateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
    setWaitingWorker(null);
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  // Filter history based on search query
  const filterHistory = (item) => {
    if (!historySearchQuery) return true;
    
    const query = historySearchQuery.toLowerCase().trim();
    
    // Search in phone number
    if (item.phoneNumber.toLowerCase().includes(query)) return true;
    
    // Search in caller name
    const callerName = item.data?.caller_name?.caller_name?.toLowerCase() || '';
    if (callerName.includes(query)) return true;
    
    // Search in carrier name
    const carrier = (item.data?.carrier?.name || item.data?.line_type_intelligence?.carrier_name || '').toLowerCase();
    if (carrier.includes(query)) return true;
    
    return false;
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performLookup();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      // Handle backspace directly
      if (phoneNumber.length > 0) {
        // Extract digits from current phone number
        const currentDigits = phoneNumber.replace(/\D/g, '');
        if (currentDigits.length > 0) {
          // Remove last digit
          const newDigits = currentDigits.slice(0, -1);
          if (newDigits.length === 0) {
            // No more digits, clear the input
            setPhoneNumber('');
          } else {
            // Format the remaining digits
            const candidate = normalizeToE164Candidate(newDigits);
            const formatted = candidate ? formatInternationalFlexible(candidate) : newDigits;
            setPhoneNumber(formatted);
          }
        } else {
          // No digits found, clear the input
          setPhoneNumber('');
        }
      }
    }
  };

  const handleKeypadClick = (value) => {
    if (value === '+') {
      if (!phoneNumber.startsWith('+')) {
        const newValue = '+' + phoneNumber;
        const candidate = normalizeToE164Candidate(newValue);
        const formatted = candidate ? formatInternationalFlexible(candidate) : newValue;
        setPhoneNumber(formatted);
      }
      return;
    }
    
    // Check if we already have a complete vanity number (11 digits starting with +1)
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) {
        // We have a complete vanity number, don't add more characters
        return;
      }
    }
    
    // Extract digits from current phone number to handle vanity numbers properly
    const currentDigits = phoneNumber.replace(/\D/g, '');
    const newValue = currentDigits + value;
    const candidate = normalizeToE164Candidate(newValue);
    const formatted = candidate ? formatInternationalFlexible(candidate) : newValue;
    setPhoneNumber(formatted);
  };

  return (
    <div className="App">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Phone Lookie</h3>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-light btn-sm" 
                    type="button"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <i className="bi bi-clock-history"></i> History
                  </button>
                  <button 
                    className="btn btn-outline-light btn-sm"
                    type="button"
                    onClick={handleOpenSettings}
                    title="Settings"
                  >
                    <i className="bi bi-gear"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Phone Input */}
                <div className="form-group mb-4">
                  <div className="input-group">
                    <input 
                      type="tel" 
                      className="form-control form-control-lg text-center" 
                      id="phoneInput"
                      ref={phoneInputRef}
                      value={phoneNumber}
                      onChange={handlePhoneInput}
                      onPaste={handlePhonePaste}
                      onBlur={handlePhoneBlur}
                      onKeyDown={handleKeyDown}
                      placeholder="+[country code] (XXX) XXX-XXXX"
                      maxLength="25"
                      pattern=""
                    />
                    <button 
                      className="btn btn-primary" 
                      type="button" 
                      onClick={clearPhoneInput}
                      title="Clear input"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>

                {/* Keypad */}
                <div className="keypad mb-4">
                  <div className="row">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((key) => (
                      <div key={key} className="col-4">
                        <button 
                          ref={(el) => buttonRefs.current[key.toString()] = el}
                          className="btn btn-light w-100 keypad-btn"
                          onClick={() => handleKeypadClick(key.toString())}
                        >
                          {key}
                          <div className="alpha">
                            {key === 1 ? '.' : 
                             key === 2 ? 'ABC' :
                             key === 3 ? 'DEF' :
                             key === 4 ? 'GHI' :
                             key === 5 ? 'JKL' :
                             key === 6 ? 'MNO' :
                             key === 7 ? 'PQRS' :
                             key === 8 ? 'TUV' :
                             key === 9 ? 'WXYZ' :
                             key === 0 ? '+' : ''}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lookup Button */}
                <button 
                  id="lookupBtn" 
                  className="btn btn-primary w-100 mb-4"
                  onClick={performLookup}
                  disabled={!checkCredentials()}
                >
                  {checkCredentials() ? 'Lookup Number' : 'Configure API Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="position-fixed top-0 start-0 end-0 p-3" style={{zIndex: 1080, backgroundColor: '#28a745'}}>
          <div className="d-flex justify-content-between align-items-center text-white">
            <div>
              <i className="bi bi-arrow-clockwise me-2"></i>
              <strong>Update Available!</strong> A new version of the app is ready.
            </div>
            <div>
              <button 
                className="btn btn-light btn-sm me-2"
                onClick={handleUpdateApp}
              >
                <i className="bi bi-arrow-clockwise"></i> Update Now
              </button>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={dismissUpdate}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Button */}
      {showInstallButton && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-3">
          <button 
            className="btn btn-primary"
            onClick={handleInstallClick}
          >
            <i className="bi bi-phone"></i> Install App
          </button>
        </div>
      )}

      {isSettingsOpen && createPortal(
        <>
          <div className="modal fade show" style={{display: 'block', zIndex: 1060}} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Settings</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsSettingsOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="accountSid" className="form-label">Twilio Account SID</label>
                    <input
                      id="accountSid"
                      type="text"
                      className="form-control"
                      value={accountSid}
                      onChange={e => setAccountSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      autoComplete="off"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="authToken" className="form-label">Twilio Auth Token</label>
                    <input
                      id="authToken"
                      type="password"
                      className="form-control"
                      value={authToken}
                      onChange={e => setAuthToken(e.target.value)}
                      placeholder="Your Auth Token"
                      autoComplete="off"
                    />
                  </div>
                  
                  <hr className="my-4" />
                  <h6 className="mb-3">Telnyx Configuration</h6>
                  <div className="mb-3">
                    <label htmlFor="telnyxApiKey" className="form-label">Telnyx API Key</label>
                    <input
                      id="telnyxApiKey"
                      type="password"
                      className="form-control"
                      value={telnyxApiKey}
                      onChange={e => setTelnyxApiKey(e.target.value)}
                      placeholder="Your Telnyx API Key"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="alert alert-warning" role="alert">
                    Your credentials are stored locally on this device via localStorage.
                  </div>
                  
                  {/* Version Information */}
                  <div className="mt-4 pt-3 border-top">
                    <h6 className="text-dark mb-2">Version Information</h6>
                    <div className="row">
                      <div className="col-6">
                        <small className="text-dark">Version:</small><br />
                        <code className="text-dark">{VERSION_INFO.version}</code>
                      </div>
                      <div className="col-6">
                        <small className="text-dark">Build:</small><br />
                        <code className="text-dark">{VERSION_INFO.buildVersion}</code>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-danger me-auto" onClick={handleClearSettings}>
                    Clear
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveSettings}>Save</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>,
        document.body
      )}

      {isResultsOpen && resultsData && createPortal(
        <>
          <div className="modal fade show" style={{display: 'block', zIndex: 1060}} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Lookup Results</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsResultsOpen(false)}></button>
                </div>
                <div className="modal-body">
                  {resultsData.services && (
                    <div className="mb-3">
                      <span className="badge bg-primary me-2">
                        {resultsData.services.includes('twilio') && 'Twilio'}
                      </span>
                      {resultsData.services.includes('telnyx') && (
                        <span className="badge bg-success">Telnyx</span>
                      )}
                    </div>
                  )}
                  
                  {/* Multi-service results */}
                  {resultsData.services ? (
                    <>
                      {resultsData.data.twilio && !resultsData.data.twilio.error && (
                        <div className="result-section mb-3">
                          <h6 className="text-primary mb-2">Twilio Results</h6>
                          {resultsData.data.twilio.phone_number && (
                            <div className="result-item"><strong>Phone Number:</strong> {formatPhoneNumber(resultsData.data.twilio.phone_number)}</div>
                          )}
                          {resultsData.data.twilio.country_code && (
                            <div className="result-item"><strong>Country Code:</strong> {resultsData.data.twilio.country_code}</div>
                          )}
                          {resultsData.data.twilio.national_format && (
                            <div className="result-item"><strong>National Format:</strong> {resultsData.data.twilio.national_format}</div>
                          )}
                          <div className="result-item"><strong>Carrier:</strong> {(resultsData.data.twilio.carrier?.name) || (resultsData.data.twilio.line_type_intelligence?.carrier_name) || 'Not available'}</div>
                          <div className="result-item"><strong>Type:</strong> {(resultsData.data.twilio.carrier?.type) || (resultsData.data.twilio.line_type_intelligence?.type) || 'Not available'}</div>
                        </div>
                      )}
                      
                      {resultsData.data.telnyx && !resultsData.data.telnyx.error && (
                        <div className="result-section mb-3">
                          <h6 className="text-success mb-2">Telnyx Results</h6>
                          {resultsData.data.telnyx.phone_number && (
                            <div className="result-item"><strong>Phone Number:</strong> {formatPhoneNumber(resultsData.data.telnyx.phone_number)}</div>
                          )}
                          {resultsData.data.telnyx.carrier?.name && (
                            <div className="result-item"><strong>Carrier:</strong> {resultsData.data.telnyx.carrier.name}</div>
                          )}
                          {resultsData.data.telnyx.line_type && (
                            <div className="result-item"><strong>Type:</strong> {resultsData.data.telnyx.line_type}</div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Legacy single-service results */}
                      <div className="result-section mb-3">
                        <h6 className="text-primary mb-2">Basic Information</h6>
                        <div className="result-item"><strong>Phone Number:</strong> {formatPhoneNumber(resultsData.phone_number)}</div>
                        <div className="result-item"><strong>Country Code:</strong> {resultsData.country_code}</div>
                        <div className="result-item"><strong>National Format:</strong> {resultsData.national_format}</div>
                      </div>
                    </>
                  )}
                  
                  {!resultsData.services && (
                  <>
                  <div className="result-section mb-3">
                    <h6 className="text-primary mb-2">Carrier Information</h6>
                    <div className="result-item"><strong>Carrier:</strong> {(resultsData.carrier?.name) || (resultsData.line_type_intelligence?.carrier_name) || 'Not available'}</div>
                    <div className="result-item"><strong>Type:</strong> {(resultsData.carrier?.type) || (resultsData.line_type_intelligence?.type) || 'Not available'}</div>
                    <div className="result-item"><strong>MNC:</strong> {(resultsData.carrier?.mobile_network_code) || (resultsData.line_type_intelligence?.mobile_network_code) || 'Not available'}</div>
                    <div className="result-item"><strong>MCC:</strong> {(resultsData.carrier?.mobile_country_code) || (resultsData.line_type_intelligence?.mobile_country_code) || 'Not available'}</div>
                  </div>
                  <div className="result-section mb-3">
                    <h6 className="text-primary mb-2">Validation Status</h6>
                    <div className="result-item"><strong>Valid:</strong> {resultsData.valid ? 'Yes' : 'No'}</div>
                    {resultsData.validation_errors && resultsData.validation_errors.length > 0 && (
                      <div className="result-item"><strong>Validation Errors:</strong> {resultsData.validation_errors.join(', ')}</div>
                    )}
                  </div>
                  {resultsData.caller_name && (
                    <div className="result-section mb-3">
                      <h6 className="text-primary mb-2">Caller Information</h6>
                      <div className="result-item"><strong>Name:</strong> {resultsData.caller_name?.caller_name || 'Unknown'}</div>
                      <div className="result-item"><strong>Type:</strong> {resultsData.caller_name?.caller_type || 'Unknown'}</div>
                    </div>
                  )}
                  {resultsData.line_type_intelligence && (
                    <div className="result-section mb-3">
                      <h6 className="text-primary mb-2">Line Type Information</h6>
                      <div className="result-item"><strong>Type:</strong> {resultsData.line_type_intelligence?.type || 'Unknown'}</div>
                      <div className="result-item"><strong>Carrier:</strong> {resultsData.line_type_intelligence?.carrier_name || 'Unknown'}</div>
                      <div className="result-item"><strong>MNC:</strong> {resultsData.line_type_intelligence?.mobile_network_code || 'Unknown'}</div>
                      <div className="result-item"><strong>MCC:</strong> {resultsData.line_type_intelligence?.mobile_country_code || 'Unknown'}</div>
                    </div>
                  )}
                  {resultsData.identity_match && (
                    <div className="result-section mb-3">
                      <h6 className="text-primary mb-2">Identity Match Information</h6>
                      <div className="result-item"><strong>Error Code:</strong> {resultsData.identity_match?.error_code ?? 'None'}</div>
                      <div className="result-item"><strong>Error Message:</strong> {resultsData.identity_match?.error_message ?? 'None'}</div>
                      <div className="result-item"><strong>Score:</strong> {resultsData.identity_match?.summary_score ?? 'Unknown'}</div>
                    </div>
                  )}
                  </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-info me-auto" onClick={() => openJsonModal(resultsData)}>
                    <i className="bi bi-code"></i> View JSON
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setIsResultsOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>,
        document.body
      )}

      {isHistoryOpen && createPortal(
        <>
          <div className="modal fade show" style={{display: 'block', zIndex: 1060}} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Lookup History</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => { setIsHistoryOpen(false); setHistorySearchQuery(''); }}></button>
                </div>
                <div className="modal-body history-list" id="historyContent">
                  {/* Search Box */}
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by phone number, caller name, or carrier (e.g., AT&T, T-Mobile)..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {lookupHistory.filter(filterHistory).length === 0 && (
                    <div className="text-center text-muted">
                      {lookupHistory.length === 0 ? 'No lookup history found' : 'No results match your search'}
                    </div>
                  )}
                  {lookupHistory.filter(filterHistory).map((item, index) => {
                    const cName = item.data?.carrier?.name || item.data?.line_type_intelligence?.carrier_name || 'Unknown';
                    const cType = item.data?.carrier?.type || item.data?.line_type_intelligence?.type || 'Unknown';
                    const callerName = item.data?.caller_name?.caller_name || null;
                    return (
                      <div key={index} className="history-item">
                        <div className="history-content" onClick={() => { setResultsData(item.data); setIsResultsOpen(true); setIsHistoryOpen(false); }}>
                          <div className="timestamp">{new Date(item.timestamp).toLocaleString()}</div>
                          {callerName && (
                            <div className="caller-name text-primary" style={{fontWeight: 'bold', fontSize: '1.1em'}}>{callerName}</div>
                          )}
                          <div className="phone-number">{formatPhoneNumber(item.phoneNumber)}</div>
                          <div className="carrier-info">{cName} ({cType})</div>
                          <div className="carrier-info">Country Code: {item.data?.country_code || 'Unknown'}</div>
                        </div>
                        <div className="history-actions">
                          <button 
                            className="btn btn-outline-info btn-sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              openJsonModal(item.data); 
                            }}
                            title="View JSON"
                          >
                            <i className="bi bi-code"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-danger me-auto" onClick={clearHistory}>Clear History</button>
                  <button type="button" className="btn btn-outline-success me-2" onClick={exportHistoryToCSV} disabled={lookupHistory.length === 0}>
                    <i className="bi bi-download"></i> Export CSV
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { setIsHistoryOpen(false); setHistorySearchQuery(''); }}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>,
        document.body
      )}

      {isJsonModalOpen && jsonData && createPortal(
        <>
          <div className="modal fade show" style={{display: 'block', zIndex: 1070}} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">JSON Response Data</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsJsonModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <pre className="bg-light p-3 rounded" style={{maxHeight: '70vh', overflow: 'auto', fontSize: '0.875rem'}}>
                    {JSON.stringify(jsonData, null, 2)}
                  </pre>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={() => setIsJsonModalOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1065}}></div>
        </>,
        document.body
      )}
    </div>
  );
}

export default App; 