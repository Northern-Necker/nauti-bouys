#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simulate GLB morph target analysis
class GLBMorphAnalyzer {
    constructor() {
        this.arkitVisemes = [
            'sil', 'aa', 'ae', 'ah', 'ao', 'aw', 'ay', 'b_m_p', 
            'ch_j_sh_zh', 'd_s_t', 'eh', 'er', 'f_v', 'g_k', 
            'hh', 'ih', 'iy', 'l', 'n', 'ng', 'ow', 'oy', 
            'r', 'th', 'uh', 'uw', 'w', 'y', 'z'
        ];

        // Simulated morph targets found in GLB models
        this.availableMorphs = [
            'Mouth_Open', 'Mouth_Close', 'Mouth_Smile_Left', 'Mouth_Smile_Right',
            'Mouth_Frown_Left', 'Mouth_Frown_Right', 'Mouth_Funnel', 'Mouth_Pucker_Lower',
            'Mouth_Pucker_Upper', 'Mouth_Stretch_Left', 'Mouth_Stretch_Right',
            'Mouth_Press_Left', 'Mouth_Press_Right', 'Mouth_Lower_Down_Left',
            'Mouth_Lower_Down_Right', 'Mouth_Upper_Up_Left', 'Mouth_Upper_Up_Right',
            'Jaw_Open', 'Jaw_Forward', 'Jaw_Left', 'Jaw_Right',
            'Tongue_Tip_Up', 'Tongue_Tip_Down', 'Tongue_Out', 'Tongue_Curl',
            'Tongue_Side_Left', 'Tongue_Side_Right', 'Tongue_Back',
            'Cheek_Puff', 'Cheek_Squint_Left', 'Cheek_Squint_Right',
            'Nose_Sneer_Left', 'Nose_Sneer_Right'
        ];

        // Perfect morph mappings for each viseme
        this.optimizedMorphMappings = {
            'sil': {
                description: 'Silence/Neutral - All morphs at rest',
                morphs: {}
            },
            'aa': {
                description: 'Father - Wide open mouth with jaw drop',
                morphs: {
                    'Mouth_Open': 0.85,
                    'Jaw_Open': 0.75,
                    'Mouth_Stretch_Left': 0.2,
                    'Mouth_Stretch_Right': 0.2
                }
            },
            'ae': {
                description: 'Cat - Wide stretched mouth',
                morphs: {
                    'Mouth_Stretch_Left': 0.8,
                    'Mouth_Stretch_Right': 0.8,
                    'Mouth_Open': 0.4,
                    'Jaw_Open': 0.3
                }
            },
            'ah': {
                description: 'Hot - Very open mouth',
                morphs: {
                    'Mouth_Open': 0.9,
                    'Jaw_Open': 0.8,
                    'Mouth_Funnel': 0.1
                }
            },
            'ao': {
                description: 'Thought - Rounded mouth',
                morphs: {
                    'Mouth_Funnel': 0.85,
                    'Mouth_Pucker_Lower': 0.7,
                    'Mouth_Pucker_Upper': 0.6,
                    'Mouth_Open': 0.3
                }
            },
            'aw': {
                description: 'Loud - Wide open with stretch',
                morphs: {
                    'Mouth_Open': 0.8,
                    'Jaw_Open': 0.7,
                    'Mouth_Stretch_Left': 0.5,
                    'Mouth_Stretch_Right': 0.5
                }
            },
            'ay': {
                description: 'Hide - Smile transition',
                morphs: {
                    'Mouth_Smile_Left': 0.6,
                    'Mouth_Smile_Right': 0.6,
                    'Mouth_Stretch_Left': 0.3,
                    'Mouth_Stretch_Right': 0.3
                }
            },
            'b_m_p': {
                description: 'Lips pressed together',
                morphs: {
                    'Mouth_Close': 0.95,
                    'Mouth_Press_Left': 0.8,
                    'Mouth_Press_Right': 0.8,
                    'Mouth_Pucker_Lower': 0.2,
                    'Mouth_Pucker_Upper': 0.2
                }
            },
            'ch_j_sh_zh': {
                description: 'Church - Rounded with slight protrusion',
                morphs: {
                    'Mouth_Funnel': 0.7,
                    'Mouth_Pucker_Lower': 0.6,
                    'Mouth_Pucker_Upper': 0.5,
                    'Mouth_Open': 0.2
                }
            },
            'd_s_t': {
                description: 'Tongue tip to teeth ridge',
                morphs: {
                    'Tongue_Tip_Up': 0.9,
                    'Mouth_Open': 0.35,
                    'Jaw_Open': 0.2
                }
            },
            'eh': {
                description: 'Pet - Mid-open mouth',
                morphs: {
                    'Mouth_Open': 0.5,
                    'Jaw_Open': 0.3,
                    'Mouth_Stretch_Left': 0.4,
                    'Mouth_Stretch_Right': 0.4
                }
            },
            'er': {
                description: 'Bird - R sound with tongue curl',
                morphs: {
                    'Tongue_Curl': 0.85,
                    'Mouth_Funnel': 0.4,
                    'Mouth_Open': 0.3
                }
            },
            'f_v': {
                description: 'Teeth touching lower lip',
                morphs: {
                    'Mouth_Lower_Down_Left': 0.7,
                    'Mouth_Lower_Down_Right': 0.7,
                    'Mouth_Upper_Up_Left': 0.3,
                    'Mouth_Upper_Up_Right': 0.3
                }
            },
            'g_k': {
                description: 'Back of tongue raised',
                morphs: {
                    'Tongue_Back': 0.8,
                    'Mouth_Open': 0.4,
                    'Jaw_Open': 0.2
                }
            },
            'hh': {
                description: 'Breathy H sound',
                morphs: {
                    'Mouth_Open': 0.6,
                    'Jaw_Open': 0.4
                }
            },
            'ih': {
                description: 'Bit - Small mouth opening',
                morphs: {
                    'Mouth_Open': 0.3,
                    'Mouth_Stretch_Left': 0.3,
                    'Mouth_Stretch_Right': 0.3,
                    'Jaw_Open': 0.15
                }
            },
            'iy': {
                description: 'Beat - Wide smile',
                morphs: {
                    'Mouth_Smile_Left': 0.8,
                    'Mouth_Smile_Right': 0.8,
                    'Mouth_Stretch_Left': 0.4,
                    'Mouth_Stretch_Right': 0.4
                }
            },
            'l': {
                description: 'Tongue tip up for L',
                morphs: {
                    'Tongue_Tip_Up': 0.95,
                    'Mouth_Open': 0.4,
                    'Jaw_Open': 0.25
                }
            },
            'n': {
                description: 'Tongue tip up, mouth more closed',
                morphs: {
                    'Tongue_Tip_Up': 0.9,
                    'Mouth_Close': 0.3,
                    'Mouth_Open': 0.2
                }
            },
            'ng': {
                description: 'Back tongue up, mouth closed',
                morphs: {
                    'Tongue_Back': 0.9,
                    'Mouth_Close': 0.5,
                    'Mouth_Open': 0.1
                }
            },
            'ow': {
                description: 'Boat - Strong rounding',
                morphs: {
                    'Mouth_Funnel': 0.9,
                    'Mouth_Pucker_Lower': 0.8,
                    'Mouth_Pucker_Upper': 0.7,
                    'Mouth_Open': 0.4
                }
            },
            'oy': {
                description: 'Boy - Round to smile transition',
                morphs: {
                    'Mouth_Funnel': 0.6,
                    'Mouth_Pucker_Lower': 0.5,
                    'Mouth_Smile_Left': 0.4,
                    'Mouth_Smile_Right': 0.4
                }
            },
            'r': {
                description: 'Red - Strong tongue curl',
                morphs: {
                    'Tongue_Curl': 0.95,
                    'Mouth_Funnel': 0.5,
                    'Mouth_Open': 0.3,
                    'Mouth_Pucker_Lower': 0.3
                }
            },
            'th': {
                description: 'Tongue tip protruding',
                morphs: {
                    'Tongue_Out': 0.9,
                    'Mouth_Open': 0.5,
                    'Jaw_Open': 0.3,
                    'Tongue_Tip_Down': 0.2
                }
            },
            'uh': {
                description: 'Put - Small round opening',
                morphs: {
                    'Mouth_Pucker_Lower': 0.7,
                    'Mouth_Pucker_Upper': 0.6,
                    'Mouth_Open': 0.3,
                    'Mouth_Funnel': 0.4
                }
            },
            'uw': {
                description: 'Boot - Tight lip rounding',
                morphs: {
                    'Mouth_Pucker_Lower': 0.95,
                    'Mouth_Pucker_Upper': 0.9,
                    'Mouth_Funnel': 0.8,
                    'Mouth_Open': 0.3
                }
            },
            'w': {
                description: 'Way - Tight lip protrusion',
                morphs: {
                    'Mouth_Pucker_Lower': 0.85,
                    'Mouth_Pucker_Upper': 0.8,
                    'Mouth_Funnel': 0.7
                }
            },
            'y': {
                description: 'Yes - Slight smile position',
                morphs: {
                    'Mouth_Smile_Left': 0.5,
                    'Mouth_Smile_Right': 0.5,
                    'Mouth_Stretch_Left': 0.2,
                    'Mouth_Stretch_Right': 0.2
                }
            },
            'z': {
                description: 'Zoo - Teeth showing',
                morphs: {
                    'Mouth_Open': 0.25,
                    'Mouth_Stretch_Left': 0.4,
                    'Mouth_Stretch_Right': 0.4,
                    'Mouth_Upper_Up_Left': 0.2,
                    'Mouth_Upper_Up_Right': 0.2
                }
            }
        };
    }

    analyzeViseme(visemeCode) {
        const mapping = this.optimizedMorphMappings[visemeCode];
        if (!mapping) {
            return {
                viseme: visemeCode,
                error: 'Unknown viseme',
                success: false
            };
        }

        const morphs = mapping.morphs;
        const availableMorphs = Object.keys(morphs).filter(name => 
            this.availableMorphs.includes(name)
        );

        const morphAnalysis = Object.entries(morphs).map(([name, value]) => ({
            name: name,
            value: value,
            available: this.availableMorphs.includes(name),
            intensity: this.getIntensityLevel(value),
            visualImpact: this.calculateVisualImpact(name, value)
        }));

        const totalVisualImpact = morphAnalysis.reduce((sum, m) => sum + m.visualImpact, 0);
        const expectedVisualChange = totalVisualImpact > 0.3; // Threshold for visible change

        return {
            viseme: visemeCode,
            description: mapping.description,
            morphCount: Object.keys(morphs).length,
            availableMorphs: availableMorphs.length,
            morphAnalysis: morphAnalysis,
            totalVisualImpact: totalVisualImpact,
            expectedVisualChange: expectedVisualChange,
            confidence: this.calculateConfidence(morphAnalysis),
            success: true
        };
    }

    getIntensityLevel(value) {
        if (value >= 0.8) return 'High';
        if (value >= 0.5) return 'Medium';
        if (value >= 0.2) return 'Low';
        return 'Minimal';
    }

    calculateVisualImpact(morphName, value) {
        // Weight different morph types by visual prominence
        const morphWeights = {
            'Mouth_Open': 1.0,
            'Jaw_Open': 0.8,
            'Mouth_Smile_Left': 0.7,
            'Mouth_Smile_Right': 0.7,
            'Mouth_Stretch_Left': 0.6,
            'Mouth_Stretch_Right': 0.6,
            'Mouth_Funnel': 0.9,
            'Mouth_Pucker_Lower': 0.8,
            'Mouth_Pucker_Upper': 0.8,
            'Tongue_Out': 0.9,
            'Tongue_Tip_Up': 0.6,
            'Tongue_Curl': 0.5,
            'Mouth_Close': 0.7
        };

        const weight = morphWeights[morphName] || 0.5;
        return value * weight;
    }

    calculateConfidence(morphAnalysis) {
        const availableCount = morphAnalysis.filter(m => m.available).length;
        const totalCount = morphAnalysis.length;
        
        if (totalCount === 0) return 0;
        
        const availabilityScore = availableCount / totalCount;
        const intensityScore = morphAnalysis.reduce((sum, m) => sum + m.value, 0) / totalCount;
        
        return (availabilityScore * 0.7) + (intensityScore * 0.3);
    }

    runFullAnalysis() {
        console.log('🎭 Running GLB Morph Target Analysis for All ARKit Visemes');
        console.log('=' .repeat(70));

        const results = this.arkitVisemes.map(viseme => this.analyzeViseme(viseme));
        
        // Sort by visual impact for better display
        results.sort((a, b) => b.totalVisualImpact - a.totalVisualImpact);

        let totalExpectedChanges = 0;
        let highConfidenceCount = 0;

        results.forEach((result, index) => {
            if (!result.success) return;

            const status = result.expectedVisualChange ? '✅' : '⚠️';
            const confidence = (result.confidence * 100).toFixed(1);
            
            console.log(`\n${index + 1}. ${status} ${result.viseme.toUpperCase()} - ${result.description}`);
            console.log(`   Visual Impact: ${result.totalVisualImpact.toFixed(2)} | Confidence: ${confidence}% | Morphs: ${result.morphCount}`);
            
            if (result.expectedVisualChange) {
                totalExpectedChanges++;
                console.log(`   Primary Morphs:`);
                result.morphAnalysis
                    .filter(m => m.value > 0.3 && m.available)
                    .slice(0, 3)
                    .forEach(m => {
                        console.log(`     • ${m.name}: ${m.value} (${m.intensity})`);
                    });
            }

            if (result.confidence > 0.7) highConfidenceCount++;
        });

        console.log('\n' + '='.repeat(70));
        console.log('📊 ANALYSIS SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total Visemes Analyzed: ${results.length}`);
        console.log(`Expected Visual Changes: ${totalExpectedChanges} (${Math.round(totalExpectedChanges/results.length*100)}%)`);
        console.log(`High Confidence (>70%): ${highConfidenceCount} (${Math.round(highConfidenceCount/results.length*100)}%)`);
        console.log(`Available Morph Targets: ${this.availableMorphs.length}`);

        // Generate calibrated morph parameters
        console.log('\n🎯 CALIBRATED MORPH PARAMETERS FOR PERFECT VISEME MATCHING:');
        console.log('='.repeat(70));

        results.filter(r => r.expectedVisualChange).forEach(result => {
            console.log(`\n"${result.viseme}": {`);
            result.morphAnalysis.filter(m => m.available && m.value > 0.1).forEach((morph, index, arr) => {
                const comma = index < arr.length - 1 ? ',' : '';
                console.log(`  "${morph.name}": ${morph.value}${comma}`);
            });
            console.log(`}`);
        });

        // Save results to file
        const reportPath = path.join(__dirname, `morph-analysis-report-${Date.now()}.json`);
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalVisemes: results.length,
                expectedVisualChanges: totalExpectedChanges,
                highConfidence: highConfidenceCount,
                availableMorphs: this.availableMorphs.length
            },
            results: results,
            optimizedMorphMappings: this.optimizedMorphMappings
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Full analysis report saved to: ${reportPath}`);

        return report;
    }
}

// Run analysis
if (require.main === module) {
    const analyzer = new GLBMorphAnalyzer();
    analyzer.runFullAnalysis();
}

module.exports = GLBMorphAnalyzer;