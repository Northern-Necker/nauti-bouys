#!/usr/bin/env node

/**
 * MediaPipe Face Landmarker v2 Loading Test Suite - Node.js Version
 * Command-line testing for server environments and CI/CD pipelines
 * 
 * Usage: node mediapipe-loading-tests-node.js [options]
 * Options:
 *   --output-json: Output results as JSON
 *   --verbose: Verbose logging
 *   --quick: Run only essential tests
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

class MediaPipeLoadingTestSuiteNode {
    constructor(options = {}) {
        this.options = {
            outputJson: options.outputJson || false,
            verbose: options.verbose || false,
            quick: options.quick || false,
            timeout: options.timeout || 30000
        };
        
        this.testResults = [];
        this.errorLog = [];
        this.startTime = Date.now();
        
        // Test configurations adapted for Node.js
        this.testConfigs = {
            cdnSources: [
                {
                    name: 'JSDelivr Latest',
                    wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
                    packageUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/package.json'
                },
                {
                    name: 'JSDelivr Stable',
                    wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm',
                    packageUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/package.json'
                },
                {
                    name: 'Unpkg Latest',
                    wasmPath: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
                    packageUrl: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22-rc.20250304/package.json'
                },
                {
                    name: 'Unpkg Stable',
                    wasmPath: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.15/wasm',
                    packageUrl: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.15/package.json'
                }
            ],
            
            modelSources: [
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float32/1/face_landmarker.task'
            ],
            
            wasmFiles: [
                'tasks-vision_wasm.wasm',
                'vision_wasm_internal.wasm',
                'tasks_vision_wasm.wasm'
            ],
            
            npmPackages: [
                '@mediapipe/tasks-vision',
                '@mediapipe/face-detection',
                '@mediapipe/face-landmark-detection'
            ]
        };
    }

    /**
     * Log test results with categorization
     */
    log(category, message, data = null, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data,
            level,
            elapsed: Date.now() - this.startTime
        };
        
        this.testResults.push(logEntry);
        
        if (level === 'error') {
            this.errorLog.push(logEntry);
        }
        
        if (this.options.verbose || level === 'error') {
            const prefix = `[${level.toUpperCase()}] ${category}:`;
            console.log(prefix, message, data ? JSON.stringify(data, null, 2) : '');
        }
    }

    /**
     * Make HTTP/HTTPS request with timeout
     */
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'HEAD',
                timeout: this.options.timeout,
                headers: {
                    'User-Agent': 'MediaPipe-Test-Suite/1.0.0',
                    ...options.headers
                }
            };
            
            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.data) {
                req.write(options.data);
            }
            
            req.end();
        });
    }

    /**
     * Test CDN accessibility and package information
     */
    async testCDNAccess() {
        this.log('CDN_ACCESS', 'Starting CDN accessibility tests');
        
        for (const config of this.testConfigs.cdnSources) {
            try {
                this.log('CDN_ACCESS', `Testing ${config.name}`);
                
                // Test package.json accessibility
                const startTime = performance.now();
                const packageResponse = await this.makeRequest(config.packageUrl, { method: 'GET' });
                const packageLoadTime = performance.now() - startTime;
                
                if (packageResponse.success) {
                    try {
                        const packageInfo = JSON.parse(packageResponse.data);
                        this.log('CDN_ACCESS', `${config.name} package info retrieved`, {
                            version: packageInfo.version,
                            name: packageInfo.name,
                            loadTime: packageLoadTime,
                            size: packageResponse.headers['content-length']
                        });
                    } catch (parseError) {
                        this.log('CDN_ACCESS', `${config.name} package.json parse error`, parseError, 'error');
                    }
                } else {
                    this.log('CDN_ACCESS', `${config.name} package.json not accessible`, {
                        statusCode: packageResponse.statusCode,
                        loadTime: packageLoadTime
                    }, 'error');
                }
                
                // Test WASM directory accessibility
                await this.testWASMDirectory(config);
                
            } catch (error) {
                this.log('CDN_ACCESS', `${config.name} failed`, error, 'error');
            }
        }
    }

    /**
     * Test WASM file accessibility
     */
    async testWASMDirectory(config) {
        this.log('WASM_ACCESS', `Testing WASM files for ${config.name}`);
        
        for (const wasmFile of this.testConfigs.wasmFiles) {
            try {
                const wasmUrl = `${config.wasmPath}/${wasmFile}`;
                const startTime = performance.now();
                const response = await this.makeRequest(wasmUrl);
                const loadTime = performance.now() - startTime;
                
                const result = {
                    file: wasmFile,
                    url: wasmUrl,
                    statusCode: response.statusCode,
                    success: response.success,
                    loadTime,
                    contentType: response.headers['content-type'],
                    contentLength: response.headers['content-length'],
                    lastModified: response.headers['last-modified']
                };
                
                this.log('WASM_ACCESS', `WASM file ${response.success ? 'accessible' : 'failed'}: ${wasmFile}`, result, response.success ? 'info' : 'error');
                
            } catch (error) {
                this.log('WASM_ACCESS', `WASM file test failed: ${wasmFile}`, error, 'error');
            }
        }
    }

    /**
     * Test model file accessibility
     */
    async testModelAccess() {
        this.log('MODEL_ACCESS', 'Testing model file accessibility');
        
        for (const modelUrl of this.testConfigs.modelSources) {
            try {
                this.log('MODEL_ACCESS', `Testing model: ${modelUrl}`);
                
                const startTime = performance.now();
                const response = await this.makeRequest(modelUrl);
                const loadTime = performance.now() - startTime;
                
                const result = {
                    url: modelUrl,
                    statusCode: response.statusCode,
                    success: response.success,
                    loadTime,
                    contentType: response.headers['content-type'],
                    contentLength: response.headers['content-length'],
                    lastModified: response.headers['last-modified'],
                    etag: response.headers['etag']
                };
                
                this.log('MODEL_ACCESS', `Model ${response.success ? 'accessible' : 'failed'}`, result, response.success ? 'info' : 'error');
                
            } catch (error) {
                this.log('MODEL_ACCESS', `Model test failed: ${modelUrl}`, error, 'error');
            }
        }
    }

    /**
     * Test NPM package availability and installation
     */
    async testNPMPackages() {
        this.log('NPM_PACKAGES', 'Testing NPM package availability');
        
        // Check if we're in a Node.js environment with package access
        try {
            const { execSync } = require('child_process');
            
            for (const packageName of this.testConfigs.npmPackages) {
                try {
                    this.log('NPM_PACKAGES', `Checking NPM package: ${packageName}`);
                    
                    // Try to get package info
                    const startTime = performance.now();
                    const output = execSync(`npm view ${packageName} --json`, {
                        encoding: 'utf8',
                        timeout: this.options.timeout
                    });
                    const checkTime = performance.now() - startTime;
                    
                    const packageInfo = JSON.parse(output);
                    this.log('NPM_PACKAGES', `Package info retrieved: ${packageName}`, {
                        version: packageInfo.version,
                        description: packageInfo.description,
                        homepage: packageInfo.homepage,
                        checkTime
                    });
                    
                    // Check if package is locally installed
                    try {
                        require.resolve(packageName);
                        this.log('NPM_PACKAGES', `Package locally installed: ${packageName}`);
                    } catch (resolveError) {
                        this.log('NPM_PACKAGES', `Package not locally installed: ${packageName}`, null, 'warning');
                    }
                    
                } catch (error) {
                    this.log('NPM_PACKAGES', `Package check failed: ${packageName}`, error, 'error');
                }
            }
            
        } catch (error) {
            this.log('NPM_PACKAGES', 'NPM not available or execution failed', error, 'error');
        }
    }

    /**
     * Test system environment and capabilities
     */
    async testSystemEnvironment() {
        this.log('SYSTEM_ENV', 'Testing system environment');
        
        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cwd: process.cwd(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                npm_config_user_agent: process.env.npm_config_user_agent,
                CI: process.env.CI
            }
        };
        
        this.log('SYSTEM_ENV', 'System information collected', systemInfo);
        
        // Test file system access
        try {
            await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
            this.log('SYSTEM_ENV', 'File system access: OK');
        } catch (error) {
            this.log('SYSTEM_ENV', 'File system access failed', error, 'error');
        }
        
        // Test network connectivity
        try {
            const testUrl = 'https://www.google.com';
            await this.makeRequest(testUrl);
            this.log('SYSTEM_ENV', 'Network connectivity: OK');
        } catch (error) {
            this.log('SYSTEM_ENV', 'Network connectivity failed', error, 'error');
        }
    }

    /**
     * Test MediaPipe package structure if available
     */
    async testLocalMediaPipe() {
        this.log('LOCAL_MEDIAPIPE', 'Testing local MediaPipe installation');
        
        const possiblePaths = [
            './node_modules/@mediapipe/tasks-vision',
            '../node_modules/@mediapipe/tasks-vision',
            '../../node_modules/@mediapipe/tasks-vision'
        ];
        
        for (const mediapipePath of possiblePaths) {
            try {
                const resolvedPath = path.resolve(mediapipePath);
                await fs.access(resolvedPath);
                
                this.log('LOCAL_MEDIAPIPE', `MediaPipe found at: ${resolvedPath}`);
                
                // Check package structure
                await this.analyzePackageStructure(resolvedPath);
                break;
                
            } catch (error) {
                // Path doesn't exist, continue
            }
        }
        
        // Try require resolution
        try {
            const mediapipeModule = require('@mediapipe/tasks-vision');
            this.log('LOCAL_MEDIAPIPE', 'MediaPipe module can be required', {
                exports: Object.keys(mediapipeModule)
            });
        } catch (error) {
            this.log('LOCAL_MEDIAPIPE', 'MediaPipe module not available via require', error, 'error');
        }
    }

    /**
     * Analyze MediaPipe package structure
     */
    async analyzePackageStructure(packagePath) {
        try {
            this.log('PACKAGE_STRUCTURE', 'Analyzing MediaPipe package structure');
            
            // Read package.json
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            this.log('PACKAGE_STRUCTURE', 'Package.json analyzed', {
                version: packageJson.version,
                main: packageJson.main,
                module: packageJson.module,
                types: packageJson.types
            });
            
            // Check for WASM directory
            const wasmDir = path.join(packagePath, 'wasm');
            try {
                const wasmFiles = await fs.readdir(wasmDir);
                this.log('PACKAGE_STRUCTURE', 'WASM directory found', {
                    files: wasmFiles,
                    path: wasmDir
                });
            } catch (error) {
                this.log('PACKAGE_STRUCTURE', 'WASM directory not found', null, 'warning');
            }
            
            // Check for models directory
            const modelsDir = path.join(packagePath, 'models');
            try {
                const modelFiles = await fs.readdir(modelsDir);
                this.log('PACKAGE_STRUCTURE', 'Models directory found', {
                    files: modelFiles,
                    path: modelsDir
                });
            } catch (error) {
                this.log('PACKAGE_STRUCTURE', 'Models directory not found', null, 'warning');
            }
            
        } catch (error) {
            this.log('PACKAGE_STRUCTURE', 'Package structure analysis failed', error, 'error');
        }
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        const errorCategories = {};
        
        // Categorize errors
        this.errorLog.forEach(error => {
            const category = error.category;
            if (!errorCategories[category]) {
                errorCategories[category] = [];
            }
            errorCategories[category].push(error);
        });
        
        // Generate category-specific recommendations
        Object.entries(errorCategories).forEach(([category, errors]) => {
            switch (category) {
                case 'CDN_ACCESS':
                    recommendations.push({
                        category,
                        issue: 'CDN Access Issues',
                        solution: 'Check network connectivity and firewall settings. Consider using a different CDN or local installation.',
                        priority: 'high',
                        errors: errors.length
                    });
                    break;
                    
                case 'WASM_ACCESS':
                    recommendations.push({
                        category,
                        issue: 'WASM File Access Issues',
                        solution: 'Verify WASM files are available at the specified URLs. Check CORS policies if running in browser.',
                        priority: 'high',
                        errors: errors.length
                    });
                    break;
                    
                case 'MODEL_ACCESS':
                    recommendations.push({
                        category,
                        issue: 'Model File Access Issues',
                        solution: 'Ensure model files are accessible. Consider downloading models locally for offline use.',
                        priority: 'medium',
                        errors: errors.length
                    });
                    break;
                    
                case 'NPM_PACKAGES':
                    recommendations.push({
                        category,
                        issue: 'NPM Package Issues',
                        solution: 'Install MediaPipe packages using npm install @mediapipe/tasks-vision',
                        priority: 'medium',
                        errors: errors.length
                    });
                    break;
                    
                case 'SYSTEM_ENV':
                    recommendations.push({
                        category,
                        issue: 'System Environment Issues',
                        solution: 'Check Node.js version compatibility and system permissions',
                        priority: 'high',
                        errors: errors.length
                    });
                    break;
            }
        });
        
        // Add general recommendations
        if (this.errorLog.length === 0) {
            recommendations.push({
                category: 'SUCCESS',
                issue: 'All Tests Passed',
                solution: 'MediaPipe should load successfully in your environment',
                priority: 'info',
                errors: 0
            });
        }
        
        return recommendations;
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.startTime,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd()
            },
            testResults: this.testResults,
            errorSummary: {
                totalErrors: this.errorLog.length,
                errorsByCategory: this.errorLog.reduce((acc, error) => {
                    acc[error.category] = (acc[error.category] || 0) + 1;
                    return acc;
                }, {}),
                errors: this.errorLog
            },
            recommendations: this.generateRecommendations(),
            summary: {
                totalTests: this.testResults.length,
                successfulTests: this.testResults.filter(r => r.level === 'info').length,
                warnings: this.testResults.filter(r => r.level === 'warning').length,
                errors: this.errorLog.length
            }
        };
        
        return report;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('Starting MediaPipe Face Landmarker v2 Loading Tests (Node.js)');
        console.log('='.repeat(60));
        
        try {
            // System environment tests
            await this.testSystemEnvironment();
            
            // CDN accessibility tests
            await this.testCDNAccess();
            
            // Model accessibility tests
            await this.testModelAccess();
            
            // NPM package tests
            if (!this.options.quick) {
                await this.testNPMPackages();
                await this.testLocalMediaPipe();
            }
            
            // Generate final report
            const report = this.generateReport();
            
            if (this.options.outputJson) {
                console.log(JSON.stringify(report, null, 2));
            } else {
                this.printReport(report);
            }
            
            return report;
            
        } catch (error) {
            console.error('Test suite failed with critical error:', error);
            process.exit(1);
        }
    }

    /**
     * Print human-readable report
     */
    printReport(report) {
        console.log('\n' + '='.repeat(60));
        console.log('MEDIAPIPE LOADING TEST REPORT');
        console.log('='.repeat(60));
        
        console.log(`\nTest Duration: ${report.testDuration}ms`);
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Successful: ${report.summary.successfulTests}`);
        console.log(`Warnings: ${report.summary.warnings}`);
        console.log(`Errors: ${report.summary.errors}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n' + '-'.repeat(40));
            console.log('RECOMMENDATIONS:');
            console.log('-'.repeat(40));
            
            report.recommendations.forEach(rec => {
                console.log(`\n[${rec.priority.toUpperCase()}] ${rec.issue}`);
                console.log(`Solution: ${rec.solution}`);
                if (rec.errors > 0) {
                    console.log(`Related Errors: ${rec.errors}`);
                }
            });
        }
        
        if (this.options.verbose && report.errorSummary.errors.length > 0) {
            console.log('\n' + '-'.repeat(40));
            console.log('ERROR DETAILS:');
            console.log('-'.repeat(40));
            
            report.errorSummary.errors.forEach(error => {
                console.log(`\n[${error.timestamp}] ${error.category}: ${error.message}`);
                if (error.data) {
                    console.log(JSON.stringify(error.data, null, 2));
                }
            });
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        outputJson: args.includes('--output-json'),
        verbose: args.includes('--verbose'),
        quick: args.includes('--quick')
    };
    
    const testSuite = new MediaPipeLoadingTestSuiteNode(options);
    
    testSuite.runAllTests()
        .then(report => {
            process.exit(report.summary.errors > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = MediaPipeLoadingTestSuiteNode;