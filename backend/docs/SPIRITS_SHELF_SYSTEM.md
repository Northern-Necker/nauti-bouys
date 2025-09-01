# Spirits Shelf System Implementation

## Overview

The Spirits Shelf System replaces the previous pricing-based model with a tier-based authorization system for premium spirits access.

## System Components

### 1. Database Schema Changes

#### Spirit Model Updates
- **Removed Fields**: `price`, `pricePerOz`, `isPremium`, `isTopShelf`
- **Added Fields**:
  - `shelf_tier`: String enum (`'lower'`, `'top'`, `'ultra'`) - Required, defaults to `'lower'`
  - `mixing_appropriate`: Boolean - Required, defaults to `true`

#### Authorization Model
- **SpiritAuthorization**: Tracks individual spirit access approvals
  - `sessionId`: Patron session identifier
  - `spiritId`: Reference to specific spirit
  - `patronName`: Name of requesting patron
  - `status`: `'pending'`, `'approved'`, `'denied'`
  - `requestedAt`, `authorizedAt`, `expiresAt`: Timestamps
  - `notes`: Optional owner notes

### 2. API Endpoints

#### Spirits Routes (`/api/spirits`)

##### GET `/by-shelf/:tier`
- Get spirits by shelf tier (`lower`, `top`, `ultra`)
- Query parameters: `mixing_appropriate`, `type`, `limit`
- Returns: Filtered spirits list

##### POST `/request-ultra`
- Request authorization for ultra shelf spirit
- Body: `{ spiritId, patronName, sessionId }`
- Creates pending authorization request
- Triggers owner notification

##### POST `/authorize-ultra` (Owner only)
- Approve/deny ultra shelf requests
- Body: `{ requestId, approved, notes }`
- Updates authorization status

##### GET `/authorizations`
- Get current authorizations for session
- Query: `sessionId`
- Returns: Active authorizations list

##### GET `/check-authorization/:sessionId/:spiritId`
- Check if session is authorized for specific spirit
- Returns: `{ authorized: boolean }`

##### GET `/pending-requests` (Owner only)
- Get pending authorization requests
- Returns: List of requests awaiting approval

#### Owner Notifications (`/api/owner-notifications`)

##### GET `/`
- Get owner notifications
- Query: `limit`, `unreadOnly`
- Returns: Notification list with unread count

##### POST `/mark-read/:id`
- Mark specific notification as read

##### POST `/mark-all-read`
- Mark all notifications as read

##### GET `/pending-requests`
- Get formatted pending requests for owner dashboard

##### GET `/sse`
- Server-Sent Events for real-time notifications

### 3. Authorization Service

#### `spiritsAuthService.js`

##### Key Methods:
- `isAuthorizedForSpirit(sessionId, spiritId)` - Check authorization
- `requestUltraShelfAuthorization(sessionId, spiritId, patronName)` - Request access
- `authorizeUltraShelfRequest(requestId, approved, notes)` - Process request
- `getSessionAuthorizations(sessionId)` - Get active authorizations
- `getPendingRequests()` - Get requests awaiting approval
- `cleanupExpiredAuthorizations()` - Remove expired records

### 4. Notification System

#### Features:
- Real-time owner notifications for ultra shelf requests
- In-memory notification storage (Redis recommended for production)
- Server-Sent Events for live updates
- Notification read/unread tracking

## Usage Examples

### 1. Patron Requests Ultra Shelf Spirit

```javascript
// Frontend request
const response = await fetch('/api/spirits/request-ultra', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    spiritId: 'spirit_id_here',
    patronName: 'John Doe',
    sessionId: 'session_123'
  })
});
```

### 2. Check Authorization Before Serving

```javascript
// Check if patron is authorized
const authCheck = await fetch(`/api/spirits/check-authorization/${sessionId}/${spiritId}`);
const { authorized } = await authCheck.json();

if (!authorized && spirit.shelf_tier === 'ultra') {
  // Redirect to authorization request
  return suggestTopShelfAlternatives();
}
```

### 3. Owner Approves Request

```javascript
// Owner approves ultra shelf request
const approval = await fetch('/api/spirits/authorize-ultra', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ownerToken}`
  },
  body: JSON.stringify({
    requestId: 'request_id_here',
    approved: true,
    notes: 'Approved for special occasion'
  })
});
```

## AI Integration Guidelines

### Bartender AI Logic:

1. **Check Shelf Tier**: Always verify spirit shelf tier before recommendations
2. **Authorization Check**: For ultra shelf spirits, check patron authorization
3. **Alternative Suggestions**: If ultra not authorized, suggest top shelf alternatives
4. **Mixing Appropriateness**: Respect `mixing_appropriate` flag for cocktail recommendations

```javascript
// Example AI logic
async function recommendSpirit(patronSession, cocktailType) {
  if (cocktailType === 'neat' || cocktailType === 'on_rocks') {
    // Can recommend any authorized tier
    const ultraSpirits = await getAuthorizedUltraShelf(patronSession);
    return ultraSpirits.length > 0 ? ultraSpirits : getTopShelfSpirits();
  } else {
    // For cocktails, only recommend mixing appropriate spirits
    return getSpirits({ mixing_appropriate: true, shelf_tier: ['lower', 'top'] });
  }
}
```

## Security Considerations

1. **Session Management**: Secure session ID generation and validation
2. **Authorization Expiry**: 2-hour default expiration for ultra shelf access
3. **Owner Authentication**: Proper role-based access control for approval endpoints
4. **Rate Limiting**: Prevent abuse of authorization requests

## Production Recommendations

1. **Database**: Use Redis for authorization session storage
2. **Notifications**: Implement WebSocket or push notifications
3. **Monitoring**: Track authorization patterns and usage statistics
4. **Backup**: Regular backup of authorization data
5. **Cleanup**: Automated cleanup of expired authorizations

## Migration Script

Run the shelf tier migration script:

```bash
cd backend
node scripts/updateSpiritsShelfTiers.js
```

This script:
- Removes old pricing fields
- Assigns appropriate shelf tiers based on spirit characteristics
- Sets mixing appropriateness based on premium status and age
- Updates database indexes

## Testing

Comprehensive test suite available in:
- `/backend/tests/spiritsShelfSystem.test.js`

Run tests:
```bash
npm test -- spiritsShelfSystem.test.js
```

## Error Handling

Common error scenarios:
- Invalid shelf tier requests
- Expired authorizations
- Missing patron information
- Unauthorized owner actions
- Database connection issues

All endpoints return standardized error responses with appropriate HTTP status codes.