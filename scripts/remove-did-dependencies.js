#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive D-ID Dependencies Cleanup Script
 * Removes all D-ID related files and dependencies from the project
 */

class DIDCleanup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.removedFiles = [];
    this.modifiedFiles = [];
    this.errors = [];
  }

  /**
   * Main cleanup execution
   */
  async execute() {
    console.log('🧹 Starting D-ID Dependencies Cleanup...\n');

    try {
      // Frontend cleanup
      await this.cleanupFrontendFiles();
      await this.updateAppJsx();
      await this.updatePackageJson();

      // Backend cleanup
      await this.cleanupBackendFiles();

      // Generate summary
      this.generateSummary();

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      this.errors.push(error.message);
    }

    this.printResults();
  }

  /**
   * Remove all D-ID related frontend files
   */
  async cleanupFrontendFiles() {
    console.log('📁 Cleaning up frontend D-ID files...');

    const filesToRemove = [
      // D-ID Components directory
      'src/components/d-id',
      
      // D-ID Hooks directory
      'src/hooks/d-id',
      
      // D-ID Services directory (if exists)
      'src/services/d-id',
      
      // Individual D-ID components
      'src/components/DidEmbeddedAgent.jsx',
      'src/components/TestDidIntegration.jsx',
      
      // D-ID Pages
      'src/pages/DIDStreamingPage.jsx',
      'src/pages/EnhancedDidAgentPage.jsx',
      'src/pages/NautiBouysDIDAgentPage.jsx',
      'src/pages/TestDidPage.jsx'
    ];

    for (const fileOrDir of filesToRemove) {
      const fullPath = path.join(this.frontendPath, fileOrDir);
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            await this.removeDirectory(fullPath);
            console.log(`  ✅ Removed directory: ${fileOrDir}`);
          } else {
            fs.unlinkSync(fullPath);
            console.log(`  ✅ Removed file: ${fileOrDir}`);
          }
          this.removedFiles.push(fileOrDir);
        } else {
          console.log(`  ⚠️  Not found: ${fileOrDir}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to remove ${fileOrDir}:`, error.message);
        this.errors.push(`Failed to remove ${fileOrDir}: ${error.message}`);
      }
    }
  }

  /**
   * Recursively remove directory
   */
  async removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Update App.jsx to remove D-ID imports and routes
   */
  async updateAppJsx() {
    console.log('\n📝 Updating App.jsx...');

    const appJsxPath = path.join(this.frontendPath, 'src/App.jsx');
    
    try {
      let content = fs.readFileSync(appJsxPath, 'utf8');
      const originalContent = content;

      // Remove D-ID imports
      const didImportsToRemove = [
        "import EnhancedDidAgentPage from './pages/EnhancedDidAgentPage'",
        "import NautiBouysDIDAgentPage from './pages/NautiBouysDIDAgentPage'",
        "import DIDStreamingPage from './pages/DIDStreamingPage'",
        "import TestDidIntegration from './components/TestDidIntegration'"
      ];

      didImportsToRemove.forEach(importLine => {
        content = content.replace(new RegExp(importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?', 'g'), '');
      });

      // Remove D-ID routes
      const didRoutesToRemove = [
        '          <Route path="/ia/did-agent" element={<EnhancedDidAgentPage />} />',
        '          <Route path="/ia/nauti-bouys-agent" element={<NautiBouysDIDAgentPage />} />',
        '          <Route path="/ia/did-streaming" element={<DIDStreamingPage />} />',
        '          <Route path="/test-did" element={<TestDidIntegration />} />'
      ];

      didRoutesToRemove.forEach(routeLine => {
        content = content.replace(new RegExp(routeLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?', 'g'), '');
      });

      // Clean up any double newlines
      content = content.replace(/\n\n\n+/g, '\n\n');

      if (content !== originalContent) {
        fs.writeFileSync(appJsxPath, content, 'utf8');
        console.log('  ✅ App.jsx updated successfully');
        this.modifiedFiles.push('src/App.jsx');
      } else {
        console.log('  ℹ️  No changes needed in App.jsx');
      }

    } catch (error) {
      console.error('  ❌ Failed to update App.jsx:', error.message);
      this.errors.push(`Failed to update App.jsx: ${error.message}`);
    }
  }

  /**
   * Update package.json to remove D-ID client SDK
   */
  async updatePackageJson() {
    console.log('\n📦 Updating package.json...');

    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.dependencies && packageJson.dependencies['@d-id/client-sdk']) {
        delete packageJson.dependencies['@d-id/client-sdk'];
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
        console.log('  ✅ Removed @d-id/client-sdk from dependencies');
        this.modifiedFiles.push('package.json');
      } else {
        console.log('  ℹ️  @d-id/client-sdk not found in dependencies');
      }

    } catch (error) {
      console.error('  ❌ Failed to update package.json:', error.message);
      this.errors.push(`Failed to update package.json: ${error.message}`);
    }
  }

  /**
   * Cleanup backend D-ID files
   */
  async cleanupBackendFiles() {
    console.log('\n🔧 Cleaning up backend D-ID files...');

    const backendFilesToRemove = [
      'routes/d-id-agent.js',
      'routes/did-streaming.js',
      'services/didStreamingService.js',
      'services/didStreamingService.test.js'
    ];

    for (const fileOrDir of backendFilesToRemove) {
      const fullPath = path.join(this.backendPath, fileOrDir);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`  ✅ Removed: ${fileOrDir}`);
          this.removedFiles.push(`backend/${fileOrDir}`);
        } else {
          console.log(`  ⚠️  Not found: ${fileOrDir}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to remove ${fileOrDir}:`, error.message);
        this.errors.push(`Failed to remove backend/${fileOrDir}: ${error.message}`);
      }
    }

    // Check for D-ID references in other backend files
    console.log('\n🔍 Scanning for D-ID references in backend files...');
    await this.scanForDidReferences();
  }

  /**
   * Scan for remaining D-ID references
   */
  async scanForDidReferences() {
    const filesToScan = [
      'server.js',
      'routes/auth.js',
      'routes/beverages.js',
      'routes/inventory.js',
      'routes/reservations.js',
      'routes/ia.js'
    ];

    const referencesFound = [];

    for (const file of filesToScan) {
      const fullPath = path.join(this.backendPath, file);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes('d-id') || 
                line.toLowerCase().includes('did') ||
                line.includes('@d-id')) {
              referencesFound.push({
                file,
                line: index + 1,
                content: line.trim()
              });
            }
          });
        } catch (error) {
          console.error(`  ❌ Failed to scan ${file}:`, error.message);
        }
      }
    }

    if (referencesFound.length > 0) {
      console.log('  ⚠️  Found potential D-ID references that need manual review:');
      referencesFound.forEach(ref => {
        console.log(`    ${ref.file}:${ref.line} - ${ref.content}`);
      });
    } else {
      console.log('  ✅ No D-ID references found in scanned files');
    }
  }

  /**
   * Generate cleanup summary
   */
  generateSummary() {
    const summaryPath = path.join(this.projectRoot, 'DID_CLEANUP_SUMMARY.md');
    
    const summary = `# D-ID Dependencies Cleanup Summary

Generated on: ${new Date().toISOString()}

## Files Removed (${this.removedFiles.length})

${this.removedFiles.map(file => `- ${file}`).join('\n')}

## Files Modified (${this.modifiedFiles.length})

${this.modifiedFiles.map(file => `- ${file}`).join('\n')}

## Errors Encountered (${this.errors.length})

${this.errors.length > 0 ? this.errors.map(error => `- ${error}`).join('\n') : 'None'}

## Next Steps

1. Run \`npm install\` in the frontend directory to update dependencies
2. Review and test the application to ensure no broken imports
3. Consider the migration paths outlined in MIGRATION_GUIDE.md
4. Remove any remaining D-ID references manually if needed

## Migration Recommendations

- Replace D-ID avatar functionality with Three.js-based 3D avatars
- Use the enhanced lip sync systems (ActorCore, Conv-AI integration)
- Leverage the Multi-Avatar AI system for interactive experiences
`;

    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log(`\n📄 Generated cleanup summary: ${summaryPath}`);
  }

  /**
   * Print final results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 D-ID CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`📁 Files removed: ${this.removedFiles.length}`);
    console.log(`📝 Files modified: ${this.modifiedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Please review errors and complete cleanup manually.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. cd frontend && npm install');
    console.log('2. Review MIGRATION_GUIDE.md for replacement strategies');
    console.log('3. Test the application for any broken functionality');
    console.log('4. Commit changes when satisfied with cleanup');
  }
}

// Execute cleanup if run directly
if (require.main === module) {
  const cleanup = new DIDCleanup();
  cleanup.execute().catch(console.error);
}

module.exports = DIDCleanup;