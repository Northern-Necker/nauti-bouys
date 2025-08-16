const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Import Spirit model
const Spirit = require('../models/Spirit');

// Black Forest Labs API configuration
const BFL_API_KEY = '3a44adf6-1471-432a-b330-08df1a90983a';
const BFL_API_URL = 'https://api.bfl.ai/v1/flux-pro-1.1';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Ensure beverages subdirectory exists
const beveragesDir = path.join(imagesDir, 'images', 'beverages');
if (!fs.existsSync(beveragesDir)) {
  fs.mkdirSync(beveragesDir, { recursive: true });
}

// Function to make API request to Black Forest Labs
async function makeAPIRequest(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: prompt,
      width: 512,
      height: 768, // Taller for bottle shape
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 2,
      output_format: "jpeg"
    });

    const options = {
      hostname: 'api.bfl.ai',
      port: 443,
      path: '/v1/flux-pro-1.1',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to poll for result using polling URL
async function pollForResult(pollingUrl, requestId) {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const url = new URL(pollingUrl);
      url.searchParams.append('id', requestId);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-key': BFL_API_KEY
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.status === 'Ready') {
              resolve(response);
            } else if (response.status === 'Error' || response.status === 'Failed') {
              reject(new Error(`Generation failed: ${JSON.stringify(response)}`));
            } else {
              // Still processing, poll again
              setTimeout(poll, 1000);
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    };

    poll();
  });
}

// Function to download image from delivery URL
async function downloadImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const imagePath = path.join(imagesDir, filename);
    const file = fs.createWriteStream(imagePath);

    https.get(imageUrl, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(filename);
      });

      file.on('error', (err) => {
        fs.unlink(imagePath, () => {}); // Delete incomplete file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to generate image using Black Forest Labs API
async function generateImage(prompt, filename) {
  try {
    console.log(`🥃 Generating: ${filename}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    // Step 1: Submit generation request
    const initialResponse = await makeAPIRequest(prompt);
    
    if (!initialResponse.id || !initialResponse.polling_url) {
      throw new Error(`Invalid API response: ${JSON.stringify(initialResponse)}`);
    }

    console.log(`⏳ Request submitted, ID: ${initialResponse.id}`);

    // Step 2: Poll for completion
    const result = await pollForResult(initialResponse.polling_url, initialResponse.id);
    
    if (!result.result || !result.result.sample) {
      throw new Error(`No image in result: ${JSON.stringify(result)}`);
    }

    console.log(`✅ Generation complete, downloading...`);

    // Step 3: Download the image
    const imagePath = await downloadImage(result.result.sample, filename);
    
    console.log(`💾 Saved: ${imagePath}`);
    return imagePath;

  } catch (error) {
    console.error(`❌ Failed to generate ${filename}:`, error.message);
    return null;
  }
}

// Function to create realistic spirit bottle prompts
function createSpiritBottlePrompt(spirit) {
  const baseStyle = "professional product photography, studio lighting, clean white background, high resolution, commercial quality";
  
  let bottleDescription = "";
  let liquidColor = "";
  let bottleShape = "";
  let labelStyle = "";
  
  // Determine bottle characteristics based on spirit type and brand
  const spiritType = spirit.type.toLowerCase();
  const spiritName = spirit.name.toLowerCase();
  const brand = spirit.brand.toLowerCase();
  
  if (spiritType.includes('whiskey') || spiritType.includes('bourbon') || spiritType.includes('scotch')) {
    liquidColor = "rich amber golden liquid";
    
    if (spiritName.includes('pappy van winkle')) {
      bottleShape = "tall elegant dark green glass bottle";
      labelStyle = "vintage cream colored label with classic serif typography";
      bottleDescription = `premium ${bottleShape} with ${labelStyle}, ${liquidColor}, cork stopper, luxury bourbon presentation`;
    } else if (spiritName.includes('yamazaki')) {
      bottleShape = "square shouldered clear glass bottle";
      labelStyle = "minimalist white label with Japanese characters and clean modern typography";
      bottleDescription = `elegant ${bottleShape} with ${labelStyle}, ${liquidColor}, black cap, Japanese whisky design`;
    } else if (spiritName.includes('macallan')) {
      bottleShape = "classic round shouldered bottle";
      labelStyle = "sophisticated tan and gold label with traditional Scottish design";
      bottleDescription = `premium ${bottleShape} with ${labelStyle}, ${liquidColor}, wooden cork, Scottish single malt presentation`;
    } else if (spiritName.includes('lagavulin')) {
      bottleShape = "traditional Scotch whisky bottle";
      labelStyle = "white label with black text and Scottish heritage design";
      bottleDescription = `authentic ${bottleShape} with ${labelStyle}, ${liquidColor}, cork stopper, Islay single malt styling`;
    } else if (spiritName.includes('blanton')) {
      bottleShape = "distinctive round bottle";
      labelStyle = "cream colored label with horse and jockey logo";
      bottleDescription = `unique ${bottleShape} with ${labelStyle}, ${liquidColor}, horse stopper cap, single barrel bourbon design`;
    } else {
      bottleShape = "classic whiskey bottle";
      labelStyle = "traditional whiskey label";
      bottleDescription = `premium ${bottleShape} with ${labelStyle}, ${liquidColor}, cork stopper`;
    }
  } else if (spiritType.includes('tequila')) {
    liquidColor = "crystal clear to light golden liquid";
    
    if (spiritName.includes('patron')) {
      bottleShape = "elegant tall clear glass bottle";
      labelStyle = "sophisticated silver and black label with bee logo";
      bottleDescription = `luxury ${bottleShape} with ${labelStyle}, ${liquidColor}, silver cap, ultra-premium tequila presentation`;
    } else if (spiritName.includes('clase azul')) {
      bottleShape = "hand-painted ceramic bottle";
      labelStyle = "artisanal blue and white Mexican pottery design";
      bottleDescription = `beautiful ${bottleShape} with ${labelStyle}, ${liquidColor}, decorative ceramic stopper, artisan tequila bottle`;
    } else if (spiritName.includes('don julio')) {
      bottleShape = "tall elegant dark bottle";
      labelStyle = "premium gold and black label with agave plant imagery";
      bottleDescription = `sophisticated ${bottleShape} with ${labelStyle}, ${liquidColor}, gold accents, añejo tequila design`;
    } else {
      bottleShape = "traditional tequila bottle";
      labelStyle = "Mexican heritage label design";
      bottleDescription = `authentic ${bottleShape} with ${labelStyle}, ${liquidColor}, agave-inspired design`;
    }
  } else if (spiritType.includes('gin')) {
    liquidColor = "crystal clear liquid";
    
    if (spiritName.includes('hendrick')) {
      bottleShape = "distinctive dark apothecary-style bottle";
      labelStyle = "Victorian-inspired cream label with ornate typography";
      bottleDescription = `unique ${bottleShape} with ${labelStyle}, ${liquidColor}, cork stopper, cucumber and rose gin presentation`;
    } else if (spiritName.includes('monkey 47')) {
      bottleShape = "premium clear glass bottle";
      labelStyle = "distinctive orange and black label with monkey illustration";
      bottleDescription = `craft ${bottleShape} with ${labelStyle}, ${liquidColor}, black cap, German gin design`;
    } else {
      bottleShape = "classic gin bottle";
      labelStyle = "botanical-themed label";
      bottleDescription = `traditional ${bottleShape} with ${labelStyle}, ${liquidColor}, juniper-inspired design`;
    }
  } else if (spiritType.includes('rum')) {
    liquidColor = "rich amber to dark golden liquid";
    bottleShape = "Caribbean-style rum bottle";
    labelStyle = "tropical heritage label design";
    bottleDescription = `authentic ${bottleShape} with ${labelStyle}, ${liquidColor}, cork stopper, Caribbean rum presentation`;
  } else if (spiritType.includes('vodka')) {
    liquidColor = "crystal clear liquid";
    
    if (spiritName.includes('grey goose')) {
      bottleShape = "frosted glass bottle";
      labelStyle = "elegant silver and white label with goose logo";
      bottleDescription = `premium ${bottleShape} with ${labelStyle}, ${liquidColor}, silver cap, French vodka design`;
    } else {
      bottleShape = "sleek vodka bottle";
      labelStyle = "minimalist modern label";
      bottleDescription = `clean ${bottleShape} with ${labelStyle}, ${liquidColor}, premium vodka presentation`;
    }
  } else {
    // Default for other spirits
    liquidColor = "amber liquid";
    bottleShape = "premium spirit bottle";
    labelStyle = "classic label design";
    bottleDescription = `elegant ${bottleShape} with ${labelStyle}, ${liquidColor}, luxury spirit presentation`;
  }
  
  return `${bottleDescription}, ${baseStyle}, centered composition, no shadows, product shot`;
}

// Main function to generate spirit images
async function generateSpiritImages() {
  try {
    console.log('🥃 Starting realistic spirit bottle image generation...\n');

    // Get all spirits from database
    const spirits = await Spirit.find({});
    console.log(`Found ${spirits.length} spirits to generate images for\n`);

    let successCount = 0;
    let failCount = 0;

    // Generate images for each spirit
    for (let i = 0; i < spirits.length; i++) {
      const spirit = spirits[i];
      const filename = spirit.image; // Use existing filename from database
      const prompt = createSpiritBottlePrompt(spirit);
      
      console.log(`\n--- Processing ${i + 1}/${spirits.length}: ${spirit.name} ---`);
      
      const imagePath = await generateImage(prompt, filename);
      
      if (imagePath) {
        console.log(`✅ Generated realistic bottle image for ${spirit.name}`);
        successCount++;
      } else {
        console.log(`❌ Failed to generate image for ${spirit.name}`);
        failCount++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 Spirit image generation completed!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${spirits.length}`);
    
  } catch (error) {
    console.error('❌ Error generating spirit images:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the spirit image generation
generateSpiritImages();
