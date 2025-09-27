const fs = require('fs');
const path = require('path');

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

    console.log('Assets copied successfully!');
}

copyAssets();