const fs = require('fs');
const path = require('path');

/**
 * Extract morph target names from FBX file by parsing as text
 * This approach searches for ARKit blendshape names and CC4 naming patterns
 */
function extractMorphTargetNames(fbxPath) {
    try {
        console.log(`Reading FBX file: ${fbxPath}`);
        
        // Read the FBX file as binary buffer
        const buffer = fs.readFileSync(fbxPath);
        
        // Convert to string for text parsing (some parts of FBX are text-readable)
        const content = buffer.toString('binary');
        
        // Common ARKit blendshape names to search for
        const arkitBlendshapes = [
            'eyeBlinkLeft', 'eyeLookDownLeft', 'eyeLookInLeft', 'eyeLookOutLeft', 'eyeLookUpLeft',
            'eyeSquintLeft', 'eyeWideLeft', 'eyeBlinkRight', 'eyeLookDownRight', 'eyeLookInRight',
            'eyeLookOutRight', 'eyeLookUpRight', 'eyeSquintRight', 'eyeWideRight', 'jawForward',
            'jawLeft', 'jawRight', 'jawOpen', 'mouthClose', 'mouthFunnel', 'mouthPucker',
            'mouthLeft', 'mouthRight', 'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft',
            'mouthFrownRight', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft',
            'mouthStretchRight', 'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower',
            'mouthShrugUpper', 'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft',
            'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight', 'browDownLeft',
            'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
            'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'noseSneerLeft', 'noseSneerRight',
            'tongueOut'
        ];
        
        // CC4 naming patterns to search for
        const cc4Patterns = [
            'CC_Base_', 'Jaw_', 'Mouth_', 'Eye_', 'Brow_', 'Cheek_', 'Nose_', 'Tongue_',
            'L_Eye_', 'R_Eye_', 'L_Brow_', 'R_Brow_', 'L_Cheek_', 'R_Cheek_',
            'L_Nose_', 'R_Nose_', 'L_Mouth_', 'R_Mouth_'
        ];
        
        const foundNames = new Set();
        
        // Search for ARKit blendshape names
        console.log('Searching for ARKit blendshape names...');
        arkitBlendshapes.forEach(name => {
            // Search for the name with various possible surrounding characters
            const patterns = [
                new RegExp(`\\b${name}\\b`, 'gi'),
                new RegExp(`"${name}"`, 'gi'),
                new RegExp(`'${name}'`, 'gi'),
                new RegExp(`${name}\\x00`, 'gi'), // null-terminated
            ];
            
            patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    foundNames.add(name);
                    console.log(`Found ARKit blendshape: ${name}`);
                }
            });
        });
        
        // Search for CC4 patterns
        console.log('Searching for CC4 naming patterns...');
        cc4Patterns.forEach(pattern => {
            const regex = new RegExp(`${pattern}[A-Za-z_0-9]+`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the match (remove null characters and extra whitespace)
                    const cleanMatch = match.replace(/\x00/g, '').trim();
                    if (cleanMatch.length > pattern.length) {
                        foundNames.add(cleanMatch);
                        console.log(`Found CC4 pattern: ${cleanMatch}`);
                    }
                });
            }
        });
        
        // Also search for any string that looks like a morph target name
        console.log('Searching for general morph target patterns...');
        const morphPatterns = [
            /[A-Za-z][A-Za-z0-9_]*[Bb]lend[Ss]hape[A-Za-z0-9_]*/gi,
            /[A-Za-z][A-Za-z0-9_]*[Mm]orph[A-Za-z0-9_]*/gi,
            /[A-Za-z][A-Za-z0-9_]*[Tt]arget[A-Za-z0-9_]*/gi,
        ];
        
        morphPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleanMatch = match.replace(/\x00/g, '').trim();
                    if (cleanMatch.length > 3) {
                        foundNames.add(cleanMatch);
                        console.log(`Found morph pattern: ${cleanMatch}`);
                    }
                });
            }
        });
        
        // Convert Set to sorted array
        const sortedNames = Array.from(foundNames).sort();
        
        console.log(`\nTotal morph target names found: ${sortedNames.length}`);
        console.log('\nAll found names:');
        sortedNames.forEach((name, index) => {
            console.log(`${index + 1}. ${name}`);
        });
        
        // Save results to file
        const outputPath = path.join(__dirname, 'extracted-morph-targets.json');
        const results = {
            sourceFile: fbxPath,
            extractedAt: new Date().toISOString(),
            totalFound: sortedNames.length,
            morphTargetNames: sortedNames
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to: ${outputPath}`);
        
        return sortedNames;
        
    } catch (error) {
        console.error('Error extracting morph target names:', error);
        return [];
    }
}

// Main execution
const fbxPath = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'SavannahAvatar-Unity.fbx');

console.log('FBX Morph Target Name Extractor');
console.log('================================');

if (!fs.existsSync(fbxPath)) {
    console.error(`FBX file not found: ${fbxPath}`);
    console.log('Please ensure the Unity FBX file is copied to frontend/public/assets/SavannahAvatar-Unity.fbx');
    process.exit(1);
}

const morphTargetNames = extractMorphTargetNames(fbxPath);

if (morphTargetNames.length === 0) {
    console.log('\nNo morph target names found. This could mean:');
    console.log('1. The FBX file doesn\'t contain morph targets');
    console.log('2. The morph target names are stored in a binary format we can\'t parse');
    console.log('3. The file uses a different naming convention');
} else {
    console.log(`\nSuccess! Found ${morphTargetNames.length} potential morph target names.`);
    console.log('Check the extracted-morph-targets.json file for the complete list.');
}
