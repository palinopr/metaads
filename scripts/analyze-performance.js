#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Meta Ads Dashboard Performance Analysis\n');

// Analyze component sizes
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check component sizes
const componentsDir = path.join(__dirname, '../components');
const components = fs.readdirSync(componentsDir)
  .filter(file => file.endsWith('.tsx'))
  .map(file => ({
    name: file,
    size: getFileSize(path.join(componentsDir, file))
  }))
  .sort((a, b) => b.size - a.size);

console.log('📊 Largest Components:');
components.slice(0, 10).forEach(comp => {
  console.log(`  ${comp.name}: ${formatBytes(comp.size)}`);
});

// Check for performance patterns
console.log('\n⚡ Performance Checks:');

const checksToRun = [
  {
    name: 'Unoptimized imports',
    pattern: /import \* as/g,
    message: 'Found wildcard imports (increases bundle size)'
  },
  {
    name: 'Missing React.memo',
    pattern: /export (default )?function (?!.*React\.memo)/g,
    message: 'Components without React.memo'
  },
  {
    name: 'Large inline functions',
    pattern: /onClick=\{[^}]{100,}\}/g,
    message: 'Large inline functions in render'
  },
  {
    name: 'Direct state updates',
    pattern: /setState\([^(]+\)/g,
    message: 'Potential unnecessary re-renders'
  }
];

let issuesFound = 0;

components.forEach(comp => {
  const filePath = path.join(componentsDir, comp.name);
  const content = fs.readFileSync(filePath, 'utf8');
  
  checksToRun.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches && matches.length > 0) {
      console.log(`  ⚠️  ${comp.name}: ${check.message} (${matches.length} instances)`);
      issuesFound++;
    }
  });
});

if (issuesFound === 0) {
  console.log('  ✅ No major performance issues detected');
}

// Check bundle dependencies
console.log('\n📦 Heavy Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const heavyDeps = [
    { name: 'recharts', concern: 'Large charting library' },
    { name: '@radix-ui', concern: 'Multiple UI components' },
    { name: 'date-fns', concern: 'Date manipulation library' },
    { name: '@anthropic-ai/sdk', concern: 'AI SDK' }
  ];
  
  heavyDeps.forEach(dep => {
    const depName = Object.keys(packageJson.dependencies || {}).find(d => d.includes(dep.name));
    if (depName) {
      console.log(`  📌 ${depName}: ${dep.concern}`);
    }
  });
} catch (e) {
  console.log('  ❌ Could not analyze dependencies');
}

// Optimization suggestions
console.log('\n💡 Optimization Suggestions:');
console.log('  1. Use dynamic imports for heavy components (charts, AI insights)');
console.log('  2. Implement virtual scrolling for large campaign lists');
console.log('  3. Add request debouncing for search/filter operations');
console.log('  4. Use React.memo for campaign rows and cards');
console.log('  5. Cache API responses in localStorage with TTL');

console.log('\n✨ Run specific optimizations:');
console.log('  - "Optimize campaign table rendering"');
console.log('  - "Add caching to Meta API calls"');
console.log('  - "Implement lazy loading for charts"');
console.log('  - "Add debouncing to search inputs"');

console.log('\n📈 Next Steps:');
console.log('  Pick ONE optimization from above and request it specifically.');
console.log('  This avoids API rate limits in the terminal.\n');