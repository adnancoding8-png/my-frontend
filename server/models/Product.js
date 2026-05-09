const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    images: [{
      url: {
        type: String,
        required: [true, 'Image URL is required']
      },
      public_id: {
        type: String,
        required: [true, 'Image public_id is required']
      }
    }],
    title: String,
    description: String,
    
    // Legacy category field (maintained for backward compatibility)
    category: String,
    
    // New hierarchical category structure
    department: {
      type: String,
      enum: ['men', 'women', 'electronics', 'lifestyle', 'promotions'],
      default: 'lifestyle'
    },
    primaryCategory: {
      type: String,
      default: 'general'
    },
    subCategories: [{
      type: String
    }],
    
    brand: String,
    price: Number,
    salePrice: Number,
    totalStock: Number,
    averageReview: Number,
    
    // Enhanced attributes for filtering
    attributes: {
      color: [String],
      size: [String],
      material: String,
      // Additional flexible attributes
      specifications: mongoose.Schema.Types.Mixed
    },
    
    // Search and indexing
    searchKeywords: [String],
    
    // Computed fields
    isHotOffer: {
      type: Boolean,
      default: function() {
        return this.salePrice > 0 && this.salePrice < this.price;
      }
    }
  },
  { 
    timestamps: true,
    // Add indexes for efficient filtering
    indexes: [
      { department: 1, primaryCategory: 1 },
      { department: 1, primaryCategory: 1, subCategories: 1 },
      { brand: 1, department: 1 },
      { isHotOffer: 1 },
      { searchKeywords: 1 },
      { price: 1, salePrice: 1 }
    ]
  }
);

// Category to department mapping utility
const categoryToDepartmentMapping = {
  'men': 'men',
  'women': 'women',
  'kids': 'lifestyle',
  'accessories': 'lifestyle',
  'footwear': 'lifestyle',
  'electronics': 'electronics',
  'sports': 'lifestyle',
  'beauty': 'women'
};

// Pre-save middleware to handle legacy data transformation
ProductSchema.pre('save', function(next) {
  // Validate images have both url and public_id
  if (this.images && this.images.length > 0) {
    for (const image of this.images) {
      if (!image.url || !image.public_id) {
        return next(new Error('Each image must have both url and public_id'));
      }
    }
  }
  
  // If department is not set but category is available, map it
  if (!this.department && this.category) {
    this.department = categoryToDepartmentMapping[this.category.toLowerCase()] || 'lifestyle';
  }
  
  // If primaryCategory is not set, use category or default
  if (!this.primaryCategory) {
    this.primaryCategory = this.category || 'general';
  }
  
  // Ensure department has a value
  if (!this.department) {
    this.department = 'lifestyle';
  }
  
  // Ensure primaryCategory has a value
  if (!this.primaryCategory) {
    this.primaryCategory = 'general';
  }
  
  next();
});

module.exports = mongoose.model("Product", ProductSchema);
