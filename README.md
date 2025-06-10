# Phone Lookie

A Progressive Web App (PWA) for looking up phone number information using the Twilio API. The application features a modern UI with a keypad interface, real-time phone number formatting, and lookup history management.

## Features

- 📱 Phone number lookup using Twilio API
- ⌨️ Interactive keypad interface with alpha values
- 🔄 Real-time phone number formatting
- 📱 Progressive Web App (PWA) support
- 🎨 Modern UI with Bootstrap 5
- 📱 Responsive design for all devices
- 🔒 Secure API key handling through GitHub Actions
- 🔑 Local development support with .env file
- 📋 Lookup history with full result storage
- 🔍 Quick lookup from history
- 🗑️ History management (view, delete, clear)
- ⌨️ Keyboard support (Enter key for lookup)
- 📋 Copy/paste support with automatic formatting
- 🎯 Auto-focus on input field
- 🎨 Consistent UI styling and hover effects

## Prerequisites

- A Twilio account with API credentials
- Node.js (v16 or higher)
- npm (Node Package Manager)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/phone-lookie.github.io.git
   cd phone-lookie.github.io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For local development:
   - Copy `.env.example` to `.env`
   - Add your Twilio credentials to `.env`:
     ```
     TWILIO_ACCOUNT_SID=your_account_sid_here
     TWILIO_AUTH_TOKEN=your_auth_token_here
     ```
   - The `js/config.js` file will be automatically generated with your credentials

4. For GitHub Pages deployment:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Add the following secrets:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`

5. Update the repository URL in `package.json` with your GitHub repository URL

6. Create the `icons` directory and add PWA icons:
   - `icons/icon-192x192.png` (192x192 pixels)
   - `icons/icon-512x512.png` (512x512 pixels)

## Development

To run the application locally:

```bash
npm start
```

The application will be available at `http://localhost:3000`

The local development server will:
1. Read your Twilio credentials from the `.env` file
2. Generate a `config.js` file with these credentials
3. Start the development server

## Features in Detail

### Phone Number Input
- Real-time formatting as you type
- Support for international numbers
- Automatic formatting on paste
- Enter key support for quick lookup
- Clear button for easy reset
- Auto-focus on page load

### Keypad Interface
- Interactive number buttons
- Alpha values for each number
- Responsive design for all screen sizes
- Visual feedback on interaction

### Lookup Results
- Comprehensive phone information
- Carrier details
- Caller information (when available)
- Line type intelligence
- SIM swap information
- Identity match data
- Clean, organized display
- Modal view with back navigation

### History Management
- Stores up to 50 recent lookups
- Full result data preservation
- Quick lookup from history
- Delete individual entries
- Clear all history
- Timestamp tracking
- Interactive history items

## Project Structure

```
phone-lookie/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── keypad.js
│   └── config.js (placeholder, generated during build/development)
├── scripts/
│   └── setup-env.js
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── .env.example
├── index.html
├── manifest.json
├── sw.js
├── package.json
└── README.md
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- jQuery
- Bootstrap 5
- Twilio Lookup API
- GitHub Actions
- Progressive Web App (PWA)
- Local Storage API
- dotenv (for local development)

## Security Note

The application uses Twilio's client-side SDK to make API calls directly from the browser. While this is convenient for deployment on GitHub Pages, please note that your Twilio credentials will be visible in the generated `config.js` file. For production use, it's recommended to:

1. Use a server-side implementation
2. Implement proper API key rotation
3. Use environment-specific credentials
4. Implement rate limiting
5. Add request validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Twilio](https://www.twilio.com/) for providing the phone number lookup API
- [Bootstrap](https://getbootstrap.com/) for the UI framework
- [GitHub Pages](https://pages.github.com/) for hosting
- [Bootstrap Icons](https://icons.getbootstrap.com/) for the icon set 