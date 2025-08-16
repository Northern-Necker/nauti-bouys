const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, bartenderOnly } = require('../middleware/auth');

// Import all beverage models
const Cocktail = require('../models/Cocktail');
const Spirit = require('../models/Spirit');
const Wine = require('../models/Wine');
const Beer = require('../models/Beer');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Model mapping for dynamic route handling
const beverageModels = {
  cocktails: Cocktail,
  spirits: Spirit,
  wines: Wine,
  beers: Beer,
  mocktails: Mocktail,
  'non-alcoholic': OtherNonAlcoholic
};

// @route   GET /api/beverages/available
// @desc    Get all available beverages (checks inventory)
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let availableBeverages = [];

    // Get available items from each category
    for (const [categoryName, Model] of Object.entries(beverageModels)) {
      if (category && category !== categoryName) continue;

      const items = await Model.find({ isAvailable: true })
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ averageRating: -1, name: 1 })
        .lean();

      // Add category info to each item
      const itemsWithCategory = items.map(item => ({
        ...item,
        category: categoryName,
        type: categoryName.slice(0, -1) // Remove 's' from plural
      }));

      availableBeverages = availableBeverages.concat(itemsWithCategory);
    }

    // Sort by rating and limit results
    availableBeverages.sort((a, b) => b.averageRating - a.averageRating);
    if (!category) {
      availableBeverages = availableBeverages.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: availableBeverages.length,
      beverages: availableBeverages
    });

  } catch (error) {
    console.error('Get available beverages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available beverages'
    });
  }
});

// @route   GET /api/beverages/:category
// @desc    Get beverages by category with filtering and pagination
// @access  Public
router.get('/:category', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['name', 'price', 'rating', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5')
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

    const { category } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      search,
      minPrice,
      maxPrice,
      minRating,
      isAvailable,
      tags
    } = req.query;

    const Model = beverageModels[category];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    // Build query
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'rating') {
      sort.averageRating = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [beverages, total] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('ratings.user', 'fullName')
        .lean(),
      Model.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: beverages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      beverages
    });

  } catch (error) {
    console.error('Get beverages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching beverages'
    });
  }
});

// @route   GET /api/beverages/:category/:id
// @desc    Get single beverage by ID
// @access  Public
router.get('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    
    const Model = beverageModels[category];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    const beverage = await Model.findById(id)
      .populate('ratings.user', 'fullName')
      .populate('favorites', 'fullName');

    if (!beverage) {
      return res.status(404).json({
        success: false,
        message: 'Beverage not found'
      });
    }

    res.json({
      success: true,
      beverage
    });

  } catch (error) {
    console.error('Get beverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching beverage'
    });
  }
});

// @route   POST /api/beverages/:category
// @desc    Create new beverage
// @access  Private (Bartender only)
router.post('/:category', [
  bartenderOnly,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be under 100 characters'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be under 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
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

    const { category } = req.params;
    const Model = beverageModels[category];
    
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    // Check if beverage with same name already exists
    const existingBeverage = await Model.findOne({ name: req.body.name });
    if (existingBeverage) {
      return res.status(400).json({
        success: false,
        message: 'A beverage with this name already exists'
      });
    }

    const beverage = new Model(req.body);
    await beverage.save();

    res.status(201).json({
      success: true,
      message: 'Beverage created successfully',
      beverage
    });

  } catch (error) {
    console.error('Create beverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating beverage'
    });
  }
});

// @route   PUT /api/beverages/:category/:id
// @desc    Update beverage
// @access  Private (Bartender only)
router.put('/:category/:id', [
  bartenderOnly,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ min: 1, max: 500 }),
  body('price').optional().isFloat({ min: 0 })
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

    const { category, id } = req.params;
    const Model = beverageModels[category];
    
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    const beverage = await Model.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!beverage) {
      return res.status(404).json({
        success: false,
        message: 'Beverage not found'
      });
    }

    res.json({
      success: true,
      message: 'Beverage updated successfully',
      beverage
    });

  } catch (error) {
    console.error('Update beverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating beverage'
    });
  }
});

// @route   DELETE /api/beverages/:category/:id
// @desc    Delete beverage
// @access  Private (Bartender only)
router.delete('/:category/:id', bartenderOnly, async (req, res) => {
  try {
    const { category, id } = req.params;
    const Model = beverageModels[category];
    
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    const beverage = await Model.findByIdAndDelete(id);
    
    if (!beverage) {
      return res.status(404).json({
        success: false,
        message: 'Beverage not found'
      });
    }

    res.json({
      success: true,
      message: 'Beverage deleted successfully'
    });

  } catch (error) {
    console.error('Delete beverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting beverage'
    });
  }
});

// @route   POST /api/beverages/:category/:id/rate
// @desc    Rate a beverage
// @access  Private
router.post('/:category/:id/rate', [
  auth,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 300 }).withMessage('Review must be under 300 characters')
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

    const { category, id } = req.params;
    const { rating, review } = req.body;
    
    const Model = beverageModels[category];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    const beverage = await Model.findById(id);
    if (!beverage) {
      return res.status(404).json({
        success: false,
        message: 'Beverage not found'
      });
    }

    // Check if user already rated this beverage
    const existingRatingIndex = beverage.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      beverage.ratings[existingRatingIndex].rating = rating;
      beverage.ratings[existingRatingIndex].review = review || '';
      beverage.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      beverage.ratings.push({
        user: req.user.id,
        rating,
        review: review || ''
      });
    }

    await beverage.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      averageRating: beverage.averageRating,
      totalRatings: beverage.totalRatings
    });

  } catch (error) {
    console.error('Rate beverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting rating'
    });
  }
});

// @route   POST /api/beverages/:category/:id/favorite
// @desc    Toggle favorite status for a beverage
// @access  Private
router.post('/:category/:id/favorite', auth, async (req, res) => {
  try {
    const { category, id } = req.params;
    
    const Model = beverageModels[category];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid beverage category'
      });
    }

    const beverage = await Model.findById(id);
    if (!beverage) {
      return res.status(404).json({
        success: false,
        message: 'Beverage not found'
      });
    }

    const userIndex = beverage.favorites.indexOf(req.user.id);
    let isFavorited;

    if (userIndex > -1) {
      // Remove from favorites
      beverage.favorites.splice(userIndex, 1);
      isFavorited = false;
    } else {
      // Add to favorites
      beverage.favorites.push(req.user.id);
      isFavorited = true;
    }

    await beverage.save();

    res.json({
      success: true,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites',
      isFavorited,
      favoritesCount: beverage.favorites.length
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling favorite'
    });
  }
});

// @route   GET /api/beverages/search/global
// @desc    Global search across all beverage categories
// @access  Public
router.get('/search/global', [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { q: searchQuery, limit = 20 } = req.query;
    const results = [];

    // Search across all beverage categories
    for (const [categoryName, Model] of Object.entries(beverageModels)) {
      const beverages = await Model.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.ceil(limit / Object.keys(beverageModels).length))
      .lean();

      // Add category info to results
      const beveragesWithCategory = beverages.map(beverage => ({
        ...beverage,
        category: categoryName,
        type: categoryName.slice(0, -1)
      }));

      results.push(...beveragesWithCategory);
    }

    // Sort by text score and limit results
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    const limitedResults = results.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: limitedResults.length,
      query: searchQuery,
      results: limitedResults
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing search'
    });
  }
});

module.exports = router;
