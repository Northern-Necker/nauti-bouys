/**
 * ValidationReportGenerator - Comprehensive report generation for morph validation
 * Creates JSON/HTML reports with visual evidence and cross-framework comparison
 */

class ValidationReportGenerator {
    constructor(options = {}) {
        this.options = {
            includeScreenshots: options.includeScreenshots !== false,
            includePerformanceMetrics: options.includePerformanceMetrics !== false,
            includeGPUStats: options.includeGPUStats !== false,
            reportFormat: options.reportFormat || 'html', // 'html', 'json', 'both'
            templateStyle: options.templateStyle || 'modern',
            compressionLevel: options.compressionLevel || 'medium',
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.reportData = {};
        this.templates = new Map();
        
        this.init();
    }
    
    init() {
        this.loadTemplates();
        this.log('Validation Report Generator initialized', 'info');
    }
    
    /**
     * Generate comprehensive validation report
     */
    async generateReport(data, options = {}) {
        const reportOptions = { ...this.options, ...options };
        
        try {
            this.log('Generating validation report...', 'info');
            
            const reportData = await this.processReportData(data);
            this.reportData = reportData;
            
            const reports = {};
            
            if (reportOptions.reportFormat === 'json' || reportOptions.reportFormat === 'both') {
                reports.json = this.generateJSONReport(reportData);
            }
            
            if (reportOptions.reportFormat === 'html' || reportOptions.reportFormat === 'both') {
                reports.html = await this.generateHTMLReport(reportData, reportOptions);
            }
            
            this.log('Report generation completed', 'success');
            return reportOptions.reportFormat === 'both' ? reports : 
                   (reports.json || reports.html);
            
        } catch (error) {
            this.log(`Report generation failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Process and structure data for reporting
     */
    async processReportData(rawData) {
        const processedData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                reportVersion: '1.0.0',
                validationDuration: rawData.duration || 0,
                totalFrameworks: Object.keys(rawData.frameworks || {}).length,
                totalVisemes: 15
            },
            summary: this.processSummaryData(rawData),
            frameworks: await this.processFrameworkData(rawData.frameworks || {}),
            performance: this.processPerformanceData(rawData.performance || {}),
            visual: await this.processVisualData(rawData),
            analysis: this.generateAnalysis(rawData),
            recommendations: this.generateRecommendations(rawData)
        };
        
        return processedData;
    }
    
    /**
     * Process summary statistics
     */
    processSummaryData(rawData) {
        const summary = rawData.summary || {};
        
        return {
            overallScore: summary.overallScore || 0,
            totalTests: summary.totalTests || 0,
            passedTests: summary.passedTests || 0,
            failedTests: summary.failedTests || 0,
            successRate: summary.totalTests ? 
                (summary.passedTests / summary.totalTests * 100) : 0,
            topPerformer: summary.topPerformer || 'N/A',
            commonFailures: summary.commonFailures || [],
            frameworkScores: summary.frameworkScores || {}
        };
    }
    
    /**
     * Process framework-specific data
     */
    async processFrameworkData(frameworksData) {
        const processed = {};
        
        for (const [framework, data] of Object.entries(frameworksData)) {
            processed[framework] = {
                name: framework,
                score: data.validationScore || 0,
                totalVisemes: data.visemeResults ? data.visemeResults.size : 0,
                validVisemes: data.visemeResults ? 
                    Array.from(data.visemeResults.values()).filter(r => r.isValid).length : 0,
                errors: data.errors || [],
                performance: data.performanceMetrics || {},
                visemeResults: await this.processVisemeResults(data.visemeResults),
                screenshots: this.processScreenshots(data.screenshots),
                status: this.determineFrameworkStatus(data)
            };
        }
        
        return processed;
    }
    
    /**
     * Process viseme test results
     */
    async processVisemeResults(visemeResults) {
        if (!visemeResults) return {};
        
        const processed = {};
        
        for (const [viseme, result] of visemeResults.entries()) {
            processed[viseme] = {
                viseme: viseme,
                isValid: result.isValid,
                similarityScore: result.difference ? result.difference.similarityPercentage : 100,
                changeDetected: result.difference ? result.difference.changeDetected : false,
                pixelDifferences: result.difference ? result.difference.differentPixels : 0,
                validationReason: result.validationReason || 'Unknown',
                testDuration: result.performance ? result.performance.testDuration : 0,
                screenshot: result.afterScreenshot ? result.afterScreenshot.dataURL : null,
                baseline: result.baseline ? result.baseline.dataURL : null,
                diffImage: result.difference ? result.difference.diffImageURL : null
            };
        }
        
        return processed;
    }
    
    /**
     * Process screenshot data
     */
    processScreenshots(screenshots) {
        if (!screenshots) return {};
        
        const processed = {};
        
        for (const [key, screenshot] of screenshots.entries()) {
            processed[key] = {
                timestamp: screenshot.timestamp,
                dataURL: this.options.includeScreenshots ? screenshot.dataURL : null,
                width: screenshot.width,
                height: screenshot.height,
                format: screenshot.format
            };
        }
        
        return processed;
    }
    
    /**
     * Process performance metrics
     */
    processPerformanceData(performanceData) {
        return {
            totalTestRuns: performanceData.totalTestRuns || 0,
            averageTestDuration: performanceData.averageTestDuration || 0,
            memoryUsage: performanceData.memoryUsage || '0MB',
            gpuStats: this.options.includeGPUStats ? 
                (performanceData.gpuStats || {}) : null
        };
    }
    
    /**
     * Process visual data and evidence
     */
    async processVisualData(rawData) {
        const visual = {
            comparisonGrids: {},
            diffAnalysis: {},
            screenshotCount: 0
        };
        
        // Count total screenshots across all frameworks
        if (rawData.frameworks) {
            Object.values(rawData.frameworks).forEach(framework => {
                if (framework.visemeResults) {
                    visual.screenshotCount += framework.visemeResults.size * 2; // before + after
                }
            });
        }
        
        return visual;
    }
    
    /**
     * Generate analysis insights
     */
    generateAnalysis(rawData) {
        const analysis = {
            insights: [],
            trends: [],
            issues: [],
            strengths: []
        };
        
        // Analyze framework performance
        if (rawData.summary && rawData.summary.frameworkScores) {
            const scores = Object.entries(rawData.summary.frameworkScores);
            
            if (scores.length > 1) {
                const highest = scores.reduce((a, b) => a[1] > b[1] ? a : b);
                const lowest = scores.reduce((a, b) => a[1] < b[1] ? a : b);
                
                analysis.insights.push(
                    `${highest[0]} achieved the highest validation score at ${highest[1].toFixed(1)}%`
                );
                
                if (highest[1] - lowest[1] > 20) {
                    analysis.issues.push(
                        `Significant performance gap between frameworks (${(highest[1] - lowest[1]).toFixed(1)}% difference)`
                    );
                }
            }
        }
        
        // Analyze common failures
        if (rawData.summary && rawData.summary.commonFailures && rawData.summary.commonFailures.length > 0) {
            analysis.issues.push(
                `Common failure visemes: ${rawData.summary.commonFailures.map(f => f.viseme).join(', ')}`
            );
        }
        
        // Analyze overall success rate
        if (rawData.summary) {
            const successRate = rawData.summary.passedTests / rawData.summary.totalTests * 100;
            
            if (successRate >= 90) {
                analysis.strengths.push('Excellent overall validation success rate');
            } else if (successRate >= 70) {
                analysis.insights.push('Good validation coverage with room for improvement');
            } else {
                analysis.issues.push('Low validation success rate indicates implementation issues');
            }
        }
        
        return analysis;
    }
    
    /**
     * Generate improvement recommendations
     */
    generateRecommendations(rawData) {
        const recommendations = [];
        
        // Framework-specific recommendations
        if (rawData.frameworks) {
            Object.entries(rawData.frameworks).forEach(([framework, data]) => {
                if (data.validationScore < 70) {
                    recommendations.push({
                        category: 'Framework Implementation',
                        framework: framework,
                        priority: 'High',
                        recommendation: `${framework} morph target implementation needs review - only ${data.validationScore.toFixed(1)}% of visemes validated successfully`
                    });
                }
                
                if (data.errors && data.errors.length > 0) {
                    recommendations.push({
                        category: 'Error Resolution',
                        framework: framework,
                        priority: 'Medium',
                        recommendation: `Address ${data.errors.length} error(s) in ${framework} implementation`
                    });
                }
            });
        }
        
        // Common failure recommendations
        if (rawData.summary && rawData.summary.commonFailures) {
            rawData.summary.commonFailures.forEach(failure => {
                recommendations.push({
                    category: 'Viseme Implementation',
                    viseme: failure.viseme,
                    priority: 'High',
                    recommendation: `Viseme '${failure.viseme}' fails in ${failure.failureCount} frameworks - check morph target mapping and intensity`
                });
            });
        }
        
        return recommendations;
    }
    
    /**
     * Determine framework status
     */
    determineFrameworkStatus(frameworkData) {
        if (!frameworkData.validationScore) return 'unknown';
        
        if (frameworkData.validationScore >= 90) return 'excellent';
        if (frameworkData.validationScore >= 70) return 'good';
        if (frameworkData.validationScore >= 50) return 'fair';
        return 'poor';
    }
    
    /**
     * Generate JSON report
     */
    generateJSONReport(reportData) {
        return JSON.stringify(reportData, null, 2);
    }
    
    /**
     * Generate HTML report
     */
    async generateHTMLReport(reportData, options = {}) {
        const template = this.getHTMLTemplate(options.templateStyle);
        
        try {
            let html = template;
            
            // Replace template variables
            html = html.replace('{{REPORT_TITLE}}', 'Visual Morph Validation Report');
            html = html.replace('{{GENERATED_AT}}', new Date().toLocaleString());
            html = html.replace('{{SUMMARY_DATA}}', JSON.stringify(reportData.summary));
            html = html.replace('{{FRAMEWORKS_DATA}}', JSON.stringify(reportData.frameworks));
            html = html.replace('{{ANALYSIS_DATA}}', JSON.stringify(reportData.analysis));
            html = html.replace('{{RECOMMENDATIONS_DATA}}', JSON.stringify(reportData.recommendations));
            
            // Generate framework sections
            const frameworkSections = await this.generateFrameworkSections(reportData.frameworks);
            html = html.replace('{{FRAMEWORK_SECTIONS}}', frameworkSections);
            
            // Generate viseme comparison
            const visemeComparison = this.generateVisemeComparison(reportData.frameworks);
            html = html.replace('{{VISEME_COMPARISON}}', visemeComparison);
            
            return html;
            
        } catch (error) {
            this.log(`HTML report generation failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Generate framework sections for HTML
     */
    async generateFrameworkSections(frameworksData) {
        let sections = '';
        
        for (const [framework, data] of Object.entries(frameworksData)) {
            const statusClass = this.getStatusClass(data.status);
            
            sections += `
                <div class="framework-section">
                    <div class="framework-header">
                        <h3>${framework.charAt(0).toUpperCase() + framework.slice(1)}</h3>
                        <div class="framework-score ${statusClass}">
                            ${data.score.toFixed(1)}%
                        </div>
                    </div>
                    
                    <div class="framework-stats">
                        <div class="stat-item">
                            <span class="stat-label">Valid Visemes</span>
                            <span class="stat-value">${data.validVisemes}/${data.totalVisemes}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Errors</span>
                            <span class="stat-value ${data.errors.length > 0 ? 'error' : ''}">${data.errors.length}</span>
                        </div>
                    </div>
                    
                    <div class="viseme-grid">
                        ${this.generateVisemeGrid(data.visemeResults)}
                    </div>
                    
                    ${data.errors.length > 0 ? this.generateErrorSection(data.errors) : ''}
                </div>
            `;
        }
        
        return sections;
    }
    
    /**
     * Generate viseme grid for framework
     */
    generateVisemeGrid(visemeResults) {
        let grid = '';
        
        Object.entries(visemeResults).forEach(([viseme, result]) => {
            const statusClass = result.isValid ? 'valid' : 'invalid';
            const similarity = result.similarityScore.toFixed(1);
            
            grid += `
                <div class="viseme-item ${statusClass}" title="${result.validationReason}">
                    <div class="viseme-name">${viseme}</div>
                    <div class="viseme-score">${similarity}%</div>
                    ${result.screenshot && this.options.includeScreenshots ? 
                        `<img src="${result.screenshot}" alt="${viseme} screenshot" class="viseme-screenshot">` : ''}
                </div>
            `;
        });
        
        return grid;
    }
    
    /**
     * Generate error section
     */
    generateErrorSection(errors) {
        let errorSection = '<div class="error-section"><h4>Errors</h4><ul>';
        
        errors.forEach(error => {
            errorSection += `<li><strong>${error.viseme || 'General'}:</strong> ${error.error}</li>`;
        });
        
        errorSection += '</ul></div>';
        return errorSection;
    }
    
    /**
     * Generate viseme comparison table
     */
    generateVisemeComparison(frameworksData) {
        const visemes = ['sil', 'aa', 'ae', 'ah', 'ao', 'aw', 'ay', 'b_m_p', 
                        'ch_j_sh', 'd_s_t', 'eh', 'er', 'ey', 'f_v', 'ih'];
        
        let comparison = `
            <table class="viseme-comparison-table">
                <thead>
                    <tr>
                        <th>Viseme</th>
                        ${Object.keys(frameworksData).map(f => `<th>${f}</th>`).join('')}
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        visemes.forEach(viseme => {
            let successCount = 0;
            const frameworkCount = Object.keys(frameworksData).length;
            
            comparison += `<tr><td><strong>${viseme}</strong></td>`;
            
            Object.entries(frameworksData).forEach(([framework, data]) => {
                const result = data.visemeResults[viseme];
                if (result) {
                    const statusClass = result.isValid ? 'success' : 'failure';
                    comparison += `<td class="${statusClass}">${result.isValid ? '✓' : '✗'} (${result.similarityScore.toFixed(1)}%)</td>`;
                    if (result.isValid) successCount++;
                } else {
                    comparison += '<td class="unknown">N/A</td>';
                }
            });
            
            const successRate = frameworkCount > 0 ? (successCount / frameworkCount * 100).toFixed(1) : 0;
            comparison += `<td>${successRate}%</td></tr>`;
        });
        
        comparison += '</tbody></table>';
        return comparison;
    }
    
    /**
     * Get status CSS class
     */
    getStatusClass(status) {
        const classes = {
            excellent: 'status-excellent',
            good: 'status-good',
            fair: 'status-fair',
            poor: 'status-poor',
            unknown: 'status-unknown'
        };
        return classes[status] || 'status-unknown';
    }
    
    /**
     * Load HTML templates
     */
    loadTemplates() {
        this.templates.set('modern', this.getModernTemplate());
        this.templates.set('minimal', this.getMinimalTemplate());
    }
    
    /**
     * Get HTML template
     */
    getHTMLTemplate(style = 'modern') {
        return this.templates.get(style) || this.templates.get('modern');
    }
    
    /**
     * Modern HTML template
     */
    getModernTemplate() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{REPORT_TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .summary-label {
            color: #666;
            font-size: 1.1em;
        }
        
        .status-excellent .summary-value { color: #28a745; }
        .status-good .summary-value { color: #17a2b8; }
        .status-fair .summary-value { color: #ffc107; }
        .status-poor .summary-value { color: #dc3545; }
        
        .framework-section {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .framework-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #eee;
        }
        
        .framework-score {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            color: white;
        }
        
        .framework-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .viseme-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
        }
        
        .viseme-item {
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .viseme-item.valid {
            background: #d4edda;
            border-color: #28a745;
        }
        
        .viseme-item.invalid {
            background: #f8d7da;
            border-color: #dc3545;
        }
        
        .viseme-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .viseme-score {
            font-size: 0.9em;
            color: #666;
        }
        
        .viseme-screenshot {
            width: 100%;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            margin-top: 8px;
        }
        
        .viseme-comparison-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .viseme-comparison-table th,
        .viseme-comparison-table td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #eee;
        }
        
        .viseme-comparison-table th {
            background: #667eea;
            color: white;
            font-weight: bold;
        }
        
        .success { color: #28a745; font-weight: bold; }
        .failure { color: #dc3545; font-weight: bold; }
        .unknown { color: #666; }
        
        .error-section {
            background: #f8d7da;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .error-section h4 {
            color: #721c24;
            margin-bottom: 10px;
        }
        
        .error-section ul {
            color: #721c24;
            margin-left: 20px;
        }
        
        .recommendations {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 25px;
        }
        
        .recommendation-item {
            padding: 15px;
            border-left: 4px solid #17a2b8;
            background: #f8f9fa;
            margin-bottom: 15px;
            border-radius: 0 8px 8px 0;
        }
        
        .recommendation-item.high-priority {
            border-color: #dc3545;
        }
        
        .recommendation-item.medium-priority {
            border-color: #ffc107;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2em; }
            .framework-header { flex-direction: column; }
            .viseme-grid { grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{REPORT_TITLE}}</h1>
            <p>Generated: {{GENERATED_AT}}</p>
        </div>
        
        <div class="summary-grid" id="summary-section">
            <!-- Summary cards will be generated here -->
        </div>
        
        <div class="frameworks-section">
            <h2>Framework Analysis</h2>
            {{FRAMEWORK_SECTIONS}}
        </div>
        
        <div class="comparison-section">
            <h2>Cross-Framework Viseme Comparison</h2>
            {{VISEME_COMPARISON}}
        </div>
        
        <div class="recommendations" id="recommendations-section">
            <h2>Recommendations</h2>
            <!-- Recommendations will be generated here -->
        </div>
    </div>
    
    <script>
        // Populate dynamic content
        const summaryData = {{SUMMARY_DATA}};
        const frameworksData = {{FRAMEWORKS_DATA}};
        const analysisData = {{ANALYSIS_DATA}};
        const recommendationsData = {{RECOMMENDATIONS_DATA}};
        
        // Generate summary cards
        function generateSummaryCards() {
            const summarySection = document.getElementById('summary-section');
            
            const cards = [
                { value: summaryData.overallScore.toFixed(1) + '%', label: 'Overall Score', status: getScoreStatus(summaryData.overallScore) },
                { value: summaryData.passedTests + '/' + summaryData.totalTests, label: 'Tests Passed', status: 'info' },
                { value: summaryData.topPerformer, label: 'Top Framework', status: 'info' },
                { value: summaryData.commonFailures.length, label: 'Common Failures', status: summaryData.commonFailures.length > 0 ? 'poor' : 'excellent' }
            ];
            
            cards.forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'summary-card status-' + card.status;
                cardElement.innerHTML = 
                    '<div class="summary-value">' + card.value + '</div>' +
                    '<div class="summary-label">' + card.label + '</div>';
                summarySection.appendChild(cardElement);
            });
        }
        
        // Generate recommendations
        function generateRecommendations() {
            const recSection = document.getElementById('recommendations-section');
            
            recommendationsData.forEach(rec => {
                const recElement = document.createElement('div');
                recElement.className = 'recommendation-item ' + rec.priority.toLowerCase() + '-priority';
                recElement.innerHTML = 
                    '<strong>' + rec.category + '</strong><br>' +
                    rec.recommendation;
                recSection.appendChild(recElement);
            });
        }
        
        function getScoreStatus(score) {
            if (score >= 90) return 'excellent';
            if (score >= 70) return 'good';
            if (score >= 50) return 'fair';
            return 'poor';
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            generateSummaryCards();
            generateRecommendations();
        });
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Minimal HTML template
     */
    getMinimalTemplate() {
        // Simplified version of the modern template
        return this.getModernTemplate().replace(/gradient|shadow|transition/g, '');
    }
    
    /**
     * Export report to file
     */
    downloadReport(report, filename, format = 'html') {
        const mimeTypes = {
            html: 'text/html',
            json: 'application/json'
        };
        
        const blob = new Blob([report], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `morph-validation-report-${Date.now()}.${format}`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    log(message, level = 'info') {
        if (this.options.debugMode) {
            console.log(`[ValidationReportGenerator] ${message}`);
        }
        
        // Send to parent validator if available
        if (window.morphValidator) {
            window.morphValidator.log(`[Report] ${message}`, level);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationReportGenerator;
}