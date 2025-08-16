const mongoose = require('mongoose');

const mocktailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mocktail name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      enum: ['oz', 'ml', 'dash', 'splash', 'drop', 'piece', 'slice', 'wedge', 'sprig', 'cup', 'tbsp', 'tsp'],
      required: true
    }
  }],
  prepMethod: {
    type: String,
    required: [true, 'Preparation method is required'],
    maxlength: [1000, 'Preparation method cannot exceed 1000 characters']
  },
  servingTemp: {
    type: String,
    enum: ['Chilled', 'Room Temperature', 'Hot', 'Frozen'],
    default: 'Chilled'
  },
  ice: {
    type: String,
    enum: ['None', 'Cube', 'Pellet', 'Clear', 'Shaved'],
    default: 'Cube'
  },
  tastingNotes: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['Fruity', 'Citrus', 'Herbal', 'Spicy', 'Sweet', 'Refreshing', 'Tropical', 'Classic', 'Signature'],
    required: [true, 'Category is required']
  },
  glassType: {
    type: String,
    enum: ['Rocks', 'Highball', 'Martini', 'Coupe', 'Hurricane', 'Wine', 'Mason Jar', 'Specialty'],
    required: true
  },
  garnish: {
    type: String,
    maxlength: [100, 'Garnish description cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  preparationTime: {
    type: Number, // in minutes
    min: [1, 'Preparation time must be at least 1 minute'],
    max: [20, 'Preparation time cannot exceed 20 minutes']
  },
  color: {
    type: String,
    maxlength: [50, 'Color description cannot exceed 50 characters']
  },
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isSignature: {
    type: Boolean,
    default: false
  },
  isKidFriendly: {
    type: Boolean,
    default: true
  },
  isVegan: {
    type: Boolean,
    default: true
  },
  isGlutenFree: {
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
  tags: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    sugar: Number,
    carbs: Number,
    vitamin_c: Number,
    fiber: Number
  },
  healthBenefits: [String]
}, {
  timestamps: true
});

// Calculate average rating before saving
mocktailSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
mocktailSchema.index({ name: 'text', description: 'text', category: 'text' });
mocktailSchema.index({ category: 1, isAvailable: 1 });
mocktailSchema.index({ averageRating: -1 });
mocktailSchema.index({ price: 1 });
mocktailSchema.index({ isKidFriendly: 1, isVegan: 1, isGlutenFree: 1 });

module.exports = mongoose.model('Mocktail', mocktailSchema);
