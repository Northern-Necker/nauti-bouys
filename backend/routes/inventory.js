const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, bartenderOnly } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory items with filtering and pagination
// @access  Private (Bartender only)
router.get('/', [
  bartenderOnly,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['itemName', 'quantity', 'lastUpdated', 'expirationDate']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      sortBy = 'itemName',
      sortOrder = 'asc',
      search,
      itemType,
      location,
      isLowStock,
      isOutOfStock,
      isAvailable
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (itemType) {
      query.itemType = itemType;
    }
    
    if (location) {
      query['location.section'] = location;
    }
    
    if (isLowStock === 'true') {
      query.isLowStock = true;
    }
    
    if (isOutOfStock === 'true') {
      query.isOutOfStock = true;
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Inventory.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('itemId')
        .populate('stockMovements.user', 'fullName')
        .lean(),
      Inventory.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      items
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching inventory'
    });
  }
});

// @route   GET /api/inventory/alerts
// @desc    Get active inventory alerts
// @access  Private (Bartender only)
router.get('/alerts', bartenderOnly, async (req, res) => {
  try {
    const items = await Inventory.find({
      'alerts.isActive': true
    })
    .populate('itemId')
    .select('itemName itemType alerts location quantity unit')
    .lean();

    // Flatten alerts and add item info
    const alerts = [];
    items.forEach(item => {
      item.alerts.forEach(alert => {
        if (alert.isActive) {
          alerts.push({
            ...alert,
            itemId: item._id,
            itemName: item.itemName,
            itemType: item.itemType,
            location: item.location,
            quantity: item.quantity,
            unit: item.unit
          });
        }
      });
    });

    // Sort by creation date (newest first)
    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching alerts'
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private (Bartender only)
router.get('/low-stock', bartenderOnly, async (req, res) => {
  try {
    const items = await Inventory.find({
      $or: [
        { isLowStock: true },
        { isOutOfStock: true }
      ]
    })
    .populate('itemId')
    .sort({ quantity: 1, itemName: 1 })
    .lean();

    res.json({
      success: true,
      count: items.length,
      items
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching low stock items'
    });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private (Bartender only)
router.get('/:id', bartenderOnly, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('itemId')
      .populate('stockMovements.user', 'fullName')
      .populate('alerts.acknowledgedBy', 'fullName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching inventory item'
    });
  }
});

// @route   POST /api/inventory
// @desc    Create new inventory item
// @access  Private (Bartender only)
router.post('/', [
  bartenderOnly,
  body('itemName').trim().isLength({ min: 1, max: 100 }).withMessage('Item name is required and must be under 100 characters'),
  body('itemType').isIn(['Cocktail', 'Spirit', 'Wine', 'Beer', 'Mocktail', 'OtherNonAlcoholic', 'Ingredient', 'Garnish', 'Equipment']).withMessage('Invalid item type'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('unit').isIn(['bottles', 'cans', 'kegs', 'liters', 'gallons', 'oz', 'ml', 'pieces', 'servings', 'shots']).withMessage('Invalid unit'),
  body('minimumStock').isFloat({ min: 0 }).withMessage('Minimum stock must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if item already exists
    const existingItem = await Inventory.findOne({ 
      itemName: req.body.itemName,
      itemType: req.body.itemType 
    });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item with this name and type already exists'
      });
    }

    const item = new Inventory(req.body);
    
    // Add initial stock movement
    if (req.body.quantity > 0) {
      item.stockMovements.push({
        type: 'IN',
        quantity: req.body.quantity,
        reason: 'Initial stock',
        user: req.user.id,
        notes: 'Initial inventory creation'
      });
      item.lastRestocked = new Date();
    }

    await item.save();
    await item.checkAndCreateAlerts();

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      item
    });

  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating inventory item'
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Bartender only)
router.put('/:id', [
  bartenderOnly,
  body('itemName').optional().trim().isLength({ min: 1, max: 100 }),
  body('quantity').optional().isFloat({ min: 0 }),
  body('minimumStock').optional().isFloat({ min: 0 }),
  body('maximumStock').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await item.checkAndCreateAlerts();

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      item
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating inventory item'
    });
  }
});

// @route   POST /api/inventory/:id/stock-movement
// @desc    Add stock movement (in, out, adjustment, waste)
// @access  Private (Bartender only)
router.post('/:id/stock-movement', [
  bartenderOnly,
  body('type').isIn(['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER']).withMessage('Invalid movement type'),
  body('quantity').isFloat().withMessage('Quantity must be a number'),
  body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('Reason is required and must be under 200 characters'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes must be under 300 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, quantity, reason, notes = '' } = req.body;
    
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Validate quantity for OUT and WASTE operations
    if (['OUT', 'WASTE'].includes(type) && Math.abs(quantity) > item.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove more items than available in stock'
      });
    }

    await item.addStockMovement(type, quantity, reason, req.user.id, notes);
    await item.checkAndCreateAlerts();

    res.json({
      success: true,
      message: 'Stock movement recorded successfully',
      item: {
        id: item._id,
        itemName: item.itemName,
        quantity: item.quantity,
        isLowStock: item.isLowStock,
        isOutOfStock: item.isOutOfStock
      }
    });

  } catch (error) {
    console.error('Stock movement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording stock movement'
    });
  }
});

// @route   POST /api/inventory/:id/acknowledge-alert
// @desc    Acknowledge an inventory alert
// @access  Private (Bartender only)
router.post('/:id/acknowledge-alert', [
  bartenderOnly,
  body('alertId').isMongoId().withMessage('Valid alert ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { alertId } = req.body;
    
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const alert = item.alerts.id(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.isActive = false;
    alert.acknowledgedBy = req.user.id;
    alert.acknowledgedAt = new Date();

    await item.save();

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error acknowledging alert'
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Bartender only)
router.delete('/:id', bartenderOnly, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });

  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting inventory item'
    });
  }
});

// @route   GET /api/inventory/reports/summary
// @desc    Get inventory summary report
// @access  Private (Bartender only)
router.get('/reports/summary', bartenderOnly, async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
      totalValue
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ isLowStock: true }),
      Inventory.countDocuments({ isOutOfStock: true }),
      Inventory.countDocuments({
        expirationDate: {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      }),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ['$quantity', '$cost.unitCost'] }
            }
          }
        }
      ])
    ]);

    const summary = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
      totalValue: totalValue[0]?.totalValue || 0,
      stockHealth: {
        healthy: totalItems - lowStockItems - outOfStockItems,
        needsAttention: lowStockItems,
        critical: outOfStockItems
      }
    };

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating inventory summary'
    });
  }
});

module.exports = router;
