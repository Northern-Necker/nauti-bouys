const mongoose = require('mongoose');

const beerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Beer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  brewery: {
    type: String,
    required: [true, 'Brewery is required'],
    trim: true,
    maxlength: [100, 'Brewery cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['Ale', 'Lager', 'Specialty', 'Light', 'Non-Alcoholic', 'Seasonal', 'Other'],
    required: [true, 'Beer type is required']
  },
  serveType: {
    type: String,
    enum: ['Can', 'Bottle', 'On Tap'],
    required: [true, 'Serving type is required']
  },
  abv: {
    type: Number,
    required: [true, 'ABV is required'],
    min: [0, 'ABV cannot be negative'],
    max: [20, 'ABV cannot exceed 20%']
  },
  ibu: {
    type: Number,
    min: [0, 'IBU cannot be negative'],
    max: [120, 'IBU cannot exceed 120']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  origin: {
    city: String,
    state: String,
    country: {
      type: String,
      required: true
    }
  },
  color: {
    type: String,
    required: [true, 'Color is required']
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
  isSeasonal: {
    type: Boolean,
    default: false
  },
  isLimitedEdition: {
    type: Boolean,
    default: false
  },
  isCraft: {
    type: Boolean,
    default: true
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
  awards: [String],
  brewmaster: String,
  yearEstablished: Number,
  beerAdvocateScore: Number,
  untappdScore: Number
}, {
  timestamps: true
});

// Calculate average rating
beerSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  next();
});

// Index for search functionality
beerSchema.index({ name: 'text', brewery: 'text', style: 'text', description: 'text' });
beerSchema.index({ style: 1, isAvailable: 1 });
beerSchema.index({ averageRating: -1 });
beerSchema.index({ price: 1 });
beerSchema.index({ abv: 1 });
beerSchema.index({ ibu: 1 });

module.exports = mongoose.model('Beer', beerSchema);
