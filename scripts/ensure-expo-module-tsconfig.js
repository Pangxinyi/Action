#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '..', 'node_modules', 'expo-module-scripts');
const target = path.join(targetDir, 'tsconfig.base.json');

const content = JSON.stringify({
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true
  }
}, null, 2) + '\n';

try {
  if (!fs.existsSync(targetDir)) {
    // node_modules not installed yet
    process.exit(0);
  }

  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (existing !== content) {
    fs.writeFileSync(target, content, 'utf8');
    console.log('Patched expo-module-scripts tsconfig.base.json');
  }
} catch (err) {
  console.error('Failed to ensure expo-module-scripts tsconfig:', err);
  process.exit(1);
}
