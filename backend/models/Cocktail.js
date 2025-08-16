const mongoose = require('mongoose');

const cocktailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cocktail name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  specialty: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
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
      enum: ['oz', 'ml', 'dash', 'splash', 'drop', 'piece', 'slice', 'wedge', 'sprig'],
      required: true
    }
  }],
  glassType: {
    type: String,
    enum: ['Rocks', 'Highball', 'Martini', 'Coupe', 'Hurricane', 'Shot', 'Wine', 'Beer', 'Specialty'],
    required: true
  },
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
  primarySpirit: {
    type: String,
    required: [true, 'Primary spirit is required'],
    enum: ['Vodka', 'Gin', 'Rum', 'Tequila', 'Whiskey', 'Brandy', 'Absinthe', 'Mezcal', 'Liqueur', 'Rice Wine', 'Other']
  },
  image: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['Classic', 'Modern', 'Tropical', 'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Signature'],
    required: [true, 'Category is required']
  },
  garnish: {
    type: String,
    maxlength: [100, 'Garnish description cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  preparationTime: {
    type: Number, // in minutes
    min: [1, 'Preparation time must be at least 1 minute'],
    max: [30, 'Preparation time cannot exceed 30 minutes']
  },
  alcoholContent: {
    type: Number, // ABV percentage
    min: [0, 'Alcohol content cannot be negative'],
    max: [100, 'Alcohol content cannot exceed 100%']
  },
  isSignature: {
    type: Boolean,
    default: false
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
    carbs: Number
  }
}, {
  timestamps: true
});

// Calculate average rating before saving
cocktailSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
cocktailSchema.index({ name: 'text', description: 'text', category: 'text' });
cocktailSchema.index({ category: 1, isAvailable: 1 });
cocktailSchema.index({ averageRating: -1 });
cocktailSchema.index({ price: 1 });

module.exports = mongoose.model('Cocktail', cocktailSchema);
