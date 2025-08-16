const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  patronId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patron ID is required']
  },
  eventTitle: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Event title cannot exceed 100 characters']
  },
  eventDescription: {
    type: String,
    maxlength: [500, 'Event description cannot exceed 500 characters']
  },
  eventType: {
    type: String,
    enum: ['Birthday Party', 'Corporate Event', 'Private Party', 'Wedding Reception', 'Happy Hour', 'Live Music', 'Trivia Night', 'Other'],
    required: [true, 'Event type is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in hours
    min: [0.5, 'Duration must be at least 30 minutes'],
    max: [12, 'Duration cannot exceed 12 hours']
  },
  guestCount: {
    type: Number,
    required: [true, 'Guest count is required'],
    min: [1, 'Guest count must be at least 1'],
    max: [200, 'Guest count cannot exceed 200']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Denied', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  seatingPreference: {
    type: String,
    enum: ['Bar', 'Table', 'Booth', 'Private Room', 'Outdoor', 'No Preference'],
    default: 'No Preference'
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  dietaryRestrictions: [String],
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    alternateContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      min: [0, 'Base price cannot be negative']
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalPrice: {
      type: Number,
      min: [0, 'Total price cannot be negative']
    },
    deposit: {
      amount: {
        type: Number,
        min: [0, 'Deposit amount cannot be negative']
      },
      paid: {
        type: Boolean,
        default: false
      },
      paidAt: Date,
      paymentMethod: {
        type: String,
        enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check']
      }
    }
  },
  assignedStaff: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Bartender', 'Server', 'Manager', 'Security', 'DJ', 'Coordinator']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  equipment: [{
    item: String,
    quantity: Number,
    notes: String
  }],
  menu: {
    beverages: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'menu.beverages.itemType'
      },
      itemType: {
        type: String,
        enum: ['Cocktail', 'Spirit', 'Wine', 'Beer', 'Mocktail', 'OtherNonAlcoholic']
      },
      quantity: Number,
      specialInstructions: String
    }],
    food: [{
      name: String,
      description: String,
      quantity: Number,
      price: Number
    }]
  },
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Note content cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Denied', 'Cancelled', 'Completed'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['Email', 'SMS', 'Phone Call'],
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    message: String
  }]
}, {
  timestamps: true
});

// Calculate duration before saving
reservationSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = (this.endTime - this.startTime) / (1000 * 60 * 60); // Convert to hours
  }
  
  // Calculate total price
  if (this.pricing.basePrice) {
    let total = this.pricing.basePrice;
    if (this.pricing.additionalCharges && this.pricing.additionalCharges.length > 0) {
      total += this.pricing.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    }
    this.pricing.totalPrice = total;
  }
  
  next();
});

// Method to add status change
reservationSchema.methods.changeStatus = function(newStatus, userId, reason = '') {
  this.statusHistory.push({
    status: this.status,
    changedBy: userId,
    reason: `Changed from ${this.status} to ${newStatus}. ${reason}`.trim()
  });
  
  this.status = newStatus;
  return this.save();
};

// Method to add note
reservationSchema.methods.addNote = function(content, authorId, isInternal = false) {
  this.notes.push({
    content,
    author: authorId,
    isInternal
  });
  
  return this.save();
};

// Method to assign staff
reservationSchema.methods.assignStaff = function(userId, role) {
  // Remove existing assignment for this user
  this.assignedStaff = this.assignedStaff.filter(staff => !staff.user.equals(userId));
  
  // Add new assignment
  this.assignedStaff.push({
    user: userId,
    role
  });
  
  return this.save();
};

// Validation for date logic
reservationSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Index for search and filtering
reservationSchema.index({ patronId: 1, startTime: 1 });
reservationSchema.index({ status: 1, startTime: 1 });
reservationSchema.index({ eventType: 1, startTime: 1 });
reservationSchema.index({ startTime: 1, endTime: 1 });
reservationSchema.index({ 'contactInfo.email': 1 });
reservationSchema.index({ 'contactInfo.phone': 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
