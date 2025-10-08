#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tags to wrap WeFa instructions
const START_TAG = '<!-- START: WeFa Instructions -->';
const END_TAG = '<!-- END: WeFa Instructions -->';

/**
 * Prompt user for destination file path
 * @param {string} defaultPath - Default file path to use
 * @returns {Promise<string>} The chosen file path
 */
async function promptForDestination(defaultPath) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      `📂 Enter destination file path (or press Enter for default: ${defaultPath}): `,
      (answer) => {
        rl.close();
        resolve(answer.trim() || defaultPath);
      }
    );
  });
}

/**
 * Replace or add tagged content in the destination file
 * @param existingContent - Current content of the file
 * @param newContent - New content to insert between tags
 * @returns {string} Updated file content
 */
function replaceTaggedContent(existingContent, newContent) {
  const taggedContent = `${START_TAG}\n${newContent}\n${END_TAG}`;

  // Check if tags already exist in the file
  const startIndex = existingContent.indexOf(START_TAG);
  const endIndex = existingContent.indexOf(END_TAG);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Replace existing tagged content
    const beforeTags = existingContent.substring(0, startIndex);
    const afterTags = existingContent.substring(endIndex + END_TAG.length);
    return beforeTags + taggedContent + afterTags;
  } else {
    // Add new tagged content
    const separator = existingContent.trim() ? '\n\n' : '';
    return existingContent + separator + taggedContent;
  }
}

/**
 * Find the project root by looking for package.json file
 * Traverses up the directory tree from the current working directory
 * @param startPath - Start path for the search
 */
function findProjectRoot(startPath = process.cwd()) {
  let currentPath = resolve(startPath);

  while (currentPath !== dirname(currentPath)) {
    const packageJsonPath = join(currentPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }

  // Fallback to current working directory if no package.json found
  return process.cwd();
}

/**
 * Install WeFa Copilot Instructions
 */
async function installCopilotInstructions() {
  try {
    // Path to the source copilot instructions file
    const sourceFile = join(__dirname, 'files', 'copilot-instructions.md');

    // Find the project root directory
    const projectRoot = findProjectRoot();

    // Default target file path
    const defaultTargetFile = join(projectRoot, '.github', 'copilot-instructions.md');

    // Prompt user for destination file
    const targetFile = await promptForDestination(defaultTargetFile);
    const targetDir = dirname(resolve(targetFile));

    console.log('🚀 Installing WeFa Copilot Instructions...');

    // Check if source file exists
    if (!existsSync(sourceFile)) {
      console.error('❌ Error: Source copilot-instructions.md not found in the package.');
      process.exit(1);
    }

    // Read the source content
    const sourceContent = await readFile(sourceFile, 'utf-8');

    // Ensure .github directory exists
    if (!existsSync(targetDir)) {
      console.log('📁 Creating .github directory...');
      await mkdir(targetDir, { recursive: true });
    }

    // Read existing content if file exists
    let existingContent = '';
    if (existsSync(targetFile)) {
      console.log(`📄 Reading existing ${targetFile}...`);
      existingContent = await readFile(targetFile, 'utf-8');
    }

    // Use tagged content replacement
    const updatedContent = replaceTaggedContent(existingContent, sourceContent);

    // Write the updated content
    await writeFile(targetFile, updatedContent, 'utf-8');

    const wasReplaced = existingContent.includes(START_TAG);
    const action = wasReplaced ? 'updated' : 'added';

    console.log(`✅ Successfully ${action} WeFa instructions in ${targetFile}`);
    console.log('🎯 The instructions include:');
    console.log('   • Component priority hierarchy (WeFa > PrimeVue > HTML)');
    console.log('   • Tailwind CSS only styling rules');
    console.log('   • Implementation examples and best practices');
    console.log('   • Decision flow charts and enforcement checklists');
    console.log('');
    console.log(`📖 Review the file at: ${targetFile}`);
    console.log(`🔖 Content is wrapped in tags for easy updates`);

  } catch (error) {
    console.error('❌ Error installing copilot instructions:', error.message);
    process.exit(1);
  }
}

// Run the installer
installCopilotInstructions();
