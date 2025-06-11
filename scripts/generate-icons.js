#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple SVG icon template
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold">
    MA
  </text>
</svg>`;
};

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
sizes.forEach(size => {
  const svg = createIcon(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Create a simple HTML file to convert SVG to PNG
const html = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .icon { display: inline-block; margin: 10px; text-align: center; }
    .icon img { display: block; margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>Meta Ads Dashboard Icons</h1>
  <p>Right-click and save each icon as PNG:</p>
  ${sizes.map(size => `
    <div class="icon">
      <img src="icons/icon-${size}x${size}.svg" width="${size}" height="${size}" />
      <div>${size}x${size}</div>
    </div>
  `).join('')}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../public/icon-preview.html'), html);
console.log('\nIcon preview created at: public/icon-preview.html');
console.log('Note: For production, convert SVG icons to PNG format');