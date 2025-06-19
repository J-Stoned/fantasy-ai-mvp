const fs = require('fs');

// Create simple PNG data for icons using data URLs
// This creates basic icons that will work for Chrome Web Store submission

const createIcon = (size, content) => {
  // Create a simple canvas-based icon
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad1)" stroke="#4c51bf" stroke-width="1"/>
    ${content}
  </svg>`;
  
  return canvas;
};

// Create different sized icons with appropriate detail levels
const icon16 = createIcon(16, `
  <rect x="6" y="4" width="4" height="6" rx="2" fill="white"/>
  <rect x="7" y="10" width="2" height="4" fill="white"/>
`);

const icon48 = createIcon(48, `
  <rect x="18" y="12" width="12" height="18" rx="6" fill="white" stroke="#333" stroke-width="1"/>
  <rect x="22" y="30" width="4" height="8" fill="#333"/>
  <rect x="16" y="36" width="16" height="2" fill="#333"/>
  <circle cx="12" cy="8" r="3" fill="#ed8936"/>
  <ellipse cx="36" cy="8" rx="3" ry="2" fill="#8b4513"/>
`);

const icon128 = fs.readFileSync('./public/icons/icon.svg', 'utf8');

// Write the icons
fs.writeFileSync('./public/icons/icon16.svg', icon16);
fs.writeFileSync('./public/icons/icon48.svg', icon48);

console.log('Icon files created successfully!');
console.log('Note: These are SVG files. For Chrome Web Store, you may need to convert to PNG.');
console.log('You can use online converters or ask your team to convert them to PNG format.');