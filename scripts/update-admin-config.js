#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Meta Ads Admin Configuration Updater');
console.log('=====================================\n');

// Function to read .env file
function readEnvFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

// Function to write .env file
function writeEnvFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Function to update or add environment variable
function updateEnvVar(content, key, value) {
  const lines = content.split('\n');
  let updated = false;
  
  const updatedLines = lines.map(line => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });
  
  if (!updated) {
    updatedLines.push(`${key}=${value}`);
  }
  
  return updatedLines.join('\n');
}

// Main function
function updateAdminConfig() {
  const envFiles = ['.env', '.env.local', '.env.production'];
  const targetEmail = 'jaime@outletmedia.net';
  
  console.log(`Target email to add as admin: ${targetEmail}\n`);
  
  envFiles.forEach(envFile => {
    const filePath = path.join(process.cwd(), envFile);
    console.log(`Processing ${envFile}...`);
    
    let content = readEnvFile(filePath);
    const originalContent = content;
    
    // Check current admin emails
    const adminEmailsMatch = content.match(/NEXT_PUBLIC_ADMIN_EMAILS=(.+)/);
    const currentAdmins = adminEmailsMatch ? adminEmailsMatch[1] : '';
    
    if (currentAdmins) {
      console.log(`  Current admin emails: ${currentAdmins}`);
      
      const adminList = currentAdmins.split(',').map(e => e.trim());
      if (!adminList.includes(targetEmail)) {
        adminList.push(targetEmail);
        const newAdminEmails = adminList.join(',');
        content = updateEnvVar(content, 'NEXT_PUBLIC_ADMIN_EMAILS', newAdminEmails);
        console.log(`  Updated admin emails: ${newAdminEmails}`);
      } else {
        console.log(`  ${targetEmail} is already an admin`);
      }
    } else {
      // Add new admin emails variable
      content = updateEnvVar(content, 'NEXT_PUBLIC_ADMIN_EMAILS', `jaime@outletmedia.com,${targetEmail}`);
      console.log(`  Added admin emails: jaime@outletmedia.com,${targetEmail}`);
    }
    
    // Enable test auth bypass for development
    if (envFile !== '.env.production') {
      content = updateEnvVar(content, 'ENABLE_TEST_AUTH_BYPASS', 'true');
      content = updateEnvVar(content, 'TEST_AUTH_BYPASS_EMAIL', targetEmail);
      content = updateEnvVar(content, 'TEST_AUTH_BYPASS_TOKEN', 'test-bypass-token');
      console.log('  Enabled test auth bypass');
    }
    
    // Write back if changed
    if (content !== originalContent) {
      writeEnvFile(filePath, content);
      console.log(`  ✓ ${envFile} updated successfully`);
    } else {
      console.log(`  - No changes needed for ${envFile}`);
    }
    
    console.log('');
  });
  
  console.log('\nConfiguration update complete!');
  console.log('\nNext steps:');
  console.log('1. Restart your development server');
  console.log('2. Try logging in with jaime@outletmedia.net');
  console.log('3. Check admin access at /dashboard/admin');
  console.log('\nFor testing without login:');
  console.log('- Open /public/test-api.html in your browser');
  console.log('- Use the test endpoints with bypass token');
}

// Run the update
updateAdminConfig();