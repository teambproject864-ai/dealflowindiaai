import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("    CI/CD API KEY SECURITY AUDIT & POLICY CHECK   ");
console.log("=================================================\n");

const WORKSPACE_ROOT = process.cwd();

// Secret pattern matchers
const SUSPICIOUS_PATTERNS = [
  { name: 'OpenAI/Kimi API Key', regex: /sk-[a-zA-Z0-9]{25,}/g },
  { name: 'OpenRouter API Key', regex: /sk-or-v1-[a-f0-9]{64}/g },
  { name: 'HuggingFace Token', regex: /hf_[a-zA-Z0-9]{25,}/g },
  { name: 'Nvidia API Key', regex: /nvapi-[a-zA-Z0-9_\-]{30,}/g },
  { name: 'Pinecone API Key', regex: /pcsk_[a-zA-Z0-9_\-]{30,}/g },
  { name: 'Recall API Key', regex: /fac2f6[a-zA-Z0-9]{30,}/g },
];

// Folders and files to scan
const TARGET_DIRS = ['app', 'lib', 'components', 'scripts', 'python-agent-service', 'functions'];
const IGNORED_FILES = [
  '.env.local',
  '.env.local.example',
  'package-lock.json',
  'tsconfig.tsbuildinfo',
  'ci-api-key-check.ts'
];

let totalViolations = 0;

function scanFile(filePath: string) {
  const relativePath = path.relative(WORKSPACE_ROOT, filePath);
  if (IGNORED_FILES.some(ignored => relativePath.endsWith(ignored))) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of SUSPICIOUS_PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        // Filter out safe placeholder strings or test dummy keys
        const nonCompliant = matches.filter(m => 
          !m.includes('sk-1234567890abcdef') && 
          !m.includes('mock-key') && 
          !m.includes('YOUR_KEY_HERE')
        );

        if (nonCompliant.length > 0) {
          console.error(`❌ VIOLATION in [${relativePath}]: Hardcoded ${pattern.name} detected (${nonCompliant.length} instance(s)). All keys must be exclusively stored in .env.local.`);
          totalViolations += nonCompliant.length;
        }
      }
    }
  } catch (err) {
    // Ignore binary or unreadable files
  }
}

function scanDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== 'node_modules' &&
        entry.name !== '.next' &&
        entry.name !== '.git' &&
        entry.name !== 'venv' &&
        entry.name !== '.venv' &&
        entry.name !== '__pycache__'
      ) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}


// 1. Audit Source Directories
console.log("1. Auditing codebase files for hardcoded API keys...");
for (const dir of TARGET_DIRS) {
  scanDirectory(path.join(WORKSPACE_ROOT, dir));
}

// 2. Audit Tracked Environment Files
console.log("2. Auditing version-controlled environment templates (.env)...");
const dotEnvPath = path.join(WORKSPACE_ROOT, '.env');
if (fs.existsSync(dotEnvPath)) {
  const dotEnvContent = fs.readFileSync(dotEnvPath, 'utf8');
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.regex.test(dotEnvContent)) {
      console.error(`❌ VIOLATION in [.env]: Plaintext API key detected. Keys must be placed exclusively in .env.local.`);
      totalViolations++;
    }
  }
}

// 3. Verify .gitignore Configuration
console.log("3. Verifying .gitignore configuration for .env.local protection...");
const gitIgnorePath = path.join(WORKSPACE_ROOT, '.gitignore');
if (fs.existsSync(gitIgnorePath)) {
  const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
  if (!gitIgnoreContent.includes('.env.local')) {
    console.error(`❌ VIOLATION in [.gitignore]: '.env.local' is not explicitly listed in .gitignore!`);
    totalViolations++;
  }
}

console.log("\n=================================================");
if (totalViolations === 0) {
  console.log(" ✅ CI/CD SECURITY CHECK PASSED: Zero policy violations.");
  console.log("=================================================\n");
  process.exit(0);
} else {
  console.error(` ❌ CI/CD SECURITY CHECK FAILED: ${totalViolations} violation(s) detected.`);
  console.error(" Please remove all hardcoded keys and store them exclusively in .env.local.");
  console.log("=================================================\n");
  process.exit(1);
}
