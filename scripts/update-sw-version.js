const fs = require('fs');
const path = require('path');

// Path to service worker file
const swPath = path.join(__dirname, '../public/sw.js');

try {
  // Read current service worker content
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Generate new version based on timestamp
  const newVersion = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Replace the version string
  const updatedContent = swContent.replace(
    /const SW_VERSION = ['"].*['"]/,
    `const SW_VERSION = '${newVersion}'`
  );
  
  // Write updated content back
  fs.writeFileSync(swPath, updatedContent);
  
  console.log(`✅ Updated Service Worker version to: ${newVersion}`);
  console.log('   This will force cache invalidation on next deployment');
} catch (error) {
  console.error('❌ Failed to update Service Worker version:', error);
  process.exit(1);
}