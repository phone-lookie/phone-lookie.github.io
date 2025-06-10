const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Define paths
const paths = {
    source: 'assets/images/favicons/favicon.svg',
    output: {
        root: 'assets/images',
        favicons: 'assets/images/favicons',
        icons: 'assets/images/icons'
    }
};

// Ensure output directories exist
fs.ensureDirSync(paths.output.favicons);
fs.ensureDirSync(paths.output.icons);

// Generate favicons
async function generateFavicons() {
    try {
        console.log('Generating favicons...');
        
        // Generate favicon-16x16.png
        await sharp(paths.source)
            .resize(16, 16)
            .toFile(path.join(paths.output.favicons, 'favicon-16x16.png'));
        console.log('Generated favicon-16x16.png');

        // Generate favicon-32x32.png
        await sharp(paths.source)
            .resize(32, 32)
            .toFile(path.join(paths.output.favicons, 'favicon-32x32.png'));
        console.log('Generated favicon-32x32.png');

        // Generate apple-touch-icon.png
        await sharp(paths.source)
            .resize(180, 180)
            .toFile(path.join(paths.output.favicons, 'apple-touch-icon.png'));
        console.log('Generated apple-touch-icon.png');

        // Generate PWA icons
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        for (const size of sizes) {
            // Regular icon
            await sharp(paths.source)
                .resize(size, size)
                .toFile(path.join(paths.output.icons, `icon-${size}x${size}.png`));
            console.log(`Generated icon-${size}x${size}.png`);

            // Maskable icon (if size is 192 or 512)
            if (size === 192 || size === 512) {
                await sharp(paths.source)
                    .resize(size, size)
                    .toFile(path.join(paths.output.icons, `icon-${size}x${size}-maskable.png`));
                console.log(`Generated icon-${size}x${size}-maskable.png`);
            }
        }

        console.log('All favicons generated successfully!');
    } catch (error) {
        console.error('Error generating favicons:', error);
        process.exit(1);
    }
}

// Run the generation
generateFavicons(); 