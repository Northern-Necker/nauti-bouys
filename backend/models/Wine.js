const mongoose = require('mongoose');

const wineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wine name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  winery: {
    type: String,
    required: [true, 'Winery is required'],
    trim: true,
    maxlength: [100, 'Winery cannot exceed 100 characters']
  },
  vintage: {
    type: Number,
    required: [true, 'Vintage year is required'],
    min: [1800, 'Vintage year must be after 1800'],
    max: [new Date().getFullYear(), 'Vintage year cannot be in the future']
  },
  type: {
    type: String,
    enum: ['Red', 'White', 'Rose', 'Sparkling', 'Dessert', 'Fortified', 'Other'],
    required: [true, 'Wine type is required']
  },
  domORintl: {
    type: String,
    enum: ['Domestic', 'International'],
    required: [true, 'Domestic or International classification is required']
  },
  varietal: {
    type: String,
    required: [true, 'Varietal is required'],
    maxlength: [100, 'Varietal cannot exceed 100 characters']
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    maxlength: [100, 'Region cannot exceed 100 characters']
  },
  body: {
    type: String,
    enum: ['Light', 'Medium', 'Full'],
    required: [true, 'Body is required']
  },
  vineyard: {
    type: String,
    required: [true, 'Vineyard is required'],
    maxlength: [100, 'Vineyard cannot exceed 100 characters']
  },
  brand: {
    type: String,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  wsRank: {
    type: Number,
    min: [50, 'Wine Spectator rank must be between 50-100'],
    max: [100, 'Wine Spectator rank must be between 50-100']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  pricePerGlass: {
    type: Number,
    min: [0, 'Price per glass cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  abv: {
    type: Number,
    required: [true, 'ABV is required'],
    min: [0, 'ABV cannot be negative'],
    max: [50, 'ABV cannot exceed 50%']
  },
  bottleSize: {
    type: String,
    enum: ['187ml', '375ml', '750ml', '1.5L', '3L', '6L'],
    default: '750ml'
  },
  tastingNotes: [{
    type: String,
    trim: true
  }],
  servingTemp: {
    type: String,
    enum: ['Chilled', 'Room Temperature', 'Hot', 'Frozen'],
    default: 'Chilled'
  },
  ice: {
    type: String,
    enum: ['None', 'Cube', 'Pellet', 'Clear', 'Shaved'],
    default: 'None'
  },
  foodPairing: {
    type: String,
    maxlength: [200, 'Food pairing cannot exceed 200 characters']
  },
  wsURL: {
    type: String,
    maxlength: [500, 'Wine Spectator URL cannot exceed 500 characters']
  },
  winemaker: String,
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isReserve: {
    type: Boolean,
    default: false
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isBiodynamic: {
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
  awards: [String],
  criticsScore: {
    score: Number,
    critic: String,
    scale: String
  }
}, {
  timestamps: true
});

// Calculate price per glass and average rating
wineSchema.pre('save', function(next) {
  // Calculate price per glass (assuming 5 glasses per bottle)
  if (this.price) {
    this.pricePerGlass = Math.round((this.price / 5) * 100) / 100;
  }
  
  // Calculate average rating
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
wineSchema.index({ name: 'text', winery: 'text', varietal: 'text', region: 'text' });
wineSchema.index({ type: 1, isAvailable: 1 });
wineSchema.index({ averageRating: -1 });
wineSchema.index({ price: 1 });
wineSchema.index({ vintage: -1 });

module.exports = mongoose.model('Wine', wineSchema);
