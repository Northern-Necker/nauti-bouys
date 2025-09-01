const mongoose = require('mongoose');

const spiritSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Spirit name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['Vodka', 'Gin', 'Rum', 'Tequila', 'Whiskey', 'Brandy', 'Absinthe', 'Mezcal', 'Liquor', 'Rice Wine'],
    required: [true, 'Spirit type is required']
  },
  subType: {
    type: String,
    maxlength: [50, 'Sub type cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        
        const validSubTypes = {
          'Whiskey': ['Bourbon', 'Rye Whiskey', 'Tennessee Whiskey', 'American Single Malt', 'Scotch Whisky', 'Irish Whiskey', 'Japanese Whisky', 'Canadian Whisky'],
          'Gin': ['London Dry', 'Plymouth', 'Old Tom', 'Navy Strength', 'Contemporary'],
          'Rum': ['White Rum', 'Gold Rum', 'Dark Rum', 'Spiced Rum', 'Overproof Rum'],
          'Vodka': ['Premium', 'Flavored', 'Craft'],
          'Tequila': ['Blanco', 'Reposado', 'Añejo', 'Extra Añejo'],
          'Brandy': ['Cognac', 'Armagnac', 'American Brandy', 'Pisco']
        };
        
        return !this.type || !validSubTypes[this.type] || validSubTypes[this.type].includes(value);
      },
      message: 'Invalid subType for the selected spirit type'
    }
  },
  abv: {
    type: Number,
    required: [true, 'ABV is required'],
    min: [0, 'ABV cannot be negative'],
    max: [100, 'ABV cannot exceed 100%']
  },
  shelf_tier: {
    type: String,
    enum: ['lower', 'top', 'ultra'],
    required: [true, 'Shelf tier is required'],
    default: 'lower'
  },
  mixing_appropriate: {
    type: Boolean,
    required: [true, 'Mixing appropriateness is required'],
    default: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  origin: {
    type: String,
    required: [true, 'Origin is required']
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative']
  },
  year: {
    type: Number,
    min: [1800, 'Year must be valid'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  servingTemp: {
    type: String,
    enum: ['Chilled', 'Room Temperature', 'Hot', 'Frozen'],
    default: 'Room Temperature'
  },
  ice: {
    type: String,
    enum: ['None', 'Cube', 'Pellet', 'Clear', 'Shaved'],
    default: 'None'
  },
  tastingNotes: [{
    type: String,
    trim: true
  }],
  bottleSize: {
    type: String,
    required: [true, 'Bottle size is required']
  },
  distillery: {
    type: String,
    required: [true, 'Distillery is required']
  },
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      maxlength: [300, 'Review cannot exceed 300 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  awards: [String],
  masterDistiller: String,
  yearDistilled: Number,
  yearBottled: Number
}, {
  timestamps: true
});

spiritSchema.pre('save', function(next) {
  // Calculate average rating
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
spiritSchema.index({ name: 'text', brand: 'text', type: 'text', description: 'text' });
spiritSchema.index({ type: 1, isAvailable: 1 });
spiritSchema.index({ averageRating: -1 });
spiritSchema.index({ shelf_tier: 1 });
spiritSchema.index({ mixing_appropriate: 1 });

module.exports = mongoose.model('Spirit', spiritSchema);
