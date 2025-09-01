# Spirits Shelf System Design - Nauti Bouys AI Bartender

## Executive Summary

This document outlines a comprehensive three-tier spirits shelf system that enables the Nauti Bouys AI bartender to make intelligent recommendations based on spirit quality, appropriate usage, and patron authorization levels. The system balances accessibility with respect for premium spirits while providing educational experiences.

## System Architecture

### 1. Three-Tier Classification System

#### Lower Shelf (Mixing Spirits)
- **Purpose**: Primary spirits for cocktail mixing
- **Price Range**: $15-40 (notional)
- **Usage**: Cocktails, mixed drinks, shots
- **Authorization**: Open access for all patrons
- **Examples**: Well vodka, standard rum, mixing whiskey

#### Top Shelf (Premium Spirits)
- **Purpose**: Quality spirits for cocktails and neat consumption
- **Price Range**: $40-120 (notional)
- **Usage**: Premium cocktails, neat, on the rocks
- **Authorization**: Open access with AI guidance
- **Examples**: Grey Goose, Macallan 12, Hennessy VS

#### Ultra Shelf (Rare/Exclusive Spirits)
- **Purpose**: Exceptional spirits requiring special authorization
- **Price Range**: $120+ (notional)
- **Usage**: Neat consumption, special occasions
- **Authorization**: Owner/manager approval required
- **Examples**: Macallan 25, Pappy Van Winkle, Louis XIII

## Database Schema

### Spirit Entity Enhancement

```sql
-- Enhanced Spirit table with shelf system
ALTER TABLE spirits ADD COLUMN shelf_tier VARCHAR(20) NOT NULL DEFAULT 'lower';
ALTER TABLE spirits ADD COLUMN notional_price DECIMAL(10,2);
ALTER TABLE spirits ADD COLUMN recommended_consumption TEXT[];
ALTER TABLE spirits ADD COLUMN heritage_story TEXT;
ALTER TABLE spirits ADD COLUMN tasting_notes TEXT;
ALTER TABLE spirits ADD COLUMN mixing_compatibility INTEGER DEFAULT 5; -- 1-10 scale

-- Shelf tier constraint
ALTER TABLE spirits ADD CONSTRAINT shelf_tier_check 
CHECK (shelf_tier IN ('lower', 'top', 'ultra'));

-- Recommended consumption constraint
ALTER TABLE spirits ADD CONSTRAINT consumption_check
CHECK (recommended_consumption <@ ARRAY['neat', 'rocks', 'cocktail', 'mixed', 'shot']);
```

### Authorization System Tables

```sql
-- Ultra shelf authorization tracking
CREATE TABLE ultra_shelf_authorizations (
    id SERIAL PRIMARY KEY,
    patron_identifier VARCHAR(255), -- Could be table number, name, etc.
    session_id VARCHAR(255),
    authorized_by VARCHAR(255) NOT NULL,
    authorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    spirits_authorized TEXT[], -- Specific spirits or 'all'
    occasion TEXT, -- Birthday, anniversary, etc.
    notes TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Authorization audit trail
CREATE TABLE authorization_requests (
    id SERIAL PRIMARY KEY,
    spirit_id INTEGER REFERENCES spirits(id),
    patron_identifier VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_reason TEXT,
    approved BOOLEAN,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    denial_reason TEXT
);
```

### Recommendation Logic Tables

```sql
-- Spirit pairing and usage guidelines
CREATE TABLE spirit_usage_guidelines (
    id SERIAL PRIMARY KEY,
    spirit_id INTEGER REFERENCES spirits(id),
    usage_type VARCHAR(50), -- 'neat', 'cocktail', 'avoid_mixing'
    recommendation_strength INTEGER, -- 1-10
    explanation TEXT,
    temperature_rec VARCHAR(50), -- 'room_temp', 'chilled', 'rocks'
    glassware_rec VARCHAR(100)
);

-- Educational content for AI storytelling
CREATE TABLE spirit_education_content (
    id SERIAL PRIMARY KEY,
    spirit_id INTEGER REFERENCES spirits(id),
    content_type VARCHAR(50), -- 'history', 'production', 'tasting_guide'
    content TEXT,
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'expert'
    tags TEXT[]
);
```

## Business Logic Framework

### 1. Spirit Selection Algorithm

```javascript
class SpiritSelectionEngine {
    async recommendSpirit(request) {
        const {
            patron_id,
            desired_drink_type,
            experience_level,
            special_occasion,
            budget_tier
        } = request;

        // Check authorization levels
        const ultraAccess = await this.checkUltraShelfAccess(patron_id);
        
        // Get available spirits by tier
        const availableSpirits = await this.getAvailableSpirits(
            ultraAccess ? ['lower', 'top', 'ultra'] : ['lower', 'top']
        );

        // Apply recommendation logic
        return this.applyRecommendationLogic({
            spirits: availableSpirits,
            request,
            hasUltraAccess: ultraAccess
        });
    }

    applyRecommendationLogic({ spirits, request, hasUltraAccess }) {
        // Rule 1: Mixing drinks - prefer lower/top shelf
        if (request.desired_drink_type === 'cocktail') {
            return spirits.filter(s => 
                s.shelf_tier !== 'ultra' || 
                s.mixing_compatibility >= 7
            );
        }

        // Rule 2: Neat consumption - consider all authorized tiers
        if (request.desired_drink_type === 'neat') {
            return this.rankByQualityAndEducationalValue(spirits);
        }

        // Rule 3: Special occasions - suggest upgrades
        if (request.special_occasion && hasUltraAccess) {
            return this.prioritizeUltraShelf(spirits);
        }

        return this.balancedRecommendation(spirits);
    }
}
```

### 2. Authorization Workflow

```javascript
class AuthorizationManager {
    async requestUltraShelfAccess(patronId, spiritId, reason) {
        // Log the request
        const request = await this.logAuthorizationRequest({
            patron_identifier: patronId,
            spirit_id: spiritId,
            request_reason: reason,
            requested_at: new Date()
        });

        // Notify management system
        await this.notifyManagement(request);

        // Return pending status
        return {
            status: 'pending',
            request_id: request.id,
            message: 'Your request has been sent to management for approval.'
        };
    }

    async grantUltraShelfAccess(patronId, authorizedBy, options = {}) {
        const authorization = await this.createAuthorization({
            patron_identifier: patronId,
            authorized_by: authorizedBy,
            expires_at: options.expires_at || this.getDefaultExpiry(),
            spirits_authorized: options.spirits || ['all'],
            occasion: options.occasion,
            notes: options.notes
        });

        // Update AI context
        await this.updateAIContext(patronId, authorization);

        return authorization;
    }
}
```

## AI Conversation Framework

### 1. Educational Guidance System

```javascript
class SpiritEducationEngine {
    async generateSpiritStory(spirit, context) {
        const { experience_level, time_available, interests } = context;
        
        const storyElements = await this.getStoryElements(spirit.id);
        
        return this.craftNarrative({
            spirit,
            elements: storyElements,
            level: experience_level,
            duration: time_available,
            focus: interests
        });
    }

    craftNarrative({ spirit, elements, level, duration, focus }) {
        // Beginner level - simple, engaging
        if (level === 'beginner') {
            return this.createBeginnerStory(spirit, elements);
        }
        
        // Expert level - detailed, technical
        if (level === 'expert') {
            return this.createExpertAnalysis(spirit, elements);
        }
        
        // Default intermediate level
        return this.createBalancedStory(spirit, elements);
    }
}
```

### 2. Recommendation Conversation Patterns

```javascript
const conversationPatterns = {
    // When recommending against mixing ultra shelf
    ultraShelfProtection: {
        trigger: (spirit) => spirit.shelf_tier === 'ultra' && requestType === 'cocktail',
        response: (spirit) => `
            I notice you're interested in ${spirit.name} for a cocktail. This is actually 
            one of our ultra shelf spirits - a ${spirit.age_statement} that's best 
            appreciated neat or with just a splash of water. The complexity and 
            craftsmanship really shine when you can taste it pure. 
            
            For your cocktail, might I suggest ${this.getAlternativeForCocktail(spirit)}? 
            It will create an exceptional drink while letting you save the 
            ${spirit.name} for a special moment of appreciation.
        `
    },

    // Educational upselling
    qualityEducation: {
        trigger: (spirit) => spirit.shelf_tier === 'lower' && canUpgrade(),
        response: (spirit, upgrade) => `
            The ${spirit.name} is perfect for this cocktail! I also wanted to mention 
            we have ${upgrade.name} available - it's from the same distillery but 
            aged ${upgrade.age_statement}. The extra aging adds notes of 
            ${upgrade.tasting_notes.primary}. Would you like to try the upgraded 
            version, or shall we go with the classic?
        `
    },

    // Ultra shelf authorization required
    authorizationNeeded: {
        trigger: (spirit) => spirit.shelf_tier === 'ultra' && !hasAuthorization(),
        response: (spirit) => `
            Excellent choice! ${spirit.name} is one of our ultra shelf selections. 
            ${spirit.heritage_story} 
            
            This particular bottle requires approval from our management. Would you 
            like me to send a request? In the meantime, I can tell you more about 
            this remarkable spirit or suggest something similar from our top shelf.
        `
    }
};
```

## Sample Conversation Scenarios

### Scenario 1: Cocktail Request with Ultra Shelf Spirit

**Patron**: "I'd like an Old Fashioned with Pappy Van Winkle."

**AI Response**:
```
Ah, you have exceptional taste! Pappy Van Winkle 15 Year is truly one of the crown 
jewels of American whiskey. This particular bourbon has a fascinating story - it's 
made at the Buffalo Trace distillery using Julian Van Winkle Sr.'s original wheated 
recipe from 1893. The wheat gives it an incredibly smooth, almost creamy texture 
that's quite different from typical rye-heavy bourbons.

Here's the thing though - this spirit is so complex and nuanced, with notes of 
vanilla, caramel, and dark fruit, that mixing it would be like using a Stradivarius 
as a baseball bat. The craftsmanship deserves to be appreciated neat or perhaps 
with just a single ice cube.

For your Old Fashioned, I'd love to suggest our Elijah Craig Barrel Proof instead. 
It's also a wheated bourbon with enough character to stand up beautifully in a 
cocktail, but at a price point where we can really let it shine in the mix. 

Would you like me to craft that Old Fashioned, or would you prefer to experience 
the Pappy neat? I should mention that our ultra shelf spirits do require 
management approval, but I can certainly send that request if you'd like to 
explore it.
```

### Scenario 2: Educational Upselling Opportunity

**Patron**: "What's good for sipping whiskey tonight?"

**AI Response**:
```
Perfect timing for a contemplative dram! I have several excellent options depending 
on your mood and experience with whiskey.

From our top shelf, I'd highly recommend the Macallan 12 Year Sherry Oak. It's a 
beautiful introduction to Speyside single malts - aged exclusively in sherry-seasoned 
oak casks from Jerez, Spain. You'll taste rich dried fruits, honey, and warm spices. 
It's complex enough to be interesting but approachable enough to be thoroughly 
enjoyable.

If you're feeling adventurous and this is a special evening, we also have the 
Macallan 18 Year available with management approval. The additional six years of 
aging transforms it completely - adding layers of dark chocolate, orange peel, 
and wood smoke. It's a meditation in a glass.

For tonight's sipping, would you like to start with the 12 Year and see how the 
evening unfolds? I can always tell you more about the 18 Year if you'd like to 
make it a truly memorable night.

How do you typically like to enjoy your whiskey - neat, with a splash of water, 
or over a single ice cube?
```

### Scenario 3: Special Occasion Authorization

**Management Interface - Granting Access**:
```
Patron: Table 7 - Anniversary Celebration
Request: Ultra shelf access for evening
Occasion: 25th Wedding Anniversary
Authorized by: Manager Sarah
Duration: This evening's service
Notes: Celebrating silver anniversary, regular customers

Authorization granted for:
- All ultra shelf spirits
- Complimentary service
- Educational experience priority
```

**AI with Authorization**:
```
Congratulations on your 25th anniversary! What a wonderful milestone to celebrate. 
Sarah has graciously opened our entire ultra shelf for your evening, so we can 
truly make this special.

For an anniversary of this significance, might I suggest starting with a toast? 
Our Dom Pérignon Vintage 2012 would be perfect, or if you prefer spirits, the 
Louis XIII Cognac is absolutely sublime - it's a blend of eaux-de-vie aged up 
to 100 years. The depth and complexity mirror the beautiful journey you've 
shared together.

We could also craft a very special cocktail using our Hennessy Paradis - it's 
rare enough that each sip feels like a celebration, but crafted into a perfect 
Sidecar, it becomes pure poetry.

What sounds most appealing for beginning this special evening?
```

## Implementation Roadmap

### Phase 1: Database Enhancement (Week 1)
- Extend Spirit model with shelf tier and pricing
- Create authorization tables
- Migrate existing spirits data with tier assignments

### Phase 2: Business Logic Implementation (Week 2)
- Implement SpiritSelectionEngine
- Create AuthorizationManager
- Build recommendation algorithms

### Phase 3: AI Integration (Week 3)
- Enhance bartender AI with shelf awareness
- Implement conversation patterns
- Create educational content system

### Phase 4: Management Interface (Week 4)
- Build authorization dashboard
- Create patron management system
- Implement real-time notification system

### Phase 5: Testing & Refinement (Week 5)
- Comprehensive testing with various scenarios
- Fine-tune recommendation algorithms
- Gather feedback and iterate

## Success Metrics

### Customer Experience
- **Educational Engagement**: Time spent learning about spirits
- **Satisfaction Scores**: Post-service feedback ratings
- **Repeat Interactions**: Return customers requesting specific spirits

### Business Intelligence
- **Tier Distribution**: Usage patterns across shelf tiers
- **Authorization Frequency**: Ultra shelf access requests and approvals
- **Cost Management**: Notional cost tracking for business insights

### System Performance
- **Response Time**: Speed of recommendations
- **Accuracy**: Appropriateness of spirit suggestions
- **Consistency**: Uniform experience across interactions

## Technical Considerations

### Security
- Encrypted authorization tokens
- Audit trail for all ultra shelf access
- Role-based permissions for management

### Scalability
- Modular architecture for easy expansion
- Caching for frequently accessed spirit data
- Async processing for complex recommendations

### Integration Points
- POS system integration for inventory tracking
- Customer management system connectivity
- Analytics platform data feeds

## Conclusion

This spirits shelf system creates a sophisticated framework that respects both the quality of premium spirits and the intelligence of patrons. By combining educational storytelling with smart authorization controls, the Nauti Bouys AI bartender can provide an elevated experience that celebrates the craft of distilling while ensuring appropriate usage of rare and expensive spirits.

The system's flexibility allows for special occasions while maintaining consistent standards, creating memorable experiences that reflect the establishment's commitment to both hospitality and the appreciation of fine spirits.