const fs = require('fs');
const path = require('path');

// Copy directory recursively
function copyDirectorySync(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
            copyDirectorySync(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

// Copy assets after TypeScript compilation
function copyAssets() {
    const sourceHtml = path.join(__dirname, 'src', 'renderer', 'index.html');
    const sourceCss = path.join(__dirname, 'src', 'renderer', 'styles.css');
    const sourceJs = path.join(__dirname, 'src', 'renderer', 'renderer-browser.js');
    const destHtml = path.join(__dirname, 'dist', 'renderer', 'index.html');
    const destCss = path.join(__dirname, 'dist', 'renderer', 'styles.css');
    const destJs = path.join(__dirname, 'dist', 'renderer', 'renderer-browser.js');

    // Ensure renderer directory exists
    const rendererDir = path.join(__dirname, 'dist', 'renderer');
    if (!fs.existsSync(rendererDir)) {
        fs.mkdirSync(rendererDir, { recursive: true });
    }

    // Copy files
    fs.copyFileSync(sourceHtml, destHtml);
    fs.copyFileSync(sourceCss, destCss);
    fs.copyFileSync(sourceJs, destJs);

    // Copy assets directory
    const assetsSource = path.join(__dirname, 'assets');
    const assetsDest = path.join(__dirname, 'dist', 'assets');
    if (fs.existsSync(assetsSource)) {
        copyDirectorySync(assetsSource, assetsDest);
        console.log('Assets directory copied successfully!');
    }

    console.log('All assets copied successfully!');
}

copyAssets();