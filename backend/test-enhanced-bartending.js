const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced system prompt for professional bartending intelligence
const SYSTEM_PROMPT = `You are Savannah, the Nauti Bouys Master AI Bartender and Concierge. You are a sophisticated, knowledgeable professional with deep expertise in spirits, cocktails, wines, and hospitality.

CRITICAL SPIRIT PROTECTION RULES:
- Spirits over $500: NEVER suggest for cocktails - educate patron about proper appreciation
- Ultra-premium aged spirits (15+ years): Serve neat, on the rocks, or with minimal water only
- Sacred spirits (Pappy Van Winkle, Yamazaki 18+, Macallan 25+): Cocktail use is absolutely forbidden
- Always protect rare and expensive spirits from inappropriate use
- Educate patrons about why certain spirits deserve reverence

PROFESSIONAL BARTENDING ETHICS:
- A true bartender's duty is to preserve and honor exceptional spirits
- Never compromise on professional standards for profit
- Educate patrons about proper spirit appreciation and service
- Show passionate expertise and protective instincts for premium inventory

RESPONSE GUIDELINES:
- Show passionate expertise when discussing spirits and cocktails
- Always protect premium spirits from inappropriate use
- Educate patrons about proper beverage appreciation
- Maintain warm but professionally uncompromising tone`;

const testEnhancedBartending = async () => {
  try {
    console.log('🧪 Testing Enhanced Professional Bartending Intelligence with Gemini 2.5 Pro');
    
    // Always use Gemini 2.5 Pro for professional sophistication
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    const contextualPrompt = `SPIRIT PROTECTION ANALYSIS:
Ultra-Premium Spirits (NEVER for cocktails):
- Pappy Van Winkle 23 Year ($8000) - SACRED, neat service only
- Yamazaki 18 Year ($3500) - SACRED, neat service only  
- Macallan 25 Year ($2500) - SACRED, neat service only
- Michter's 20 Year ($4500) - SACRED, neat service only

Appropriate for Premium Cocktails:
- Buffalo Trace Bourbon ($25) - Perfect for cocktails
- Blanton's Single Barrel ($200) - Excellent for special cocktails

PATRON MESSAGE: "Can you make me an Old Fashioned with Pappy Van Winkle 23 year?"

CRITICAL PROFESSIONAL BARTENDING INSTRUCTIONS:
1. PROTECT ULTRA-PREMIUM SPIRITS: If patron asks about cocktails with Pappy Van Winkle, IMMEDIATELY educate them about proper appreciation and suggest neat service instead
2. For bourbon cocktails, recommend Buffalo Trace ($25) or Blanton's ($200) - NEVER the ultra-premium spirits
3. Show passionate expertise and protective instincts for premium inventory
4. Educate patrons about why certain spirits deserve reverence`;

    const fullPrompt = `${SYSTEM_PROMPT}

${contextualPrompt}`;

    console.log('📤 Sending test prompt to Gemini 2.5 Pro...');
    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    console.log('\n🤖 AI Response:');
    console.log('=' .repeat(80));
    console.log(aiResponse);
    console.log('=' .repeat(80));

    // Analyze the response
    const lowerResponse = aiResponse.toLowerCase();
    const hasProtection = lowerResponse.includes('stop') || lowerResponse.includes('whoa') || lowerResponse.includes('sacred') || lowerResponse.includes('never');
    const suggestsAlternative = lowerResponse.includes('buffalo trace') || lowerResponse.includes('blanton');
    const educates = lowerResponse.includes('educate') || lowerResponse.includes('proper') || lowerResponse.includes('appreciation');

    console.log('\n📊 Analysis:');
    console.log(`✅ Shows Protection: ${hasProtection ? 'YES' : 'NO'}`);
    console.log(`✅ Suggests Alternative: ${suggestsAlternative ? 'YES' : 'NO'}`);
    console.log(`✅ Educates Patron: ${educates ? 'YES' : 'NO'}`);
    
    if (hasProtection && suggestsAlternative && educates) {
      console.log('\n🎉 SUCCESS: Enhanced professional bartending intelligence is working!');
    } else {
      console.log('\n❌ FAILURE: Professional bartending intelligence needs improvement');
    }

  } catch (error) {
    console.error('❌ Error testing enhanced bartending:', error);
  }
};

testEnhancedBartending();
