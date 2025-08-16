const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  itemType: {
    type: String,
    enum: ['Cocktail', 'Spirit', 'Wine', 'Beer', 'Mocktail', 'OtherNonAlcoholic', 'Ingredient', 'Garnish', 'Equipment'],
    required: [true, 'Item type is required']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: function() {
      return ['Cocktail', 'Spirit', 'Wine', 'Beer', 'Mocktail', 'OtherNonAlcoholic'].includes(this.itemType);
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['bottles', 'cans', 'kegs', 'liters', 'gallons', 'oz', 'ml', 'pieces', 'servings', 'shots'],
    required: [true, 'Unit is required']
  },
  minimumStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative']
  },
  maximumStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  reorderPoint: {
    type: Number,
    min: [0, 'Reorder point cannot be negative']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isLowStock: {
    type: Boolean,
    default: false
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  supplier: {
    name: {
      type: String,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    contact: {
      type: String,
      maxlength: [100, 'Supplier contact cannot exceed 100 characters']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    }
  },
  cost: {
    unitCost: {
      type: Number,
      min: [0, 'Unit cost cannot be negative']
    },
    totalCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative']
    }
  },
  location: {
    section: {
      type: String,
      enum: ['Bar', 'Storage', 'Cooler', 'Freezer', 'Wine Cellar', 'Dry Storage', 'Office'],
      default: 'Bar'
    },
    shelf: String,
    position: String
  },
  expirationDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastRestocked: {
    type: Date
  },
  stockMovements: [{
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters']
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Update stock status before saving
inventorySchema.pre('save', function(next) {
  // Update availability and stock status
  this.isOutOfStock = this.quantity === 0;
  this.isLowStock = this.quantity > 0 && this.quantity <= this.minimumStock;
  this.isAvailable = this.quantity > 0;
  
  // Calculate total cost
  if (this.cost.unitCost) {
    this.cost.totalCost = this.cost.unitCost * this.quantity;
  }
  
  // Update last updated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Method to add stock movement
inventorySchema.methods.addStockMovement = function(type, quantity, reason, userId, notes = '') {
  this.stockMovements.push({
    type,
    quantity,
    reason,
    user: userId,
    notes
  });
  
  // Update quantity based on movement type
  if (type === 'IN') {
    this.quantity += Math.abs(quantity);
    if (type === 'IN' && this.quantity > 0) {
      this.lastRestocked = new Date();
    }
  } else if (['OUT', 'WASTE'].includes(type)) {
    this.quantity = Math.max(0, this.quantity - Math.abs(quantity));
  } else if (type === 'ADJUSTMENT') {
    this.quantity = Math.max(0, quantity);
  }
  
  return this.save();
};

// Method to create alerts
inventorySchema.methods.checkAndCreateAlerts = function() {
  const alerts = [];
  
  if (this.quantity === 0) {
    alerts.push({
      type: 'OUT_OF_STOCK',
      message: `${this.itemName} is out of stock`
    });
  } else if (this.quantity <= this.minimumStock) {
    alerts.push({
      type: 'LOW_STOCK',
      message: `${this.itemName} is running low (${this.quantity} ${this.unit} remaining)`
    });
  }
  
  if (this.expirationDate) {
    const daysUntilExpiration = Math.ceil((this.expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration <= 0) {
      alerts.push({
        type: 'EXPIRED',
        message: `${this.itemName} has expired`
      });
    } else if (daysUntilExpiration <= 7) {
      alerts.push({
        type: 'EXPIRING_SOON',
        message: `${this.itemName} expires in ${daysUntilExpiration} days`
      });
    }
  }
  
  // Add new alerts
  alerts.forEach(alert => {
    const existingAlert = this.alerts.find(a => a.type === alert.type && a.isActive);
    if (!existingAlert) {
      this.alerts.push(alert);
    }
  });
  
  return this.save();
};

// Index for search and filtering
inventorySchema.index({ itemName: 'text', itemType: 'text' });
inventorySchema.index({ itemType: 1, isAvailable: 1 });
inventorySchema.index({ isLowStock: 1, isOutOfStock: 1 });
inventorySchema.index({ 'location.section': 1 });
inventorySchema.index({ expirationDate: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
