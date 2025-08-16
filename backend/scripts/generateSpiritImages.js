const fs = require('fs');
const path = require('path');
const spirits = require('../seeds/spirits');

const generateSpiritImages = async () => {
  try {
    console.log('🖼️  Generating AI images for spirits...');
    
    const imageDir = path.join(__dirname, '../public/images');
    
    // Ensure images directory exists
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    let generatedCount = 0;
    let skippedCount = 0;

    for (const spirit of spirits) {
      const imagePath = path.join(imageDir, spirit.image);
      
      // Check if image already exists
      if (fs.existsSync(imagePath)) {
        console.log(`⏭️  Skipping ${spirit.name} - image already exists`);
        skippedCount++;
        continue;
      }

      // Generate AI image prompt based on spirit details
      let prompt = `Professional product photography of ${spirit.name}, ${spirit.brand} ${spirit.type}`;
      
      if (spirit.subType) {
        prompt += ` ${spirit.subType}`;
      }
      
      if (spirit.age) {
        prompt += ` aged ${spirit.age} years`;
      }
      
      prompt += `, premium bottle on white background, studio lighting, high resolution, commercial photography style`;
      
      // Add specific details based on spirit type
      if (spirit.type === 'Whiskey') {
        prompt += ', amber liquid, elegant glass bottle, wooden cork';
      } else if (spirit.type === 'Tequila') {
        prompt += ', clear to golden liquid, agave-inspired bottle design';
      } else if (spirit.type === 'Gin') {
        prompt += ', clear liquid, botanical-inspired bottle design';
      } else if (spirit.type === 'Rum') {
        prompt += ', golden to dark amber liquid, tropical-inspired bottle';
      } else if (spirit.type === 'Vodka') {
        prompt += ', crystal clear liquid, sleek modern bottle design';
      } else if (spirit.type === 'Brandy') {
        prompt += ', rich amber liquid, elegant cognac-style bottle';
      }

      console.log(`🎨 Generating image for: ${spirit.name}`);
      console.log(`📝 Prompt: ${prompt}`);

      // Simulate AI image generation with a placeholder
      // In a real implementation, you would call an AI image generation API here
      const placeholderSvg = `
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${getLiquidColor(spirit.type)};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${getLiquidColor(spirit.type, true)};stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="600" fill="#ffffff"/>
  
  <!-- Bottle Shadow -->
  <ellipse cx="200" cy="580" rx="60" ry="15" fill="#00000010"/>
  
  <!-- Bottle Body -->
  <rect x="160" y="200" width="80" height="350" rx="8" fill="url(#bottleGrad)" stroke="#00000020" stroke-width="1"/>
  
  <!-- Bottle Neck -->
  <rect x="180" y="120" width="40" height="90" rx="4" fill="url(#bottleGrad)" stroke="#00000020" stroke-width="1"/>
  
  <!-- Cork/Cap -->
  <rect x="175" y="100" width="50" height="30" rx="6" fill="#8b4513" stroke="#00000030" stroke-width="1"/>
  
  <!-- Liquid -->
  <rect x="165" y="220" width="70" height="320" rx="6" fill="url(#liquidGrad)"/>
  
  <!-- Label Background -->
  <rect x="170" y="280" width="60" height="80" rx="4" fill="#ffffff" stroke="#00000015" stroke-width="1"/>
  
  <!-- Brand Text -->
  <text x="200" y="300" text-anchor="middle" font-family="serif" font-size="8" font-weight="bold" fill="#333">${spirit.brand}</text>
  
  <!-- Spirit Name -->
  <text x="200" y="315" text-anchor="middle" font-family="serif" font-size="6" fill="#666">${spirit.name.length > 20 ? spirit.name.substring(0, 17) + '...' : spirit.name}</text>
  
  <!-- Type -->
  <text x="200" y="330" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#888">${spirit.type}</text>
  
  <!-- Age Statement -->
  ${spirit.age ? `<text x="200" y="345" text-anchor="middle" font-family="serif" font-size="6" font-weight="bold" fill="#b8860b">${spirit.age} YEARS</text>` : ''}
  
  <!-- ABV -->
  <text x="200" y="520" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#666">${spirit.abv}% ABV</text>
  
  <!-- Bottle Highlights -->
  <rect x="165" y="200" width="8" height="300" rx="4" fill="#ffffff40"/>
  <rect x="175" y="105" width="6" height="20" rx="3" fill="#ffffff60"/>
</svg>`;

      // Write the SVG file
      fs.writeFileSync(imagePath, placeholderSvg);
      
      console.log(`✅ Generated: ${spirit.image}`);
      generatedCount++;
      
      // Small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Image generation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Generated: ${generatedCount} images`);
    console.log(`   Skipped: ${skippedCount} images`);
    console.log(`   Total spirits: ${spirits.length}`);
    
    console.log(`\n🍷 Spirit Collection by Type:`);
    const typeCount = {};
    spirits.forEach(spirit => {
      typeCount[spirit.type] = (typeCount[spirit.type] || 0) + 1;
    });
    
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} bottles`);
    });

  } catch (error) {
    console.error('❌ Error generating spirit images:', error);
  }
};

function getLiquidColor(type, darker = false) {
  const colors = {
    'Whiskey': darker ? '#b8860b' : '#daa520',
    'Tequila': darker ? '#f4a460' : '#f5deb3',
    'Gin': darker ? '#e6f3ff' : '#f0f8ff',
    'Rum': darker ? '#8b4513' : '#cd853f',
    'Vodka': darker ? '#f0f8ff' : '#ffffff',
    'Brandy': darker ? '#8b4513' : '#d2691e',
    'Mezcal': darker ? '#f4a460' : '#f5deb3'
  };
  return colors[type] || (darker ? '#daa520' : '#f5deb3');
}

generateSpiritImages();
