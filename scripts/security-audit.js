#!/usr/bin/env node

/**
 * Security audit script
 * Checks for common security issues in the codebase
 */

const fs = require('fs');
const path = require('path');

const issues = [];
const warnings = [];

// Check for hardcoded secrets
function checkHardcodedSecrets() {
  const filesToCheck = [
    path.join(__dirname, '../backend/src'),
    path.join(__dirname, '../frontend/src'),
  ];
  
  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
    /sk_live_/gi,
    /pk_live_/gi,
    /sk_test_/gi,
    /pk_test_/gi,
  ];
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    secretPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's a comment or example
          if (!match.includes('example') && !match.includes('TODO') && !match.includes('FIXME')) {
            warnings.push({
              file: filePath,
              issue: 'Potential hardcoded secret',
              match: match.substring(0, 50),
            });
          }
        });
      }
    });
  }
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        checkFile(filePath);
      }
    });
  }
  
  filesToCheck.forEach(dir => walkDir(dir));
}

// Check for SQL injection risks
function checkSQLInjection() {
  const backendPath = path.join(__dirname, '../backend/src');
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for raw SQL queries with string concatenation
    if (content.includes('prisma.$queryRaw') || content.includes('prisma.$executeRaw')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('$queryRaw') || line.includes('$executeRaw')) {
          // Check if using template literals with user input
          if (line.includes('${') && (line.includes('req.') || line.includes('body.') || line.includes('query.'))) {
            warnings.push({
              file: filePath,
              line: index + 1,
              issue: 'Potential SQL injection risk - raw query with user input',
              code: line.trim(),
            });
          }
        }
      });
    }
  }
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts')) {
        checkFile(filePath);
      }
    });
  }
  
  walkDir(backendPath);
}

// Check security headers
function checkSecurityHeaders() {
  const indexPath = path.join(__dirname, '../backend/src/index.ts');
  
  if (!fs.existsSync(indexPath)) {
    issues.push({
      file: 'backend/src/index.ts',
      issue: 'Security headers configuration not found',
    });
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  const requiredHeaders = [
    'helmet',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
  ];
  
  requiredHeaders.forEach(header => {
    if (!content.includes(header)) {
      warnings.push({
        file: indexPath,
        issue: `Missing security header: ${header}`,
      });
    }
  });
}

// Run checks
console.log('🔒 Running security audit...\n');

checkHardcodedSecrets();
checkSQLInjection();
checkSecurityHeaders();

// Report results
console.log('='.repeat(60));
console.log('Security Audit Results');
console.log('='.repeat(60));

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ No security issues found!');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ Critical issues: ${issues.length}`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.issue}`);
      if (issue.file) console.log(`   File: ${issue.file}`);
      if (issue.line) console.log(`   Line: ${issue.line}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    warnings.slice(0, 10).forEach((warning, index) => {
      console.log(`\n${index + 1}. ${warning.issue}`);
      if (warning.file) console.log(`   File: ${warning.file}`);
      if (warning.line) console.log(`   Line: ${warning.line}`);
      if (warning.code) console.log(`   Code: ${warning.code}`);
    });
    
    if (warnings.length > 10) {
      console.log(`\n... and ${warnings.length - 10} more warnings`);
    }
  }
}

console.log('\n💡 Security Recommendations:');
console.log('   - Use environment variables for all secrets');
console.log('   - Enable HSTS in production');
console.log('   - Implement rate limiting per user');
console.log('   - Add input sanitization');
console.log('   - Use parameterized queries (Prisma handles this)');
console.log('   - Regular dependency updates');
console.log('   - Enable CSP reporting\n');

process.exit(issues.length > 0 ? 1 : 0);







