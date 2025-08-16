const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Import all beverage models
const Cocktail = require('../models/Cocktail');
const Beer = require('../models/Beer');
const Wine = require('../models/Wine');
const Spirit = require('../models/Spirit');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');

// Black Forest Labs API configuration
const BFL_API_KEY = '3a44adf6-1471-432a-b330-08df1a90983a';
const BFL_API_URL = 'https://api.bfl.ai/v1/flux-pro-1.1';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images/beverages');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to make API request to Black Forest Labs
async function makeAPIRequest(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: prompt,
      width: 512,
      height: 512,
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
        resolve(`/images/beverages/${filename}`);
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
    console.log(`🎨 Generating: ${filename}`);
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

// Function to create image prompt for beverages
function createImagePrompt(beverage, type) {
  const baseStyle = "professional food photography, high quality, clean background, studio lighting, appetizing presentation";
  
  let specificPrompt = "";
  
  switch (type) {
    case 'cocktail':
      const glassType = beverage.glassType || 'cocktail glass';
      const garnish = beverage.garnish || 'lemon twist';
      specificPrompt = `elegant ${beverage.name} cocktail in a ${glassType.toLowerCase()}, ${beverage.description}, garnished with ${garnish}, vibrant colors, ice cubes, condensation droplets`;
      break;
      
    case 'beer':
      const color = beverage.color || 'golden';
      specificPrompt = `${color.toLowerCase()} ${beverage.name} beer in a tall glass, frothy white head, condensation on glass, ${beverage.description}`;
      break;
      
    case 'wine':
      const wineColor = beverage.type === 'Red' ? 'deep red' : beverage.type === 'White' ? 'golden white' : 'pink rosé';
      specificPrompt = `elegant ${wineColor} ${beverage.name} wine in a wine glass, ${beverage.description}, crystal clear glass`;
      break;
      
    case 'spirit':
      specificPrompt = `premium ${beverage.name} ${beverage.type.toLowerCase()} in a rocks glass, amber liquid, ice cube, ${beverage.description}`;
      break;
      
    case 'mocktail':
      specificPrompt = `colorful ${beverage.name} mocktail in a ${beverage.glassType.toLowerCase()}, ${beverage.description}, fresh fruit garnish, vibrant non-alcoholic drink`;
      break;
      
    case 'non-alcoholic':
      specificPrompt = `refreshing ${beverage.name} in a ${beverage.glassType.toLowerCase()}, ${beverage.description}, fresh and appealing presentation`;
      break;
      
    default:
      specificPrompt = `${beverage.name} beverage, ${beverage.description}`;
  }
  
  return `${specificPrompt}, ${baseStyle}`;
}

// Main function to generate all images
async function generateAllImages() {
  try {
    console.log('🎨 Starting image generation for all beverages...\n');

    // Get all beverages from database
    const cocktails = await Cocktail.find({});
    const beers = await Beer.find({});
    const wines = await Wine.find({});
    const spirits = await Spirit.find({});
    const mocktails = await Mocktail.find({});
    const otherNonAlcoholic = await OtherNonAlcoholic.find({});

    const allBeverages = [
      ...cocktails.map(b => ({ ...b.toObject(), type: 'cocktail' })),
      ...beers.map(b => ({ ...b.toObject(), type: 'beer' })),
      ...wines.map(b => ({ ...b.toObject(), type: 'wine' })),
      ...spirits.map(b => ({ ...b.toObject(), type: 'spirit' })),
      ...mocktails.map(b => ({ ...b.toObject(), type: 'mocktail' })),
      ...otherNonAlcoholic.map(b => ({ ...b.toObject(), type: 'non-alcoholic' }))
    ];

    console.log(`Found ${allBeverages.length} beverages to generate images for\n`);

    let successCount = 0;
    let failCount = 0;

    // Generate images for each beverage
    for (let i = 0; i < allBeverages.length; i++) {
      const beverage = allBeverages[i];
      const filename = `${beverage.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${beverage.type}.jpg`;
      const prompt = createImagePrompt(beverage, beverage.type);
      
      console.log(`\n--- Processing ${i + 1}/${allBeverages.length}: ${beverage.name} ---`);
      
      const imagePath = await generateImage(prompt, filename);
      
      if (imagePath) {
        // Update the beverage in database with image path
        const Model = getModelByType(beverage.type);
        await Model.findByIdAndUpdate(beverage._id, { image: imagePath });
        console.log(`✅ Updated ${beverage.name} with image path`);
        successCount++;
      } else {
        console.log(`❌ Failed to generate image for ${beverage.name}`);
        failCount++;
      }
      
      // Add delay to avoid rate limiting (24 concurrent max)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 Image generation completed!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${allBeverages.length}`);
    
  } catch (error) {
    console.error('❌ Error generating images:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Helper function to get model by type
function getModelByType(type) {
  switch (type) {
    case 'cocktail': return Cocktail;
    case 'beer': return Beer;
    case 'wine': return Wine;
    case 'spirit': return Spirit;
    case 'mocktail': return Mocktail;
    case 'non-alcoholic': return OtherNonAlcoholic;
    default: throw new Error(`Unknown beverage type: ${type}`);
  }
}

// Run the image generation
generateAllImages();
