import { analyzeVisemeMappings, getEnhancedVisemeMappings } from '../utils/visemeAnalyzer.js';

async function runVisemeAnalysis() {
  console.log('🔍 VISEME MAPPING ANALYSIS');
  console.log('=' .repeat(60));
  
  const glbUrl = '/assets/party-f-0013-fixed.glb';
  
  try {
    const analysis = await analyzeVisemeMappings(glbUrl);
    const enhancements = getEnhancedVisemeMappings();
    
    console.log('\n📦 Available Morphs by Mesh:');
    console.log('--------------------------------');
    console.log(`CC_Game_Tongue (${analysis.availableMorphs.CC_Game_Tongue.length} morphs):`);
    console.log(analysis.availableMorphs.CC_Game_Tongue.join(', '));
    
    console.log(`\nCC_Game_Body (${analysis.availableMorphs.CC_Game_Body.length} morphs):`);
    console.log(analysis.availableMorphs.CC_Game_Body.join(', '));
    
    console.log('\n✅ Currently Used Morphs:');
    console.log('--------------------------------');
    console.log(analysis.usedMorphs.join(', '));
    
    if (analysis.missingMorphs.length > 0) {
      console.log('\n❌ MISSING MORPHS (need to fix):');
      console.log('--------------------------------');
      analysis.missingMorphs.forEach(({ viseme, morph }) => {
        console.log(`  ${viseme}: ${morph} - NOT FOUND IN MODEL`);
      });
    }
    
    console.log('\n🚫 Unused Morphs (could enhance realism):');
    console.log('--------------------------------');
    if (analysis.suggestions.lipMorphs.length > 0) {
      console.log('Lip morphs:', analysis.suggestions.lipMorphs.join(', '));
    }
    if (analysis.suggestions.tongueMorphs.length > 0) {
      console.log('Tongue morphs:', analysis.suggestions.tongueMorphs.join(', '));
    }
    if (analysis.suggestions.jawMorphs.length > 0) {
      console.log('Jaw morphs:', analysis.suggestions.jawMorphs.join(', '));
    }
    
    console.log('\n🎯 VISEME MAPPING REVIEW:');
    console.log('=' .repeat(60));
    
    Object.entries(analysis.currentMappings).forEach(([viseme, morphs]) => {
      const enhancement = enhancements[viseme];
      const allMorphs = [...analysis.availableMorphs.CC_Game_Body, ...analysis.availableMorphs.CC_Game_Tongue];
      
      console.log(`\n${viseme} - ${enhancement ? enhancement.description : 'No description'}:`);
      console.log(`  Current: ${morphs.join(', ')}`);
      
      // Check if all morphs exist
      const missingInViseme = morphs.filter(m => !allMorphs.includes(m));
      if (missingInViseme.length > 0) {
        console.log(`  ⚠️ Missing: ${missingInViseme.join(', ')}`);
      }
      
      // Show enhancement suggestions
      if (enhancement) {
        const suggestedMorphs = enhancement.suggested.filter(m => allMorphs.includes(m));
        const unavailableSuggested = enhancement.suggested.filter(m => !allMorphs.includes(m));
        
        if (suggestedMorphs.length > morphs.length) {
          console.log(`  💡 Enhanced: ${suggestedMorphs.join(', ')}`);
        }
        if (unavailableSuggested.length > 0) {
          console.log(`  ❌ Suggested but unavailable: ${unavailableSuggested.join(', ')}`);
        }
      }
    });
    
    // Generate optimized mappings based on available morphs
    console.log('\n✨ OPTIMIZED MAPPINGS FOR YOUR MODEL:');
    console.log('=' .repeat(60));
    
    const allAvailable = [...analysis.availableMorphs.CC_Game_Body, ...analysis.availableMorphs.CC_Game_Tongue];
    
    Object.entries(enhancements).forEach(([viseme, config]) => {
      const availableSuggested = config.suggested.filter(m => allAvailable.includes(m));
      
      // If suggested morphs aren't available, keep current if they work
      const currentMorphs = analysis.currentMappings[viseme] || [];
      const workingCurrent = currentMorphs.filter(m => allAvailable.includes(m));
      
      const optimized = availableSuggested.length > 0 ? availableSuggested : workingCurrent;
      
      if (optimized.length > 0) {
        console.log(`'${viseme}': [${optimized.map(m => `'${m}'`).join(', ')}],`);
      }
    });
    
    return analysis;
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Run if executed directly
if (typeof window !== 'undefined') {
  window.runVisemeAnalysis = runVisemeAnalysis;
  console.log('Run window.runVisemeAnalysis() to analyze viseme mappings');
}

export { runVisemeAnalysis };
