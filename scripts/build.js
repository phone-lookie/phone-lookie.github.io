const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const Terser = require('terser');
const CleanCSS = require('clean-css');

// Define paths
const paths = {
    src: {
        root: '.',
        assets: 'assets',
        js: 'assets/js',
        css: 'assets/css',
        images: 'assets/images',
        html: 'index.html',
        manifest: 'manifest.json',
        serviceWorker: 'sw.js'
    },
    dist: {
        root: 'dist',
        assets: 'dist/assets',
        js: 'dist/assets/js',
        css: 'dist/assets/css',
        images: 'dist/assets/images',
        html: 'dist/index.html',
        manifest: 'dist/manifest.json',
        serviceWorker: 'dist/sw.js'
    }
};

// Clean dist directory
function cleanDist() {
    console.log('Cleaning dist directory...');
    fs.removeSync(paths.dist.root);
}

// Create directory structure
function createDirectories() {
    console.log('Creating directory structure...');
    Object.values(paths.dist).forEach(dir => {
        if (dir.includes('.')) return; // Skip files
        fs.ensureDirSync(dir);
    });
}

// Minify JavaScript
async function minifyJS(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const result = await Terser.minify(code, {
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            mangle: true
        });
        return result.code;
    } catch (error) {
        console.warn(`Warning: Could not minify ${filePath}:`, error.message);
        return fs.readFileSync(filePath, 'utf8');
    }
}

// Minify CSS
function minifyCSS(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const result = new CleanCSS({
            level: 2,
            format: 'keep-breaks'
        }).minify(code);
        return result.styles;
    } catch (error) {
        console.warn(`Warning: Could not minify ${filePath}:`, error.message);
        return fs.readFileSync(filePath, 'utf8');
    }
}

// Process JavaScript files
async function processJSFiles() {
    console.log('Processing JavaScript files...');
    const files = fs.readdirSync(paths.src.js);
    
    for (const file of files) {
        if (file.endsWith('.js')) {
            const sourcePath = path.join(paths.src.js, file);
            const destPath = path.join(paths.dist.js, file);
            
            // Skip config.js as it's generated during build
            if (file === 'config.js') continue;
            
            const minified = await minifyJS(sourcePath);
            fs.writeFileSync(destPath, minified);
        }
    }
}

// Process CSS files
function processCSSFiles() {
    console.log('Processing CSS files...');
    const files = fs.readdirSync(paths.src.css);
    
    for (const file of files) {
        if (file.endsWith('.css')) {
            const sourcePath = path.join(paths.src.css, file);
            const destPath = path.join(paths.dist.css, file);
            const minified = minifyCSS(sourcePath);
            fs.writeFileSync(destPath, minified);
        }
    }
}

// Copy and process files
async function copyFiles() {
    console.log('Copying and processing files...');

    // Copy and process HTML
    let html = fs.readFileSync(paths.src.html, 'utf8');
    // Update asset paths in HTML - they should already be correct since we moved the folders
    // Just ensure they have the version parameter
    const version = Date.now();
    html = html.replace(/(\.(js|css|png|jpg|gif|svg|ico))(\?v=\d+)?/g, `$1?v=${version}`);
    fs.writeFileSync(paths.dist.html, html);

    // Copy and process manifest
    let manifest = JSON.parse(fs.readFileSync(paths.src.manifest, 'utf8'));
    // Update icon paths in manifest - they should already be correct
    manifest.icons = manifest.icons.map(icon => ({
        ...icon,
        src: icon.src.replace(/^images\//, 'assets/images/')
    }));
    fs.writeFileSync(paths.dist.manifest, JSON.stringify(manifest, null, 2));

    // Copy and process service worker
    let sw = fs.readFileSync(paths.src.serviceWorker, 'utf8');
    // Update cache paths in service worker - they should already be correct
    sw = sw.replace(/\/js\//g, '/assets/js/');
    sw = sw.replace(/\/css\//g, '/assets/css/');
    sw = sw.replace(/\/images\//g, '/assets/images/');
    // Add version to cache name
    sw = sw.replace(/CACHE_NAME = '([^']+)'/, `CACHE_NAME = '$1-${version}'`);
    fs.writeFileSync(paths.dist.serviceWorker, sw);

    // Process JavaScript and CSS files
    await processJSFiles();
    processCSSFiles();

    // Copy images
    console.log('Copying images...');
    fs.copySync(paths.src.images, paths.dist.images);
}

// Generate favicons
function generateFavicons() {
    console.log('Generating favicons...');
    execSync('node scripts/generate-favicons.js', { stdio: 'inherit' });
}

// Generate config.js
function generateConfig() {
    console.log('Generating config.js...');
    const configContent = `/**
 * Configuration file for Phone Lookie
 * Generated during build process
 */

const config = {
    TWILIO_ACCOUNT_SID: '${process.env.TWILIO_ACCOUNT_SID || ''}',
    TWILIO_AUTH_TOKEN: '${process.env.TWILIO_AUTH_TOKEN || ''}'
};`;

    fs.writeFileSync(path.join(paths.dist.js, 'config.js'), configContent);
}

// Main build function
async function build() {
    try {
        console.log('Starting build process...');
        
        // Clean and create directories
        cleanDist();
        createDirectories();
        
        // Generate favicons
        generateFavicons();
        
        // Generate config.js
        generateConfig();
        
        // Copy and process files
        await copyFiles();
        
        console.log('Build completed successfully!');
        console.log('Production files are in the dist/ directory');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Run build
build(); 