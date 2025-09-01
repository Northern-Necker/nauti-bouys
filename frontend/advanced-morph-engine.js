/**
 * Advanced Morph Engine for Intelligent Viseme Optimization
 * Handles all 6 use cases of AI-driven morph manipulation
 */

class AdvancedMorphEngine {
    constructor(morphTargets, conversationLogger) {
        this.morphTargets = morphTargets;
        this.log = conversationLogger;
        this.morphNameCache = new Map(); // Cache for fuzzy matching
        this.buildMorphCache();
    }

    buildMorphCache() {
        // Build efficient lookup cache for morph names
        this.morphTargets.forEach(morph => {
            const variations = [
                morph.name,
                morph.name.toLowerCase(),
                morph.name.replace(/_/g, ''),
                morph.name.replace(/([A-Z])/g, '_$1').toLowerCase(),
                morph.name.replace(/^V_/, ''),
                morph.name.replace(/^Mouth_/, ''),
                morph.name.replace(/^Jaw_/, ''),
                morph.name.replace(/^Tongue_/, '')
            ];
            
            variations.forEach(variation => {
                if (!this.morphNameCache.has(variation)) {
                    this.morphNameCache.set(variation, morph);
                }
            });
        });
        
        console.log(`🧠 Morph cache built: ${this.morphNameCache.size} name variations`);
    }

    /**
     * Parse sophisticated AI recommendations into actionable changes
     */
    parseAdvancedRecommendations(aiRecommendationData, currentViseme, currentMapping) {
        const changes = [];
        console.log('🔍 Parsing advanced AI recommendations:', aiRecommendationData);

        // Extract text from different possible sources
        let fullText = '';
        
        if (Array.isArray(aiRecommendationData)) {
            fullText = aiRecommendationData.join(' ');
        } else if (typeof aiRecommendationData === 'string') {
            fullText = aiRecommendationData;
        } else if (aiRecommendationData && typeof aiRecommendationData === 'object') {
            // Try to extract from common AI response fields
            const sources = [
                aiRecommendationData.recommendations,
                aiRecommendationData.issues,
                aiRecommendationData.observations,
                aiRecommendationData.aiRawResponse,
                aiRecommendationData.rawResponse
            ].filter(Boolean);
            
            fullText = sources.map(source => 
                Array.isArray(source) ? source.join(' ') : source
            ).join(' ');
        }
        
        console.log('📝 Full text for parsing:', fullText.substring(0, 200) + '...');

        // Extract all morph-specific instructions
        const morphInstructions = this.extractMorphInstructions(fullText);
        console.log('🎯 Found morph instructions:', morphInstructions);
        
        morphInstructions.forEach(instruction => {
            const change = this.processMorphInstruction(instruction, currentViseme, currentMapping);
            if (change) {
                changes.push(change);
                console.log('✅ Parsed instruction:', instruction, '→', change);
            }
        });

        // If no specific instructions found, try general patterns
        if (changes.length === 0) {
            console.log('⚠️ No specific instructions found, trying general patterns...');
            const generalChange = this.parseGeneralRecommendations(fullText, currentMapping);
            if (generalChange) {
                changes.push(generalChange);
                console.log('✅ Applied general change:', generalChange);
            }
        }

        return changes;
    }

    /**
     * Extract specific morph instructions from AI text
     */
    extractMorphInstructions(text) {
        const instructions = [];
        
        // Enhanced patterns for specific morph adjustments matching your AI's format
        const patterns = [
            // "Increase V_Explosive from 0.8 to 0.95 (+0.15)" or "Decrease V_Explosive from 1.0 to 0.85 (-15%)"
            /(?:increase|decrease|set|adjust)\s+([A-Z][A-Za-z_]+)\s+from\s+([\d.]+)\s+to\s+([\d.]+)(?:\s*\([^)]+\))?/gi,
            
            // "Add Jaw_Up at 0.3 intensity" or "Implement Lip_Compress at 0.4 intensity" - more precise
            /(?:add|introduce|implement)\s+([A-Z][A-Za-z_]+)(?:\s+morph)?\s+at\s+([\d.]+)(?:\s+intensity)?/gi,
            
            // "Remove Mouth_Stretch" or "Eliminate Corner_Pull" - must start with capital
            /(?:remove|eliminate|reduce)\s+([A-Z][A-Za-z_]+)/gi,
            
            // Direct specifications: "V_Explosive: 0.95" - must start with V_ or capital letter
            /(?:^|[^a-z])([V]_[A-Za-z_-]+|[A-Z][a-z_]+[A-Z][A-Za-z_]*)\s*[:\s]+\s*([\d.]+)/gmi,
            
            // Numbered target values: "- Primary V_Explosive: 0.85"
            /-\s*(?:primary|secondary|tertiary)?\s*([V]_[A-Za-z_-]+|[A-Z][A-Za-z_]+):\s*([\d.]+)/gi
        ];

        patterns.forEach((pattern, patternIndex) => {
            let match;
            // Reset lastIndex for global patterns
            pattern.lastIndex = 0;
            
            while ((match = pattern.exec(text)) !== null) {
                const morphName = match[1] ? match[1].trim() : '';
                const value = match[2] ? parseFloat(match[2]) : null;
                const targetValue = match[3] ? parseFloat(match[3]) : null;
                
                // Skip if no clear morph name or invalid values
                if (!morphName || morphName.length < 2) continue;
                if (value !== null && (isNaN(value) || value < 0 || value > 2)) continue;
                
                // Skip common non-morph words that get caught by broad patterns
                const nonMorphWords = [
                    'at', 'to', 'from', 'with', 'by', 'for', 'in', 'on', 'of', 'the', 'and', 'or',
                    'approximately', 'compression', 'intensity', 'morph', 'value', 'adjustment',
                    'target', 'current', 'position', 'angle', 'degree', 'percentage', 'ratio',
                    'ADJUSTMENTS', 'ANALYSIS', 'SCORE', 'PRIMARY', 'SECONDARY', 'Reduce', 'reduce'
                ];
                
                if (nonMorphWords.includes(morphName) || nonMorphWords.includes(morphName.toLowerCase())) {
                    continue;
                }
                
                instructions.push({
                    original: match[0],
                    morphName: this.cleanMorphName(morphName),
                    value: value,
                    targetValue: targetValue,
                    action: this.determineAction(match[0]),
                    patternIndex: patternIndex // For debugging
                });
                
                console.log(`🎯 Pattern ${patternIndex} matched:`, {
                    original: match[0],
                    morphName: this.cleanMorphName(morphName),
                    value, targetValue
                });
            }
        });

        // Remove duplicates - keep the last occurrence of each morph
        const uniqueInstructions = [];
        const morphsSeen = new Set();
        
        // Process in reverse to keep the last occurrence
        for (let i = instructions.length - 1; i >= 0; i--) {
            const instruction = instructions[i];
            const key = `${instruction.morphName}_${instruction.action}`;
            
            if (!morphsSeen.has(key)) {
                morphsSeen.add(key);
                uniqueInstructions.unshift(instruction); // Add to beginning to maintain order
            }
        }
        
        console.log(`🧹 Deduplicated: ${instructions.length} → ${uniqueInstructions.length} instructions`);
        return uniqueInstructions;
    }
    
    /**
     * Clean and normalize morph names
     */
    cleanMorphName(name) {
        return name
            .replace(/\s+/g, '_')  // Replace spaces with underscores
            .replace(/[^A-Za-z0-9_]/g, '')  // Remove special characters
            .replace(/_+/g, '_')   // Collapse multiple underscores
            .replace(/^_|_$/g, '') // Remove leading/trailing underscores
            .trim();
    }

    /**
     * Determine the action from instruction text
     */
    determineAction(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('increase')) return 'increase';
        if (lowerText.includes('decrease') || lowerText.includes('reduce')) return 'decrease';
        if (lowerText.includes('add') || lowerText.includes('introduce')) return 'add';
        if (lowerText.includes('remove') || lowerText.includes('eliminate')) return 'remove';
        if (lowerText.includes('set') || lowerText.includes('adjust')) return 'set';
        return 'set'; // default
    }

    /**
     * Process individual morph instructions
     */
    processMorphInstruction(instruction, currentViseme, currentMapping) {
        const { morphName, value, targetValue, action } = instruction;
        
        // Find the actual morph target
        const morphTarget = this.findMorphTarget(morphName);
        if (!morphTarget) {
            console.warn(`⚠️ Morph not found: ${morphName}`);
            return null;
        }

        let finalValue = targetValue || value || 0.5;
        
        // Handle different actions
        switch (action) {
            case 'increase':
                if (targetValue && value) {
                    finalValue = targetValue;
                } else {
                    finalValue = Math.min(1.0, (value || 0.5) + 0.1);
                }
                break;
                
            case 'decrease':
                if (targetValue && value) {
                    finalValue = targetValue;
                } else {
                    finalValue = Math.max(0.0, (value || 0.5) - 0.1);
                }
                break;
                
            case 'add':
                finalValue = value || 0.3;
                break;
                
            case 'remove':
                finalValue = 0.0;
                break;
                
            case 'set':
            default:
                finalValue = targetValue || value || 0.5;
                break;
        }

        return {
            type: 'specific_morph',
            morphTarget: morphTarget,
            morphName: morphTarget.name,
            value: Math.max(0.0, Math.min(1.0, finalValue)),
            action: action,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${morphTarget.name} to ${finalValue.toFixed(2)}`
        };
    }

    /**
     * Parse general recommendations when no specific morph instructions found
     */
    parseGeneralRecommendations(text, currentMapping) {
        const lowerText = text.toLowerCase();
        
        // Global intensity adjustments
        const percentMatch = text.match(/(?:increase|decrease).*?(?:by\s+)?(\d+)%/i);
        if (percentMatch) {
            const percent = parseInt(percentMatch[1]) / 100;
            const isIncrease = lowerText.includes('increase');
            const adjustment = isIncrease ? percent : -percent;
            
            return {
                type: 'intensity_adjustment',
                adjustment: adjustment,
                description: `${isIncrease ? 'Increase' : 'Decrease'} overall intensity by ${Math.abs(percent * 100)}%`
            };
        }

        // Keyword-based adjustments
        if (lowerText.includes('stronger') || lowerText.includes('more pronounced')) {
            return {
                type: 'intensity_adjustment',
                adjustment: 0.1,
                description: 'Strengthen overall expression'
            };
        }
        
        if (lowerText.includes('weaker') || lowerText.includes('subtle')) {
            return {
                type: 'intensity_adjustment',
                adjustment: -0.1,
                description: 'Soften overall expression'
            };
        }

        return null;
    }

    /**
     * Find morph target with fuzzy matching
     */
    findMorphTarget(morphName) {
        if (!morphName) return null;
        
        // Try exact match first
        const exact = this.morphNameCache.get(morphName);
        if (exact) return exact;
        
        // Try case-insensitive
        const lowerName = morphName.toLowerCase();
        const caseInsensitive = this.morphNameCache.get(lowerName);
        if (caseInsensitive) return caseInsensitive;
        
        // Try partial matches
        for (const [key, morph] of this.morphNameCache) {
            if (key.includes(lowerName) || lowerName.includes(key)) {
                return morph;
            }
        }
        
        // Try similarity matching
        const candidates = Array.from(this.morphNameCache.keys());
        const bestMatch = this.findBestMatch(morphName, candidates);
        
        if (bestMatch && this.calculateSimilarity(morphName, bestMatch) > 0.6) {
            return this.morphNameCache.get(bestMatch);
        }
        
        return null;
    }

    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i-1] === str2[j-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j-1] + cost
                );
            }
        }
        
        const distance = matrix[len1][len2];
        return 1 - distance / Math.max(len1, len2);
    }

    /**
     * Find best matching string from candidates
     */
    findBestMatch(target, candidates) {
        let bestMatch = null;
        let bestScore = 0;
        
        candidates.forEach(candidate => {
            const score = this.calculateSimilarity(target.toLowerCase(), candidate.toLowerCase());
            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        });
        
        return bestMatch;
    }

    /**
     * Apply parsed changes to the 3D model
     */
    applyAdvancedChanges(changes, currentViseme, currentMapping) {
        const results = [];
        let newMapping = { ...currentMapping };
        
        console.log(`🔧 Applying ${changes.length} advanced changes to ${currentViseme}`);
        
        changes.forEach(change => {
            try {
                const result = this.applyIndividualChange(change, newMapping);
                results.push(result);
                
                // Update the mapping based on the change
                newMapping = this.updateMapping(newMapping, change);
                
            } catch (error) {
                console.error('❌ Error applying change:', change, error);
                results.push({
                    success: false,
                    change: change,
                    error: error.message
                });
            }
        });
        
        // Force visual update
        this.forceRender();
        
        return {
            results: results,
            newMapping: newMapping,
            appliedCount: results.filter(r => r.success).length,
            summary: this.generateChangeSummary(results)
        };
    }

    /**
     * Apply individual change to morph system
     */
    applyIndividualChange(change, currentMapping) {
        switch (change.type) {
            case 'specific_morph':
                return this.applySpecificMorph(change);
                
            case 'intensity_adjustment':
                return this.applyIntensityAdjustment(change, currentMapping);
                
            default:
                throw new Error(`Unknown change type: ${change.type}`);
        }
    }

    /**
     * Apply specific morph value change
     */
    applySpecificMorph(change) {
        const { morphTarget, value, description } = change;
        
        // Apply the morph value
        morphTarget.mesh.morphTargetInfluences[morphTarget.index] = value;
        
        console.log(`✅ Applied: ${morphTarget.name} = ${value.toFixed(3)}`);
        
        return {
            success: true,
            change: change,
            morphName: morphTarget.name,
            oldValue: morphTarget.mesh.morphTargetInfluences[morphTarget.index],
            newValue: value,
            description: description
        };
    }

    /**
     * Apply intensity adjustment to all current morphs
     */
    applyIntensityAdjustment(change, currentMapping) {
        const { adjustment, description } = change;
        let affectedMorphs = 0;
        
        // Apply adjustment to all morphs in current mapping
        currentMapping.morphs.forEach(morphName => {
            const morphTarget = this.findMorphTarget(morphName);
            if (morphTarget) {
                const currentValue = morphTarget.mesh.morphTargetInfluences[morphTarget.index] || 0;
                const newValue = Math.max(0.0, Math.min(1.0, currentValue + adjustment));
                morphTarget.mesh.morphTargetInfluences[morphTarget.index] = newValue;
                affectedMorphs++;
            }
        });
        
        return {
            success: true,
            change: change,
            affectedMorphs: affectedMorphs,
            adjustment: adjustment,
            description: description
        };
    }

    /**
     * Update mapping based on applied change
     */
    updateMapping(mapping, change) {
        const newMapping = { ...mapping };
        
        if (change.type === 'specific_morph') {
            const morphName = change.morphName;
            
            if (change.action === 'add' && !newMapping.morphs.includes(morphName)) {
                newMapping.morphs.push(morphName);
            } else if (change.action === 'remove') {
                newMapping.morphs = newMapping.morphs.filter(name => name !== morphName);
            }
        } else if (change.type === 'intensity_adjustment') {
            newMapping.intensity = Math.max(0.1, Math.min(1.0, 
                (newMapping.intensity || 0.5) + change.adjustment));
        }
        
        return newMapping;
    }

    /**
     * Generate summary of applied changes
     */
    generateChangeSummary(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        let summary = `Applied ${successful.length} changes successfully`;
        if (failed.length > 0) {
            summary += `, ${failed.length} failed`;
        }
        
        const descriptions = successful.map(r => r.description || r.change.description);
        if (descriptions.length > 0) {
            summary += `: ${descriptions.join('; ')}`;
        }
        
        return summary;
    }

    /**
     * Force visual update of 3D model
     */
    forceRender() {
        // This should be connected to the main rendering loop
        if (window.forceVisualUpdate) {
            window.forceVisualUpdate();
        }
    }

    /**
     * Discover potential alternative morphs for a viseme
     */
    discoverAlternativeMorphs(viseme, currentMapping) {
        const visemeKeywords = {
            'pp': ['explosive', 'bilabial', 'close', 'press', 'pucker'],
            'ff': ['dental', 'lip', 'labiodental', 'bite'],
            'th': ['tongue', 'dental', 'tip', 'out'],
            'dd': ['tongue', 'alveolar', 'up', 'tip'],
            'kk': ['velar', 'back', 'open', 'jaw'],
            'ch': ['affricate', 'fricative', 'sibilant'],
            'ss': ['sibilant', 'tight', 'smile', 'narrow'],
            'nn': ['nasal', 'tongue', 'up', 'close'],
            'rr': ['rhotic', 'curl', 'tongue', 'retroflex'],
            'aa': ['open', 'wide', 'jaw', 'low'],
            'e': ['mid', 'wide', 'spread'],
            'ih': ['high', 'front', 'wide', 'smile'],
            'oh': ['mid', 'back', 'round', 'O'],
            'ou': ['high', 'back', 'round', 'tight', 'pucker']
        };
        
        const keywords = visemeKeywords[viseme] || [];
        const alternatives = [];
        
        // Search through all available morphs for potential matches
        this.morphTargets.forEach(morph => {
            if (currentMapping.morphs.includes(morph.name)) return; // Skip current morphs
            
            const morphNameLower = morph.name.toLowerCase();
            const matchScore = keywords.reduce((score, keyword) => {
                if (morphNameLower.includes(keyword.toLowerCase())) {
                    return score + 1;
                }
                return score;
            }, 0);
            
            if (matchScore > 0) {
                alternatives.push({
                    morphTarget: morph,
                    matchScore: matchScore,
                    matchedKeywords: keywords.filter(k => morphNameLower.includes(k.toLowerCase()))
                });
            }
        });
        
        // Sort by match score
        alternatives.sort((a, b) => b.matchScore - a.matchScore);
        
        return alternatives.slice(0, 5); // Return top 5 alternatives
    }
}

// Export as ES6 module
export default AdvancedMorphEngine;