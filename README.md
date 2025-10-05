# Phone Lookie - React PWA

A Progressive Web App for phone number lookup using Twilio API, built with React.

## Features

- **Phone Number Lookup** with international support
- **Vanity Number Support** - converts letters to digits (e.g., "1-800-WALGREENS")
- **PWA (Progressive Web App)** functionality - installable on mobile and desktop
- **Responsive Design** with Bootstrap 5
- **Virtual Keypad** interface
- **Lookup History** with localStorage persistence
- **CSV Export** of lookup history
- **Settings Management** - store Twilio credentials locally
- **Service Worker** for offline functionality
- **Auto-formatting** of phone numbers as you type

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Twilio account with Account SID and Auth Token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/phone-lookie.github.io.git
cd phone-lookie.github.io
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`.

### Configuration

1. Click the gear icon (⚙️) in the top-right corner
2. Enter your Twilio Account SID (starts with "AC...")
3. Enter your Twilio Auth Token
4. Click Save

Credentials are stored locally in your browser's localStorage.

### Building for Production

```bash
npm run build
```

This creates a `build` folder with the production-ready app.

## Project Structure

```
phone-lookie/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── assets/
│       └── images/
│           └── icons/          # PWA icons and favicons
├── src/
│   ├── App.js                  # Main React component
│   ├── App.css                 # Styles
│   ├── index.js                # React entry point
│   ├── index.css               # Global styles
│   ├── config.js               # Runtime configuration (localStorage-backed)
│   ├── phoneUtils.js           # Phone number normalization and formatting
│   └── phoneUtils.test.js      # Unit tests for phone utilities
├── scripts/
│   ├── build.js                # Build script for static version
│   └── generate-favicons.js    # Favicon generation
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
└── package.json
```

## Phone Number Support

The app supports various phone number formats:

- **US Numbers**: `(555) 123-4567`, `555-123-4567`, `5551234567`
- **International**: `+44 20 7123 4567`, `+49 30 123 456`
- **Vanity Numbers**: `1-800-WALGREENS`, `1-800-CALL-NOW`
- **Auto-formatting**: Numbers are formatted as you type
- **Auto-detection**: 10-digit numbers are assumed to be US (+1)

## API Features

- **Twilio Lookup API** integration
- **Carrier Information** (when available)
- **Caller Information** (when available)
- **Line Type Intelligence**
- **SIM Swap Detection**
- **Validation Status**

## PWA Features

- **Installable** on mobile and desktop
- **Offline functionality** with service worker
- **App-like experience** with standalone display
- **Responsive design** for all screen sizes
- **Custom icons** and splash screens

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 