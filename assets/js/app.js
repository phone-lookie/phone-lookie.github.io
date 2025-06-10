// Constants
const STORAGE_KEY = 'lookupHistory';
const MAX_HISTORY_ITEMS = 50;
const API_ENDPOINT = 'https://lookups.twilio.com/v2/PhoneNumbers';
const API_FIELDS = 'caller_name,line_type_intelligence,sim_swap,identity_match';

// Initialize variables
let resultsModal;
let historyModal;
let isViewingHistory = false;
let deferredPrompt;

// PWA Installation Handling
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install button
    const installContainer = document.getElementById('pwaInstallContainer');
    installContainer.classList.remove('d-none');
});

// Check if the app is running in standalone mode (installed)
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        // App is running in standalone mode, hide the install button
        const installContainer = document.getElementById('pwaInstallContainer');
        installContainer.classList.add('d-none');
    }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize the application
$(document).ready(function() {
    initializeApp();
    initializePWAInstall();
});

function initializePWAInstall() {
    const installBtn = document.getElementById('pwaInstallBtn');
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We no longer need the prompt. Clear it up
        deferredPrompt = null;
        // Hide the install button
        const installContainer = document.getElementById('pwaInstallContainer');
        installContainer.classList.add('d-none');
    });
}

function initializeApp() {
    // Auto focus the phone input
    $('#phoneInput').focus();
    
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check credentials
    checkCredentials();
}

function initializeBootstrapComponents() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize modals
    resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
}

function initializeEventListeners() {
    // Initialize back button
    const backToHistoryBtn = document.getElementById('backToHistoryBtn');
    backToHistoryBtn.addEventListener('click', () => {
        resultsModal.hide();
        historyModal.show();
    });
    
    // Initialize phone input
    const phoneInput = document.getElementById('phoneInput');
    phoneInput.addEventListener('input', handlePhoneInput);
    phoneInput.addEventListener('blur', handlePhoneBlur);
    phoneInput.addEventListener('paste', handlePhonePaste);
    phoneInput.addEventListener('keypress', handlePhoneKeyPress);

    // Initialize buttons
    document.getElementById('clearInputBtn').addEventListener('click', clearPhoneInput);
    document.getElementById('lookupBtn').addEventListener('click', performLookup);
    document.getElementById('historyBtn').addEventListener('click', loadHistory);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

function checkCredentials() {
    const lookupBtn = document.getElementById('lookupBtn');
    const phoneInput = document.getElementById('phoneInput');
    const resultContent = document.getElementById('resultContent');
    
    // Check if config object exists
    if (typeof config === 'undefined') {
        showError('Configuration error: Unable to load application settings. Please try refreshing the page.');
        lookupBtn.disabled = true;
        phoneInput.disabled = true;
        lookupBtn.textContent = 'Configuration Error';
        lookupBtn.classList.remove('btn-primary');
        lookupBtn.classList.add('btn-secondary');
        lookupBtn.style.opacity = '0.7';
        lookupBtn.style.cursor = 'not-allowed';
        return false;
    }

    // Check if Twilio credentials exist
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
        showError('Twilio credentials are not configured. Please contact the administrator.');
        lookupBtn.disabled = true;
        phoneInput.disabled = true;
        lookupBtn.textContent = 'Missing Twilio Credentials';
        lookupBtn.classList.remove('btn-primary');
        lookupBtn.classList.add('btn-secondary');
        lookupBtn.style.opacity = '0.7';
        lookupBtn.style.cursor = 'not-allowed';
        
        // Add a tooltip to explain the error
        const tooltip = new bootstrap.Tooltip(lookupBtn, {
            title: 'The application is missing required Twilio API credentials. Please contact the administrator.',
            placement: 'top',
            trigger: 'hover'
        });
        
        return false;
    }

    // Credentials are valid
    lookupBtn.disabled = false;
    phoneInput.disabled = false;
    lookupBtn.textContent = 'Lookup Number';
    lookupBtn.classList.remove('btn-secondary');
    lookupBtn.classList.add('btn-primary');
    lookupBtn.style.opacity = '1';
    lookupBtn.style.cursor = 'pointer';
    return true;
}

function showError(message) {
    const resultContent = document.getElementById('resultContent');
    const errorHtml = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Error</h4>
            <p>${message}</p>
            <hr>
            <p class="mb-0">If this error persists, please try refreshing the page or contact support.</p>
        </div>
    `;
    resultContent.innerHTML = errorHtml;
    resultsModal.show();
}

// Phone Input Handlers
function handlePhoneInput(e) {
    // Allow only digits and '+' at the start
    let value = e.target.value;
    if (value.startsWith('+')) {
        // Keep the plus and only allow digits after it
        value = '+' + value.slice(1).replace(/\D/g, '');
    } else {
        // If it starts with 1, automatically add the plus
        if (value.startsWith('1') && value.length > 1) {
            value = '+' + value;
        } else {
            value = value.replace(/\D/g, '');
        }
    }
    e.target.value = value;
}

function handlePhoneBlur(e) {
    if (e.target.value) {
        e.target.value = formatPhoneNumberInput(e.target.value);
    }
}

function handlePhonePaste(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    e.target.value = formatPhoneNumberInput(pastedText);
}

function handlePhoneKeyPress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        performLookup();
    }
}

function clearPhoneInput() {
    const phoneInput = document.getElementById('phoneInput');
    phoneInput.value = '';
    phoneInput.focus();
}

// Phone Number Formatting
function formatPhoneNumberInput(value) {
    // Remove all non-digits except leading '+'
    const hasPlus = value.startsWith('+');
    const digits = value.replace(/\D/g, '');
    
    // If it starts with a plus, keep it
    if (hasPlus) {
        // Handle international numbers
        if (digits.length <= 3) {
            return '+' + digits;
        } else if (digits.length <= 6) {
            return '+' + digits.slice(0, 3) + ' ' + digits.slice(3);
        } else if (digits.length <= 10) {
            return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
        } else {
            const countryCode = digits.slice(0, -10);
            const number = digits.slice(-10);
            return '+' + countryCode + ' (' + number.slice(0, 3) + ') ' + number.slice(3, 6) + '-' + number.slice(6);
        }
    } else {
        // Handle US numbers without country code
        if (digits.length <= 3) {
            return digits;
        } else if (digits.length <= 6) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else if (digits.length <= 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else {
            // If more than 10 digits without +, assume it's a US number with country code
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
        }
    }
}

function formatPhoneNumber(number) {
    // Remove all non-digits except leading '+'
    const hasPlus = number.startsWith('+');
    const digits = number.replace(/\D/g, '');
    
    if (hasPlus) {
        const countryCode = digits.slice(0, -10);
        const number = digits.slice(-10);
        return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
}

// API and Results Handling
async function performLookup() {
    const phoneInput = document.getElementById('phoneInput');
    const resultContent = document.getElementById('resultContent');
    const backToHistoryBtn = document.getElementById('backToHistoryBtn');
    
    // Get the phone number and remove all formatting
    let phoneNumber = phoneInput.value.replace(/\D/g, '');
    
    // If it starts with a plus, keep it
    if (phoneInput.value.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
    } else if (phoneNumber.length === 10) {
        // If it's a 10-digit US number, add the +1 prefix
        phoneNumber = '+1' + phoneNumber;
    }

    backToHistoryBtn.classList.add('d-none');
    isViewingHistory = false;

    // Check credentials before proceeding
    if (!checkCredentials()) {
        return;
    }

    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
        showError('Please enter a valid phone number:\n' +
                 '• US numbers: (XXX) XXX-XXXX\n' +
                 '• International: +[country code] (XXX) XXX-XXXX\n' +
                 'Examples:\n' +
                 '• +1 (123) 456-7890\n' +
                 '• +44 (123) 456-7890');
        return;
    }

    try {
        showLoadingState(resultContent);
        const data = await fetchLookupData(phoneNumber);
        saveToHistory(phoneNumber, data);
        displayResults(data, resultContent);
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
}

function showLoadingState(resultContent) {
    resultContent.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    resultsModal.show();
}

async function fetchLookupData(phoneNumber) {
    const response = await fetch(`${API_ENDPOINT}/${phoneNumber}?Fields=${API_FIELDS}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + btoa(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`),
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

function displayResults(data, resultContent) {
    const resultHtml = generateResultsHtml(data);
    resultContent.innerHTML = resultHtml;
}

function generateResultsHtml(data) {
    return `
        ${generateBasicInfoSection(data)}
        ${generateCarrierSection(data)}
        ${data.caller_name ? generateCallerSection(data.caller_name) : ''}
        ${data.line_type_intelligence ? generateLineTypeSection(data.line_type_intelligence) : ''}
        ${data.sim_swap ? generateSimSwapSection(data.sim_swap) : ''}
        ${data.identity_match ? generateIdentityMatchSection(data.identity_match) : ''}
    `;
}

// Section Generators
function generateBasicInfoSection(data) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">Basic Information</h6>
            <div class="result-item">
                <strong>Phone Number:</strong> ${formatPhoneNumber(data.phone_number)}
            </div>
            <div class="result-item">
                <strong>Country Code:</strong> ${data.country_code}
            </div>
            <div class="result-item">
                <strong>National Format:</strong> ${data.national_format}
            </div>
        </div>
    `;
}

function generateCarrierSection(data) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">Carrier Information</h6>
            <div class="result-item">
                <strong>Carrier:</strong> ${data.carrier?.name || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Type:</strong> ${data.carrier?.type || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Mobile Network Code:</strong> ${data.carrier?.mobile_network_code || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Mobile Country Code:</strong> ${data.carrier?.mobile_country_code || 'Unknown'}
            </div>
        </div>
    `;
}

function generateCallerSection(callerName) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">Caller Information</h6>
            <div class="result-item">
                <strong>Name:</strong> ${callerName?.caller_name || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Type:</strong> ${callerName?.caller_type || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Error Code:</strong> ${callerName?.error_code || 'None'}
            </div>
        </div>
    `;
}

function generateLineTypeSection(lineType) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">Line Type Information</h6>
            <div class="result-item">
                <strong>Type:</strong> ${lineType?.type || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Error Code:</strong> ${lineType?.error_code || 'None'}
            </div>
        </div>
    `;
}

function generateSimSwapSection(simSwap) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">SIM Swap Information</h6>
            <div class="result-item">
                <strong>Last Swap Date:</strong> ${simSwap?.last_sim_swap?.date || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Swap Status:</strong> ${simSwap?.carrier_status || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Error Code:</strong> ${simSwap?.error_code || 'None'}
            </div>
        </div>
    `;
}

function generateIdentityMatchSection(identityMatch) {
    return `
        <div class="result-section mb-3">
            <h6 class="text-primary mb-2">Identity Match Information</h6>
            <div class="result-item">
                <strong>Score:</strong> ${identityMatch?.score || 'Unknown'}
            </div>
            <div class="result-item">
                <strong>Error Code:</strong> ${identityMatch?.error_code || 'None'}
            </div>
        </div>
    `;
}

// History Management
function saveToHistory(phoneNumber, data) {
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const historyItem = {
            phoneNumber,
            timestamp: new Date().toISOString(),
            fullData: {
                phone_number: data.phone_number,
                country_code: data.country_code,
                national_format: data.national_format,
                carrier: data.carrier,
                caller_name: data.caller_name,
                line_type_intelligence: data.line_type_intelligence,
                sim_swap: data.sim_swap,
                identity_match: data.identity_match
            }
        };
        
        history.unshift(historyItem);
        
        if (history.length > MAX_HISTORY_ITEMS) {
            history.pop();
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('Saved to history:', historyItem);
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

function loadHistory() {
    try {
        const historyContent = document.getElementById('historyContent');
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        if (history.length === 0) {
            historyContent.innerHTML = '<div class="text-center text-muted">No lookup history found</div>';
            return;
        }
        
        const historyHtml = history.map((item, index) => generateHistoryItemHtml(item, index)).join('');
        historyContent.innerHTML = historyHtml;
    } catch (error) {
        console.error('Error loading history:', error);
        historyContent.innerHTML = '<div class="text-center text-danger">Error loading history</div>';
    }
}

function generateHistoryItemHtml(item, index) {
    return `
        <div class="history-item" data-index="${index}" onclick="showHistoryResults(${index})">
            <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="phone-number">${formatPhoneNumber(item.phoneNumber)}</div>
            <div class="carrier-info">${item.fullData?.carrier?.name || 'Unknown'} (${item.fullData?.carrier?.type || 'Unknown'})</div>
            <div class="carrier-info">Country Code: ${item.fullData?.country_code || 'Unknown'}</div>
            <button class="lookup-btn" onclick="event.stopPropagation(); lookupFromHistory('${item.phoneNumber}')" title="Lookup Again">
                <i class="bi bi-search"></i>
            </button>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem(${index})" title="Delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
}

function showHistoryResults(index) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const item = history[index];
    const resultContent = document.getElementById('resultContent');
    const backToHistoryBtn = document.getElementById('backToHistoryBtn');
    
    if (!item?.fullData) {
        showError('History data not found');
        return;
    }

    backToHistoryBtn.classList.remove('d-none');
    isViewingHistory = true;

    displayResults(item.fullData, resultContent);
    historyModal.hide();
    resultsModal.show();
}

function deleteHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadHistory();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all lookup history?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadHistory();
    }
}

function lookupFromHistory(phoneNumber) {
    const phoneInput = document.getElementById('phoneInput');
    phoneInput.value = formatPhoneNumber(phoneNumber);
    historyModal.hide();
    performLookup();
}

function isValidPhoneNumber(phoneNumber) {
    // Remove all non-digits except leading '+'
    const hasPlus = phoneNumber.startsWith('+');
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Basic validation rules:
    // 1. Must have at least 10 digits (excluding country code)
    // 2. If it has a country code, it must be valid
    // 3. Total length should be reasonable (between 10 and 15 digits)
    // 4. Country code should be between 1 and 3 digits
    
    if (hasPlus) {
        // International number with country code
        const countryCodeLength = digits.length - 10;
        return digits.length >= 11 && // At least country code + 10 digits
               digits.length <= 15 && // Maximum reasonable length
               countryCodeLength >= 1 && // At least 1 digit for country code
               countryCodeLength <= 3;   // Maximum 3 digits for country code
    } else {
        // US number without country code
        return digits.length === 10;
    }
} 