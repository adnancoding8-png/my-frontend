/**
 * Script to find and fix products with broken Cloudinary images
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds all products
 * 3. Checks if each image exists in Cloudinary
 * 4. Reports broken images
 * 5. Optionally removes products with broken images
 * 
 * Usage:
 *   node server/scripts/fix-broken-images.js --check     # Just check, don't fix
 *   node server/scripts/fix-broken-images.js --fix       # Remove products with broken images
 *   node server/scripts/fix-broken-images.js --replace   # Replace broken images with placeholder
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { verifyImageExists } = require('../helpers/cloudinary');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || '--check';

const PLACEHOLDER_IMAGE = {
  url: 'https://via.placeholder.com/400x400?text=Image+Not+Available',
  public_id: 'placeholder'
};

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function checkProductImages() {
  console.log('\n🔍 Checking product images...\n');
  
  const products = await Product.find({});
  console.log(`Found ${products.length} products to check\n`);
  
  const brokenProducts = [];
  
  for (const product of products) {
    if (!product.images || product.images.length === 0) {
      console.log(`⚠️  Product "${product.title}" (${product._id}) has no images`);
      brokenProducts.push({
        product,
        reason: 'no_images'
      });
      continue;
    }
    
    const brokenImages = [];
    
    for (const image of product.images) {
      if (!image.url || !image.public_id) {
        console.log(`⚠️  Product "${product.title}" (${product._id}) has invalid image structure`);
        brokenImages.push(image);
        continue;
      }
      
      // Check if image exists in Cloudinary
      const exists = await verifyImageExists(image.public_id);
      
      if (!exists) {
        console.log(`❌ Product "${product.title}" (${product._id}) has broken image: ${image.url}`);
        brokenImages.push(image);
      } else {
        console.log(`✅ Product "${product.title}" (${product._id}) image OK: ${image.public_id}`);
      }
    }
    
    if (brokenImages.length > 0) {
      brokenProducts.push({
        product,
        brokenImages,
        reason: 'broken_images'
      });
    }
  }
  
  return brokenProducts;
}

async function fixBrokenProducts(brokenProducts) {
  console.log(`\n🔧 Fixing ${brokenProducts.length} products with broken images...\n`);
  
  for (const { product, brokenImages, reason } of brokenProducts) {
    if (mode === '--fix') {
      // Remove products with broken images
      await Product.findByIdAndDelete(product._id);
      console.log(`🗑️  Deleted product "${product.title}" (${product._id})`);
      
    } else if (mode === '--replace') {
      // Replace broken images with placeholder
      if (reason === 'no_images') {
        product.images = [PLACEHOLDER_IMAGE];
      } else {
        // Replace only broken images
        product.images = product.images.map(img => {
          const isBroken = brokenImages.some(broken => 
            broken.public_id === img.public_id || broken.url === img.url
          );
          return isBroken ? PLACEHOLDER_IMAGE : img;
        });
      }
      
      await product.save();
      console.log(`🔄 Replaced broken images in product "${product.title}" (${product._id})`);
    }
  }
}

async function generateReport(brokenProducts) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BROKEN IMAGES REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Total products with issues: ${brokenProducts.length}\n`);
  
  if (brokenProducts.length === 0) {
    console.log('✅ All products have valid images!\n');
    return;
  }
  
  console.log('Products with issues:\n');
  
  for (const { product, brokenImages, reason } of brokenProducts) {
    console.log(`Product: ${product.title}`);
    console.log(`ID: ${product._id}`);
    console.log(`Reason: ${reason}`);
    
    if (brokenImages && brokenImages.length > 0) {
      console.log(`Broken images (${brokenImages.length}):`);
      brokenImages.forEach(img => {
        console.log(`  - ${img.url || 'No URL'}`);
        console.log(`    Public ID: ${img.public_id || 'No public_id'}`);
      });
    }
    
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('\n💡 Recommendations:\n');
  console.log('1. Run with --fix to delete products with broken images');
  console.log('2. Run with --replace to replace broken images with placeholder');
  console.log('3. Manually re-upload images for these products\n');
}

async function main() {
  console.log('🚀 Starting broken images checker...\n');
  console.log(`Mode: ${mode}\n`);
  
  if (!['--check', '--fix', '--replace'].includes(mode)) {
    console.error('❌ Invalid mode. Use --check, --fix, or --replace');
    process.exit(1);
  }
  
  await connectDatabase();
  
  const brokenProducts = await checkProductImages();
  
  if (mode !== '--check' && brokenProducts.length > 0) {
    await fixBrokenProducts(brokenProducts);
  }
  
  await generateReport(brokenProducts);
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
