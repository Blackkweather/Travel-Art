#!/usr/bin/env node

/**
 * Bundle size analysis script
 * Run after building: npm run build && node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../frontend/dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(assetsPath)) {
  console.error('❌ Build assets not found. Please run "npm run build:frontend" first.');
  process.exit(1);
}

const files = fs.readdirSync(assetsPath);
const jsFiles = files.filter(f => f.endsWith('.js'));
const cssFiles = files.filter(f => f.endsWith('.css'));

console.log('\n📦 Bundle Size Analysis\n');
console.log('='.repeat(60));

let totalSize = 0;

// Analyze JS files
console.log('\n📄 JavaScript Files:');
console.log('-'.repeat(60));
jsFiles.forEach(file => {
  const filePath = path.join(assetsPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  totalSize += stats.size;
  
  const sizeStr = stats.size > 1024 * 1024 
    ? `${sizeMB} MB` 
    : `${sizeKB} KB`;
  
  const warning = stats.size > 500 * 1024 ? '⚠️  ' : '   ';
  console.log(`${warning}${file.padEnd(40)} ${sizeStr.padStart(10)}`);
});

// Analyze CSS files
console.log('\n🎨 CSS Files:');
console.log('-'.repeat(60));
cssFiles.forEach(file => {
  const filePath = path.join(assetsPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  totalSize += stats.size;
  console.log(`   ${file.padEnd(40)} ${sizeKB.padStart(10)} KB`);
});

// Total size
console.log('\n' + '='.repeat(60));
const totalKB = (totalSize / 1024).toFixed(2);
const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
const totalStr = totalSize > 1024 * 1024 
  ? `${totalMB} MB` 
  : `${totalKB} KB`;

console.log(`Total Bundle Size: ${totalStr}`);

// Recommendations
console.log('\n💡 Recommendations:');
if (totalSize > 2 * 1024 * 1024) {
  console.log('⚠️  Bundle is larger than 2MB. Consider:');
  console.log('   - Code splitting');
  console.log('   - Lazy loading routes');
  console.log('   - Tree shaking unused code');
  console.log('   - Using dynamic imports');
} else if (totalSize > 1 * 1024 * 1024) {
  console.log('⚠️  Bundle is larger than 1MB. Consider optimization.');
} else {
  console.log('✅ Bundle size is good!');
}

console.log('\n');





