const mongoose = require('mongoose');

const otherNonAlcoholicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['Soda', 'Juice', 'Water', 'Coffee', 'Tea', 'Energy Drink', 'Sports Drink', 'Kombucha', 'Smoothie', 'Milkshake', 'Hot Chocolate', 'Other'],
    required: [true, 'Category is required']
  },
  brand: {
    type: String,
    maxlength: [100, 'Brand cannot exceed 100 characters']
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
  glassType: {
    type: String,
    enum: ['Rocks', 'Highball', 'Martini', 'Coupe', 'Hurricane', 'Wine', 'Mason Jar', 'Specialty'],
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
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: true
  },
  isGlutenFree: {
    type: Boolean,
    default: true
  },
  isSugarFree: {
    type: Boolean,
    default: false
  },
  isCaffeinated: {
    type: Boolean,
    default: false
  },
  isLocal: {
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
    carbs: Number,
    protein: Number,
    fat: Number,
    sodium: Number,
    caffeine: Number,
    vitamins: [String]
  },
  healthBenefits: [String],
  origin: {
    country: String,
    region: String
  }
}, {
  timestamps: true
});

// Calculate average rating before saving
otherNonAlcoholicSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
otherNonAlcoholicSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });
otherNonAlcoholicSchema.index({ category: 1, isAvailable: 1 });
otherNonAlcoholicSchema.index({ averageRating: -1 });
otherNonAlcoholicSchema.index({ price: 1 });
otherNonAlcoholicSchema.index({ isOrganic: 1, isVegan: 1, isGlutenFree: 1, isSugarFree: 1 });

module.exports = mongoose.model('OtherNonAlcoholic', otherNonAlcoholicSchema);
