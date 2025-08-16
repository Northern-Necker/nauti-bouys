const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, bartenderOnly } = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/reservations
// @desc    Get reservations with filtering and pagination
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['startTime', 'endTime', 'createdAt', 'eventTitle']).withMessage('Invalid sort field'),
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
      sortBy = 'startTime',
      sortOrder = 'asc',
      status,
      eventType,
      startDate,
      endDate,
      patronId
    } = req.query;

    // Build query based on user role
    let query = {};
    
    // If user is a patron, only show their reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
    }
    
    // If patronId is specified and user is bartender, filter by patron
    if (patronId && req.user.role === 'Bartender') {
      query.patronId = patronId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('patronId', 'fullName email mobileNumber')
        .populate('assignedStaff.user', 'fullName role')
        .populate('notes.author', 'fullName')
        .lean(),
      Reservation.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: reservations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      reservations
    });

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reservations'
    });
  }
});

// @route   GET /api/reservations/calendar
// @desc    Get reservations for calendar view
// @access  Private
router.get('/calendar', [
  auth,
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030')
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

    const { month, year } = req.query;
    
    // Calculate start and end of month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    let query = {
      startTime: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    };

    // If user is a patron, only show their reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
    }

    const reservations = await Reservation.find(query)
      .populate('patronId', 'fullName')
      .select('eventTitle startTime endTime status eventType guestCount')
      .sort({ startTime: 1 })
      .lean();

    // Group reservations by date
    const calendarData = {};
    reservations.forEach(reservation => {
      const dateKey = reservation.startTime.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(reservation);
    });

    res.json({
      success: true,
      month: parseInt(month),
      year: parseInt(year),
      totalReservations: reservations.length,
      calendarData
    });

  } catch (error) {
    console.error('Get calendar reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching calendar data'
    });
  }
});

// @route   GET /api/reservations/:id
// @desc    Get single reservation
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a patron, only allow access to their own reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
    }

    const reservation = await Reservation.findOne(query)
      .populate('patronId', 'fullName email mobileNumber')
      .populate('assignedStaff.user', 'fullName role')
      .populate('notes.author', 'fullName')
      .populate('statusHistory.changedBy', 'fullName');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      reservation
    });

  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reservation'
    });
  }
});

// @route   POST /api/reservations
// @desc    Create new reservation
// @access  Private
router.post('/', [
  auth,
  body('eventTitle').trim().isLength({ min: 1, max: 100 }).withMessage('Event title is required and must be under 100 characters'),
  body('eventType').isIn(['Birthday Party', 'Corporate Event', 'Private Party', 'Wedding Reception', 'Happy Hour', 'Live Music', 'Trivia Night', 'Other']).withMessage('Invalid event type'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('guestCount').isInt({ min: 1, max: 200 }).withMessage('Guest count must be between 1 and 200'),
  body('contactInfo.phone').matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Valid phone number is required'),
  body('contactInfo.email').isEmail().withMessage('Valid email is required')
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

    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);

    // Validate dates
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (startTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reservation cannot be in the past'
      });
    }

    // Check for conflicting reservations (basic overlap check)
    const conflictingReservation = await Reservation.findOne({
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflicts with existing reservation'
      });
    }

    const reservationData = {
      ...req.body,
      patronId: req.user.id,
      startTime,
      endTime
    };

    const reservation = new Reservation(reservationData);
    await reservation.save();

    // Add initial status history
    await reservation.changeStatus('Pending', req.user.id, 'Initial reservation created');

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservation
    });

  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating reservation'
    });
  }
});

// @route   PUT /api/reservations/:id
// @desc    Update reservation
// @access  Private
router.put('/:id', [
  auth,
  body('eventTitle').optional().trim().isLength({ min: 1, max: 100 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('guestCount').optional().isInt({ min: 1, max: 200 })
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

    let query = { _id: req.params.id };
    
    // If user is a patron, only allow updating their own reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
      // Patrons can only update pending reservations
      query.status = 'Pending';
    }

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or cannot be updated'
      });
    }

    // Validate date changes if provided
    if (req.body.startTime || req.body.endTime) {
      const newStartTime = req.body.startTime ? new Date(req.body.startTime) : reservation.startTime;
      const newEndTime = req.body.endTime ? new Date(req.body.endTime) : reservation.endTime;

      if (newStartTime >= newEndTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      if (newStartTime < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Reservation cannot be in the past'
        });
      }
    }

    // Update reservation
    Object.assign(reservation, req.body);
    await reservation.save();

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation
    });

  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating reservation'
    });
  }
});

// @route   PUT /api/reservations/:id/status
// @desc    Update reservation status (Bartender only)
// @access  Private (Bartender only)
router.put('/:id/status', [
  bartenderOnly,
  body('status').isIn(['Pending', 'Approved', 'Denied', 'Cancelled', 'Completed']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 300 }).withMessage('Reason must be under 300 characters')
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

    const { status, reason = '' } = req.body;
    
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    await reservation.changeStatus(status, req.user.id, reason);

    res.json({
      success: true,
      message: 'Reservation status updated successfully',
      reservation: {
        id: reservation._id,
        status: reservation.status,
        eventTitle: reservation.eventTitle
      }
    });

  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating reservation status'
    });
  }
});

// @route   POST /api/reservations/:id/notes
// @desc    Add note to reservation
// @access  Private
router.post('/:id/notes', [
  auth,
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Note content is required and must be under 500 characters'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
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

    const { content, isInternal = false } = req.body;
    
    let query = { _id: req.params.id };
    
    // If user is a patron, only allow access to their own reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
    }

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Only bartenders can add internal notes
    const noteIsInternal = req.user.role === 'Bartender' ? isInternal : false;

    await reservation.addNote(content, req.user.id, noteIsInternal);

    res.json({
      success: true,
      message: 'Note added successfully'
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding note'
    });
  }
});

// @route   POST /api/reservations/:id/assign-staff
// @desc    Assign staff to reservation (Bartender only)
// @access  Private (Bartender only)
router.post('/:id/assign-staff', [
  bartenderOnly,
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['Bartender', 'Server', 'Manager', 'Security', 'DJ', 'Coordinator']).withMessage('Invalid staff role')
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

    const { userId, role } = req.body;
    
    // Verify user exists and has appropriate role
    const user = await User.findById(userId);
    if (!user || user.role !== 'Bartender') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or user is not a bartender'
      });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    await reservation.assignStaff(userId, role);

    res.json({
      success: true,
      message: 'Staff assigned successfully'
    });

  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning staff'
    });
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Cancel/Delete reservation
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a patron, only allow canceling their own pending reservations
    if (req.user.role === 'Patron') {
      query.patronId = req.user.id;
      query.status = { $in: ['Pending'] };
    }

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or cannot be cancelled'
      });
    }

    if (req.user.role === 'Bartender') {
      // Bartenders can delete reservations
      await Reservation.findByIdAndDelete(req.params.id);
    } else {
      // Patrons can only cancel (change status)
      await reservation.changeStatus('Cancelled', req.user.id, 'Cancelled by patron');
    }

    res.json({
      success: true,
      message: req.user.role === 'Bartender' ? 'Reservation deleted successfully' : 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Delete/cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing request'
    });
  }
});

module.exports = router;
