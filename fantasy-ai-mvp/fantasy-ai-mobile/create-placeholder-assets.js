const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const iconSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#0F172A"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial" font-size="400" font-weight="bold" fill="#3B82F6">FA</text>
</svg>`;

// Create assets directory
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}

// Save placeholder files
fs.writeFileSync('assets/icon.svg', iconSvg);
fs.writeFileSync('assets/splash.svg', iconSvg);
fs.writeFileSync('assets/adaptive-icon.svg', iconSvg);
fs.writeFileSync('assets/favicon.svg', iconSvg);

// Create PNG placeholders (1x1 pixel)
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

fs.writeFileSync('assets/icon.png', png);
fs.writeFileSync('assets/splash.png', png);
fs.writeFileSync('assets/adaptive-icon.png', png);
fs.writeFileSync('assets/favicon.png', png);

console.log('✅ Created placeholder assets');