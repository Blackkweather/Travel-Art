#!/usr/bin/env node

/**
 * Accessibility audit script
 * Run with: node scripts/a11y-audit.js
 * 
 * This script checks for common accessibility issues
 */

const fs = require('fs');
const path = require('path');

const issues = [];
const warnings = [];

// Check for alt text in image components
function checkImageAltText() {
  const componentsPath = path.join(__dirname, '../frontend/src/components');
  const pagesPath = path.join(__dirname, '../frontend/src/pages');
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for img tags without alt
      if (line.includes('<img') && !line.includes('alt=') && !line.includes('alt =')) {
        warnings.push({
          file: filePath,
          line: index + 1,
          issue: 'Image without alt attribute',
          code: line.trim(),
        });
      }
      
      // Check for buttons without aria-label or text
      if (line.includes('<button') && !line.includes('aria-label') && !line.includes('>')) {
        const nextLines = lines.slice(index, index + 3).join(' ');
        if (!nextLines.match(/>[^<]+</)) {
          warnings.push({
            file: filePath,
            line: index + 1,
            issue: 'Button without aria-label or visible text',
            code: line.trim(),
          });
        }
      }
    });
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        checkFile(filePath);
      }
    });
  }
  
  if (fs.existsSync(componentsPath)) walkDir(componentsPath);
  if (fs.existsSync(pagesPath)) walkDir(pagesPath);
}

// Check for form labels
function checkFormLabels() {
  const componentsPath = path.join(__dirname, '../frontend/src/components');
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let inForm = false;
    
    lines.forEach((line, index) => {
      if (line.includes('<form')) inForm = true;
      if (line.includes('</form>')) inForm = false;
      
      if (inForm && (line.includes('<input') || line.includes('<textarea') || line.includes('<select'))) {
        const hasId = line.includes('id=');
        const hasLabel = content.includes(`label[for=`) || content.includes(`<label`);
        
        if (hasId && !hasLabel) {
          warnings.push({
            file: filePath,
            line: index + 1,
            issue: 'Form input without associated label',
            code: line.trim(),
          });
        }
      }
    });
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        checkFile(filePath);
      }
    });
  }
  
  if (fs.existsSync(componentsPath)) walkDir(componentsPath);
}

// Run checks
console.log('🔍 Running accessibility audit...\n');

checkImageAltText();
checkFormLabels();

// Report results
console.log('='.repeat(60));
console.log('Accessibility Audit Results');
console.log('='.repeat(60));

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ No accessibility issues found!');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ Issues found: ${issues.length}`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.issue}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Line: ${issue.line}`);
      console.log(`   Code: ${issue.code}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    warnings.slice(0, 10).forEach((warning, index) => {
      console.log(`\n${index + 1}. ${warning.issue}`);
      console.log(`   File: ${warning.file}`);
      console.log(`   Line: ${warning.line}`);
      console.log(`   Code: ${warning.code}`);
    });
    
    if (warnings.length > 10) {
      console.log(`\n... and ${warnings.length - 10} more warnings`);
    }
  }
}

console.log('\n💡 Recommendations:');
console.log('   - Use axe DevTools browser extension for comprehensive testing');
console.log('   - Test with screen readers (NVDA, JAWS, VoiceOver)');
console.log('   - Test keyboard-only navigation');
console.log('   - Verify color contrast ratios');
console.log('   - Run automated tests with Cypress a11y plugin\n');

process.exit(issues.length > 0 ? 1 : 0);







