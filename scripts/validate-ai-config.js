#!/usr/bin/env node

/**
 * AI Configuration Validation Script
 * Validates AI API keys, model availability, and agent configurations
 */

const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Validation results
const results = {
  passed: [],
  warnings: [],
  failed: []
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Add result
 */
function addResult(category, message) {
  results[category].push(message);
}

/**
 * Check if environment variable exists
 */
function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  
  if (!value) {
    if (required) {
      addResult('failed', `Missing required environment variable: ${varName}`);
      return false;
    } else {
      addResult('warnings', `Optional environment variable not set: ${varName}`);
      return false;
    }
  }
  
  if (value.includes('placeholder') || value === 'your-' + varName.toLowerCase()) {
    addResult('warnings', `${varName} appears to be a placeholder value`);
    return false;
  }
  
  addResult('passed', `${varName} is configured`);
  return true;
}

/**
 * Validate OpenAI API key
 */
async function validateOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey.includes('placeholder')) {
    addResult('failed', 'OpenAI API key not configured');
    return false;
  }
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const models = JSON.parse(data);
            const hasGPT4 = models.data.some(m => m.id.includes('gpt-4'));
            
            if (hasGPT4) {
              addResult('passed', 'OpenAI API key is valid and GPT-4 is available');
            } else {
              addResult('warnings', 'OpenAI API key is valid but GPT-4 may not be available');
            }
            resolve(true);
          } catch (e) {
            addResult('failed', 'Failed to parse OpenAI response');
            resolve(false);
          }
        } else if (res.statusCode === 401) {
          addResult('failed', 'OpenAI API key is invalid');
          resolve(false);
        } else {
          addResult('failed', `OpenAI API returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      addResult('failed', `Failed to connect to OpenAI: ${error.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Validate Anthropic API key
 */
async function validateAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey.includes('placeholder')) {
    addResult('warnings', 'Anthropic API key not configured (optional)');
    return true; // Not required
  }
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'claude-3-haiku-20240307',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10
    });
    
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          addResult('passed', 'Anthropic API key is valid');
          resolve(true);
        } else if (res.statusCode === 401) {
          addResult('failed', 'Anthropic API key is invalid');
          resolve(false);
        } else {
          const error = JSON.parse(data);
          addResult('failed', `Anthropic API error: ${error.error?.message || res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      addResult('failed', `Failed to connect to Anthropic: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Check agent configurations
 */
function checkAgentConfigs() {
  const configPath = path.join(process.cwd(), 'agent-configs.json');
  
  if (!fs.existsSync(configPath)) {
    addResult('failed', 'agent-configs.json not found');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check if all required agents are configured
    const requiredAgents = ['campaign-creator', 'optimization', 'reporting', 'creative'];
    const configuredAgents = Object.keys(config.agents || {});
    
    requiredAgents.forEach(agent => {
      if (configuredAgents.includes(agent)) {
        addResult('passed', `Agent configured: ${agent}`);
      } else {
        addResult('warnings', `Agent not configured: ${agent}`);
      }
    });
    
    // Validate agent settings
    Object.entries(config.agents || {}).forEach(([name, settings]) => {
      if (!settings.enabled) {
        addResult('warnings', `Agent disabled: ${name}`);
      }
      
      if (!settings.model) {
        addResult('failed', `Agent ${name} missing model configuration`);
      }
    });
    
    return true;
  } catch (e) {
    addResult('failed', `Invalid agent-configs.json: ${e.message}`);
    return false;
  }
}

/**
 * Check Python environment
 */
async function checkPythonEnvironment() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    
    // Check Python version
    exec('python --version', (error, stdout, stderr) => {
      if (error) {
        addResult('failed', 'Python not found in PATH');
        resolve(false);
        return;
      }
      
      const version = stdout || stderr;
      if (version.includes('Python 3.')) {
        addResult('passed', `Python installed: ${version.trim()}`);
        
        // Check required packages
        const requiredPackages = [
          'langchain',
          'langchain-anthropic',
          'langchain-openai',
          'langgraph'
        ];
        
        exec('pip list --format=json', (error, stdout) => {
          if (error) {
            addResult('warnings', 'Could not check Python packages');
            resolve(true);
            return;
          }
          
          try {
            const installedPackages = JSON.parse(stdout);
            const installedNames = installedPackages.map(p => p.name);
            
            requiredPackages.forEach(pkg => {
              if (installedNames.includes(pkg)) {
                addResult('passed', `Python package installed: ${pkg}`);
              } else {
                addResult('failed', `Missing Python package: ${pkg}`);
              }
            });
            
            resolve(true);
          } catch (e) {
            addResult('warnings', 'Could not parse pip list output');
            resolve(true);
          }
        });
      } else {
        addResult('failed', 'Python 3.x required');
        resolve(false);
      }
    });
  });
}

/**
 * Check agent files exist
 */
function checkAgentFiles() {
  const agentsDir = path.join(process.cwd(), 'src', 'agents');
  
  if (!fs.existsSync(agentsDir)) {
    addResult('failed', 'src/agents directory not found');
    return false;
  }
  
  const expectedAgents = [
    'campaign-creator.py',
    'optimization.py',
    'reporting.py',
    'creative.py'
  ];
  
  const existingAgents = fs.readdirSync(agentsDir);
  
  expectedAgents.forEach(agent => {
    if (existingAgents.includes(agent)) {
      addResult('passed', `Agent file exists: ${agent}`);
    } else {
      addResult('warnings', `Agent file missing: ${agent}`);
    }
  });
  
  return true;
}

/**
 * Run all validations
 */
async function runValidation() {
  log('\n🤖 MetaAds AI Configuration Validator\n', 'blue');
  
  // Check environment variables
  log('Checking environment variables...', 'yellow');
  checkEnvVar('AI_PROVIDER', true);
  checkEnvVar('OPENAI_API_KEY', process.env.AI_PROVIDER === 'openai');
  checkEnvVar('ANTHROPIC_API_KEY', process.env.AI_PROVIDER === 'anthropic');
  
  // Validate API keys
  log('\nValidating API keys...', 'yellow');
  await validateOpenAI();
  await validateAnthropic();
  
  // Check configurations
  log('\nChecking agent configurations...', 'yellow');
  checkAgentConfigs();
  
  // Check Python environment
  log('\nChecking Python environment...', 'yellow');
  await checkPythonEnvironment();
  
  // Check agent files
  log('\nChecking agent files...', 'yellow');
  checkAgentFiles();
  
  // Display results
  log('\n📊 Validation Results\n', 'blue');
  
  if (results.passed.length > 0) {
    log(`✅ Passed (${results.passed.length}):`, 'green');
    results.passed.forEach(msg => log(`   ${msg}`, 'green'));
  }
  
  if (results.warnings.length > 0) {
    log(`\n⚠️  Warnings (${results.warnings.length}):`, 'yellow');
    results.warnings.forEach(msg => log(`   ${msg}`, 'yellow'));
  }
  
  if (results.failed.length > 0) {
    log(`\n❌ Failed (${results.failed.length}):`, 'red');
    results.failed.forEach(msg => log(`   ${msg}`, 'red'));
  }
  
  // Summary
  const totalChecks = results.passed.length + results.warnings.length + results.failed.length;
  const successRate = Math.round((results.passed.length / totalChecks) * 100);
  
  log('\n📈 Summary:', 'blue');
  log(`   Total checks: ${totalChecks}`);
  log(`   Success rate: ${successRate}%`);
  
  if (results.failed.length === 0) {
    log('\n✨ AI configuration is valid!', 'green');
    process.exit(0);
  } else {
    log('\n❗ Please fix the failed checks before proceeding.', 'red');
    process.exit(1);
  }
}

// Run validation
runValidation().catch(error => {
  log(`\n💥 Validation script error: ${error.message}`, 'red');
  process.exit(1);
});