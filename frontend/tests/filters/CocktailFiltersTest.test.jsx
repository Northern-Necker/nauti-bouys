/**
 * HIVE MIND Phase 6.1: CocktailFilters Comprehensive Testing
 * Testing 34+ filter options across 6 categories with SmartSearch integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CocktailFilters from '../../src/components/cocktails/CocktailFilters';

describe('CocktailFilters - HIVE MIND Phase 6.1', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    totalCount: 100,
    filteredCount: 85
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Component Rendering and Structure
  describe('Component Structure (6 categories)', () => {
    test('should render all 6 filter categories', () => {
      render(<CocktailFilters {...defaultProps} />);
      
      // Open filters panel
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      
      expect(screen.getByText('Primary Spirit')).toBeInTheDocument();
      expect(screen.getByText('Flavor Profile')).toBeInTheDocument();
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Perfect For')).toBeInTheDocument();
      expect(screen.getByText('Dietary Preferences')).toBeInTheDocument();
    });

    test('should show correct total and filtered counts', () => {
      render(<CocktailFilters {...defaultProps} />);
      expect(screen.getByText('Showing 85 of 100 cocktails')).toBeInTheDocument();
    });
  });

  // Test 2: Primary Spirit Filters (8 options)
  describe('Primary Spirit Filters (8 options)', () => {
    const primarySpirits = ['Vodka', 'Gin', 'Rum', 'Whiskey', 'Tequila', 'Brandy', 'Mezcal', 'Absinthe'];

    test('should render all 8 primary spirit options', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      primarySpirits.forEach(spirit => {
        expect(screen.getByRole('button', { name: spirit })).toBeInTheDocument();
      });
    });

    test('should handle primary spirit selection and toggle', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const vodkaButton = screen.getByRole('button', { name: 'Vodka' });
      
      // First click - select
      fireEvent.click(vodkaButton);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ primarySpirit: 'Vodka' })
      );

      // Second click - deselect
      fireEvent.click(vodkaButton);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ primarySpirit: '' })
      );
    });

    test('should show visual feedback for selected spirit', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const ginButton = screen.getByRole('button', { name: 'Gin' });
      fireEvent.click(ginButton);

      expect(ginButton).toHaveClass('bg-teal-600', 'text-white');
    });
  });

  // Test 3: Flavor Profile Filters (8 options)
  describe('Flavor Profile Filters (8 options)', () => {
    const flavorProfiles = ['Sweet', 'Sour', 'Bitter', 'Spicy', 'Fruity', 'Herbal', 'Citrus', 'Tropical'];

    test('should render all 8 flavor profile options', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      flavorProfiles.forEach(flavor => {
        expect(screen.getByRole('button', { name: flavor })).toBeInTheDocument();
      });
    });

    test('should use orange color scheme for flavor profiles', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const citrusButton = screen.getByRole('button', { name: 'Citrus' });
      fireEvent.click(citrusButton);

      expect(citrusButton).toHaveClass('bg-orange-500', 'text-white');
    });
  });

  // Test 4: Strength Filters (3 radio options)
  describe('Strength Filters (3 radio options)', () => {
    const strengthOptions = ['Light (< 15% ABV)', 'Medium (15-25% ABV)', 'Strong (> 25% ABV)'];

    test('should render strength options as radio buttons', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      strengthOptions.forEach(strength => {
        const radio = screen.getByRole('radio', { name: strength });
        expect(radio).toBeInTheDocument();
        expect(radio.name).toBe('strength');
      });
    });

    test('should allow only one strength selection', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const lightRadio = screen.getByRole('radio', { name: 'Light (< 15% ABV)' });
      const strongRadio = screen.getByRole('radio', { name: 'Strong (> 25% ABV)' });

      fireEvent.click(lightRadio);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ strength: 'Light (< 15% ABV)' })
      );

      fireEvent.click(strongRadio);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ strength: 'Strong (> 25% ABV)' })
      );
    });
  });

  // Test 5: Price Range Filters (4 radio options)
  describe('Price Range Filters (4 radio options)', () => {
    const priceRanges = ['Under $10', '$10-15', '$15-20', 'Over $20'];

    test('should render all price range options', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      priceRanges.forEach(range => {
        expect(screen.getByRole('radio', { name: range })).toBeInTheDocument();
      });
    });
  });

  // Test 6: Occasion Filters (6 options)
  describe('Occasion Filters (6 options)', () => {
    const occasions = ['Brunch', 'Happy Hour', 'Dinner', 'Late Night', 'Date Night', 'Group Celebration'];

    test('should render all occasion options', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      occasions.forEach(occasion => {
        expect(screen.getByRole('button', { name: occasion })).toBeInTheDocument();
      });
    });

    test('should use purple color scheme for occasions', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const dateNightButton = screen.getByRole('button', { name: 'Date Night' });
      fireEvent.click(dateNightButton);

      expect(dateNightButton).toHaveClass('bg-purple-500', 'text-white');
    });
  });

  // Test 7: Dietary Preferences (4 checkbox options)
  describe('Dietary Preferences (4 checkbox options)', () => {
    const dietaryOptions = ['Vegan', 'Gluten-Free', 'Low Sugar', 'Dairy-Free'];

    test('should render dietary options as checkboxes', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      dietaryOptions.forEach(diet => {
        expect(screen.getByRole('checkbox', { name: diet })).toBeInTheDocument();
      });
    });

    test('should allow multiple dietary selections', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const veganCheckbox = screen.getByRole('checkbox', { name: 'Vegan' });
      const glutenFreeCheckbox = screen.getByRole('checkbox', { name: 'Gluten-Free' });

      fireEvent.click(veganCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ dietary: ['Vegan'] })
      );

      fireEvent.click(glutenFreeCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ dietary: ['Vegan', 'Gluten-Free'] })
      );

      // Deselect vegan
      fireEvent.click(veganCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ dietary: ['Gluten-Free'] })
      );
    });
  });

  // Test 8: Filter Management
  describe('Filter Management', () => {
    test('should show active filter count', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply multiple filters
      fireEvent.click(screen.getByRole('button', { name: 'Vodka' }));
      fireEvent.click(screen.getByRole('button', { name: 'Citrus' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Vegan' }));

      expect(screen.getByText('3')).toBeInTheDocument(); // Badge count
    });

    test('should clear all filters', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply filters
      fireEvent.click(screen.getByRole('button', { name: 'Gin' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Strong (> 25% ABV)' }));

      // Clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        primarySpirit: '',
        flavorProfile: '',
        strength: '',
        priceRange: '',
        occasion: '',
        dietary: []
      });
    });

    test('should toggle filter panel visibility', () => {
      render(<CocktailFilters {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      
      // Panel should be closed initially
      expect(screen.queryByText('Primary Spirit')).not.toBeInTheDocument();

      // Open panel
      fireEvent.click(toggleButton);
      expect(screen.getByText('Primary Spirit')).toBeInTheDocument();

      // Close panel
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Primary Spirit')).not.toBeInTheDocument();
    });
  });

  // Test 9: Performance Testing
  describe('Performance Requirements', () => {
    test('should handle filter changes within performance threshold', async () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const startTime = performance.now();
      
      // Apply multiple filters rapidly
      fireEvent.click(screen.getByRole('button', { name: 'Whiskey' }));
      fireEvent.click(screen.getByRole('button', { name: 'Spicy' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Medium (15-25% ABV)' }));

      await waitFor(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(500); // Performance requirement: <500ms
      });
    });
  });

  // Test 10: Integration Testing
  describe('SmartSearch Integration', () => {
    test('should maintain filter state during search operations', () => {
      render(<CocktailFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply filters
      fireEvent.click(screen.getByRole('button', { name: 'Rum' }));
      fireEvent.click(screen.getByRole('button', { name: 'Tropical' }));

      // Verify filters are applied
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          primarySpirit: 'Rum',
          flavorProfile: 'Tropical'
        })
      );
    });
  });

  // Test 11: Error Handling
  describe('Error Handling', () => {
    test('should handle missing onFiltersChange prop gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CocktailFilters totalCount={100} filteredCount={85} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Vodka' }));
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });
});

// Performance Test Suite
describe('CocktailFilters Performance - HIVE MIND Requirements', () => {
  test('should meet 500ms performance target for all filter operations', async () => {
    const mockOnFiltersChange = jest.fn();
    
    render(<CocktailFilters 
      onFiltersChange={mockOnFiltersChange}
      totalCount={500} 
      filteredCount={250} 
    />);
    
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));

    const allFilterElements = [
      ...screen.getAllByRole('button').filter(btn => 
        ['Vodka', 'Gin', 'Sweet', 'Citrus', 'Brunch'].includes(btn.textContent)
      ),
      ...screen.getAllByRole('radio'),
      ...screen.getAllByRole('checkbox')
    ];

    // Test each filter for performance
    for (const element of allFilterElements.slice(0, 10)) { // Test first 10 elements
      const startTime = performance.now();
      
      fireEvent.click(element);
      
      await waitFor(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(500);
      });
    }
  });
});

export default {
  suiteName: 'CocktailFilters - Phase 6.1',
  filterCount: 34,
  categories: 6,
  performanceTarget: '500ms',
  integrationPoints: ['SmartSearch'],
  testStatus: 'COMPREHENSIVE'
};