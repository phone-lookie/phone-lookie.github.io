# Phone Lookie - React PWA

A Progressive Web App for phone number lookup using Twilio API, built with React.

## Features

- **Phone Number Lookup** with international support
- **Vanity Number Support** - converts letters to digits (e.g., "1-800-WALGREENS")
- **PWA (Progressive Web App)** functionality - installable on mobile and desktop
- **Responsive Design** with Bootstrap 5
- **Virtual Keypad** interface with keyboard support
- **Lookup History** with localStorage persistence
- **CSV Export** of lookup history
- **Multi-Service Support** - Use Twilio, Telnyx, or both for phone lookups
- **Settings Management** - store API credentials locally
- **Service Worker** for offline functionality
- **Auto-formatting** of phone numbers as you type
- **Mobile-Optimized** - prevents pinch zoom and overscroll bounce
- **Global Keyboard Support** - type numbers even when input isn't focused

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- **At least one** of the following:
  - Twilio account with Account SID and Auth Token
  - Telnyx account with API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/phone-lookie/phone-lookie.github.io.git
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

#### Option 1: Using .env File (Recommended for Development)

1. Create a `.env` file in the project root:
```bash
# Copy and fill in your credentials
REACT_APP_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
REACT_APP_TELNYX_API_KEY=your_telnyx_api_key_here
```

2. Start the app - credentials will be automatically imported into localStorage

**Note**: `.env` files are git-ignored for security. Never commit credentials to version control.

#### Option 2: Using the Settings Modal

1. Click the gear icon (⚙️) in the top-right corner
2. Configure **at least one** API service:
   - **Twilio**: Enter Account SID (starts with "AC...") and Auth Token
   - **Telnyx**: Enter API Key
3. Click Save

**Note**: You can configure both services to get combined results. Credentials are stored locally in your browser's localStorage and will override `.env` values.

#### Getting API Keys

- **Twilio**: Sign up at [twilio.com](https://www.twilio.com) and get credentials from the console
- **Telnyx**: Sign up at [telnyx.com](https://telnyx.com) and get API key from Mission Control Portal

### Building for Production

```bash
npm run build
```

This creates a `build` folder with the production-ready app.

### Scripts

The `scripts/` folder contains build and version management utilities:

- **`generate-version.sh`**: Creates version information from package.json + git hash
- **`build-with-version.sh`**: Enhanced build script with version injection
- **`bump-version.sh`**: Increments package version for testing updates

These scripts are also available as npm commands:
- `npm run version:generate` - Generate version info
- `npm run version:bump` - Bump version for testing  
- `npm run build:version` - Build with version injection

## Project Structure

```
phone-lookie/
├── public/
│   ├── index.html              # Main HTML file with PWA meta tags
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── static/
│       └── icons/              # PWA icons and favicons
├── src/
│   ├── App.js                  # Main React component
│   ├── App.css                 # Styles with mobile optimizations
│   ├── index.js                # React entry point
│   ├── index.css               # Global styles
│   ├── config.js               # Runtime configuration (localStorage-backed)
│   ├── phoneUtils.js           # Phone number normalization and formatting
│   └── phoneUtils.test.js      # Unit tests for phone utilities
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── scripts/                    # Build and version management scripts
│   ├── generate-version.sh     # Generates version info from package.json + git
│   ├── build-with-version.sh   # Build script with version injection
│   └── bump-version.sh         # Version bump script for testing updates
└── package.json
```

## Phone Number Support

The app supports various phone number formats:

- **US Numbers**: `(555) 123-4567`, `555-123-4567`, `5551234567`
- **International**: `+44 20 7123 4567`, `+49 30 123 456`, `+18 (012) 345-1765`
- **Vanity Numbers**: `1-800-WALGREENS`, `1-800-CALL-NOW` (converts to `+1 (800) 925-4733`)
- **Auto-formatting**: Numbers are formatted as you type with progressive formatting
- **Auto-detection**: 10-digit numbers are assumed to be US (+1)
- **Keyboard & Keypad**: Both keyboard input and virtual keypad work identically

## API Features

### Multi-Service Support

The app supports **Twilio**, **Telnyx**, or **both** simultaneously:

- **Single Service**: Use just Twilio or just Telnyx
- **Dual Service**: Configure both to get combined results
- **Automatic Fallback**: Results from available services are merged
- **Parallel Requests**: Both APIs are called simultaneously for speed

### Available Data

- **Carrier Information** (when available)
- **Caller Information** (when available)
- **Line Type Intelligence**
- **SIM Swap Detection** (Twilio)
- **Validation Status**
- **Country and National Format**

## PWA Features

- **Installable** on mobile and desktop
- **Offline functionality** with service worker
- **App-like experience** with standalone display
- **Responsive design** for all screen sizes
- **Custom icons** and splash screens
- **Mobile-optimized** touch handling
- **Prevents pinch zoom** and overscroll bounce on iOS/Android
- **Automatic Updates** - detects new versions and prompts users to update
- **Smart Caching** - different caching strategies for different types of content

## Mobile Optimization

The app is specifically optimized for mobile devices:

- **No Pinch Zoom**: Prevents accidental zooming on touch devices
- **No Overscroll Bounce**: Eliminates the rubber band effect on iOS
- **Touch-Friendly**: Large buttons and touch targets
- **Global Keyboard**: Type numbers even when the input field isn't focused
- **Visual Feedback**: Keypad buttons show press effects when corresponding keys are pressed
- **PWA Installation**: Can be installed as a native app on mobile devices

## Service Worker & Updates

The app includes an intelligent service worker that handles caching and automatic updates:

### Caching Strategies

- **Cache-First**: Static assets (JS, CSS, images) are served from cache for fast loading
- **Network-First**: API calls to Twilio are always fetched fresh from the network
- **Stale-While-Revalidate**: Other resources are served from cache while updating in background

### Update Detection

- **Automatic Detection**: The service worker automatically detects when a new version is available
- **Update Banner**: A green banner appears at the top when updates are available
- **User Control**: Users can choose to update immediately or dismiss the notification
- **Seamless Updates**: Updates are applied without losing user data or settings

### Version System

The app uses a sophisticated version system that combines:
- **Package Version**: From `package.json` (semantic versioning)
- **Git Commit Hash**: Short hash from the current commit
- **Build Version**: Format: `{package-version}+{git-hash}` (e.g., `1.0.1+ff15129`)

### Testing Updates

To test the update functionality:

1. **Bump Version**: Run the version bump script:
```bash
npm run version:bump
# or
./scripts/bump-version.sh
```

2. **Build with Version**: Build the app with version injection:
```bash
npm run build:version
# or
./scripts/build-with-version.sh
```

3. **Deploy** the updated version
4. **Open** the app in a browser
5. **Update Banner** will appear automatically
6. **Click "Update Now"** to apply the update

### Version Information

You can view detailed version information in the app:
1. Open **Settings** (gear icon)
2. Scroll to the bottom to see **Version Information** section
3. View package version, build version, git hash, branch, and build timestamp

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