/**
 * HIVE MIND Phase 6.2: WineFilters Comprehensive Testing - HIGHEST RISK
 * Testing 48+ filter options across 8 categories with complex vintage logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WineFilters from '../../src/components/wines/WineFilters';

describe('WineFilters - HIVE MIND Phase 6.2 (HIGHEST RISK)', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    totalCount: 200,
    filteredCount: 150
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Component Structure (8 categories - MOST COMPLEX)
  describe('Component Structure (8 categories)', () => {
    test('should render all 8 wine filter categories', () => {
      render(<WineFilters {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));
      
      expect(screen.getByText('Wine Type')).toBeInTheDocument();
      expect(screen.getByText('Grape Varietal')).toBeInTheDocument();
      expect(screen.getByText('Region')).toBeInTheDocument();
      expect(screen.getByText('Vintage')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Sweetness')).toBeInTheDocument();
      expect(screen.getByText('Wine Spectator Rating')).toBeInTheDocument();
    });

    test('should show correct wine count display', () => {
      render(<WineFilters {...defaultProps} />);
      expect(screen.getByText('Showing 150 of 200 wines')).toBeInTheDocument();
    });

    test('should use purple color scheme for wine filters', () => {
      render(<WineFilters {...defaultProps} />);
      const toggleButton = screen.getByRole('button', { name: /wine filters/i });
      
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveClass('hover:text-purple-600');
    });
  });

  // Test 2: Wine Type Filters (6 options)
  describe('Wine Type Filters (6 options)', () => {
    const wineTypes = ['Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'];

    test('should render all wine type options', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      wineTypes.forEach(type => {
        expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
      });
    });

    test('should use purple color scheme for selected wine types', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const redWineButton = screen.getByRole('button', { name: 'Red Wine' });
      fireEvent.click(redWineButton);

      expect(redWineButton).toHaveClass('bg-purple-600', 'text-white');
    });
  });

  // Test 3: Grape Varietal Filters (12 options - HIGH COMPLEXITY)
  describe('Grape Varietal Filters (12 options)', () => {
    const varietals = [
      'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Malbec', 'Sangiovese',
      'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Gewürztraminer', 'Viognier'
    ];

    test('should render all 12 grape varietal options', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      varietals.forEach(varietal => {
        expect(screen.getByRole('button', { name: varietal })).toBeInTheDocument();
      });
    });

    test('should handle complex varietal names with special characters', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const complexVarietals = ['Syrah/Shiraz', 'Gewürztraminer'];
      
      complexVarietals.forEach(varietal => {
        const button = screen.getByRole('button', { name: varietal });
        fireEvent.click(button);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ varietal })
        );
      });
    });

    test('should use red color scheme for varietals', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const cabSavButton = screen.getByRole('button', { name: 'Cabernet Sauvignon' });
      fireEvent.click(cabSavButton);

      expect(cabSavButton).toHaveClass('bg-red-500', 'text-white');
    });
  });

  // Test 4: Region Filters (12 options) - SCROLLABLE SECTION
  describe('Region Filters with Scrolling (12 options)', () => {
    const regions = [
      'Napa Valley', 'Sonoma', 'Bordeaux', 'Burgundy', 'Tuscany', 'Rioja', 
      'Barossa Valley', 'Marlborough', 'Champagne', 'Loire Valley', 'Piedmont', 'Douro'
    ];

    test('should render regions in scrollable section', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const regionSection = screen.getByText('Region').parentElement;
      const scrollableDiv = regionSection.querySelector('.max-h-40.overflow-y-auto');
      
      expect(scrollableDiv).toBeInTheDocument();
    });

    test('should render all region options as radio buttons', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      regions.forEach(region => {
        const radio = screen.getByRole('radio', { name: region });
        expect(radio).toBeInTheDocument();
        expect(radio.name).toBe('region');
      });
    });

    test('should have MapPin icon for region section', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const regionHeader = screen.getByText('Region');
      expect(regionHeader.previousElementSibling).toBeTruthy(); // Icon should be present
    });
  });

  // Test 5: Vintage Filters (12 options) - COMPLEX LOGIC - HIGHEST RISK
  describe('Vintage Filters with Complex Range Logic (12 options) - HIGHEST RISK', () => {
    const vintages = [
      '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', 
      '2010-2014', '2005-2009', 'Pre-2005'
    ];

    test('should render all vintage options including complex ranges', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      vintages.forEach(vintage => {
        expect(screen.getByRole('radio', { name: vintage })).toBeInTheDocument();
      });
    });

    test('should handle complex vintage range selections', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const complexRanges = ['2010-2014', '2005-2009', 'Pre-2005'];
      
      complexRanges.forEach(range => {
        const radio = screen.getByRole('radio', { name: range });
        fireEvent.click(radio);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ vintage: range })
        );
      });
    });

    test('should render vintage section in scrollable area', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const vintageSection = screen.getByText('Vintage').parentElement;
      const scrollableDiv = vintageSection.querySelector('.max-h-40.overflow-y-auto');
      
      expect(scrollableDiv).toBeInTheDocument();
    });

    test('should have Calendar icon for vintage section', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const vintageHeader = screen.getByText('Vintage');
      expect(vintageHeader.previousElementSibling).toBeTruthy(); // Icon should be present
    });

    test('should validate vintage range logic for edge cases', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      // Test Pre-2005 range
      const pre2005Radio = screen.getByRole('radio', { name: 'Pre-2005' });
      fireEvent.click(pre2005Radio);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ vintage: 'Pre-2005' })
      );

      // Test 2010-2014 range
      const range2010Radio = screen.getByRole('radio', { name: '2010-2014' });
      fireEvent.click(range2010Radio);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ vintage: '2010-2014' })
      );
    });
  });

  // Test 6: Price Range Filters (5 options)
  describe('Price Range Filters (5 options)', () => {
    const priceRanges = ['Under $25', '$25-50', '$50-100', '$100-200', 'Over $200'];

    test('should render all price range options', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      priceRanges.forEach(range => {
        expect(screen.getByRole('button', { name: range })).toBeInTheDocument();
      });
    });

    test('should use green color scheme for price ranges', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const expensiveButton = screen.getByRole('button', { name: 'Over $200' });
      fireEvent.click(expensiveButton);

      expect(expensiveButton).toHaveClass('bg-green-600', 'text-white');
    });
  });

  // Test 7: Body Filters (3 radio options)
  describe('Body Filters (3 radio options)', () => {
    const bodyOptions = ['Light-bodied', 'Medium-bodied', 'Full-bodied'];

    test('should render body options as radio buttons', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      bodyOptions.forEach(body => {
        const radio = screen.getByRole('radio', { name: body });
        expect(radio).toBeInTheDocument();
        expect(radio.name).toBe('body');
      });
    });
  });

  // Test 8: Sweetness Filters (6 radio options)
  describe('Sweetness Filters (6 radio options)', () => {
    const sweetnessLevels = ['Bone Dry', 'Dry', 'Off-Dry', 'Medium Sweet', 'Sweet', 'Dessert'];

    test('should render all sweetness levels', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      sweetnessLevels.forEach(sweetness => {
        const radio = screen.getByRole('radio', { name: sweetness });
        expect(radio).toBeInTheDocument();
        expect(radio.name).toBe('sweetness');
      });
    });

    test('should handle edge case sweetness levels', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const boneDryRadio = screen.getByRole('radio', { name: 'Bone Dry' });
      const dessertRadio = screen.getByRole('radio', { name: 'Dessert' });

      fireEvent.click(boneDryRadio);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sweetness: 'Bone Dry' })
      );

      fireEvent.click(dessertRadio);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sweetness: 'Dessert' })
      );
    });
  });

  // Test 9: Wine Spectator Rating (4 options)
  describe('Wine Spectator Rating (4 options)', () => {
    const wsRatings = ['95-100 (Outstanding)', '90-94 (Excellent)', '85-89 (Very Good)', '80-84 (Good)'];

    test('should render WS rating section with Star icon', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const ratingHeader = screen.getByText('Wine Spectator Rating');
      expect(ratingHeader.previousElementSibling).toBeTruthy(); // Star icon should be present
    });

    test('should render all rating options', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      wsRatings.forEach(rating => {
        const radio = screen.getByRole('radio', { name: rating });
        expect(radio).toBeInTheDocument();
        expect(radio.name).toBe('wsRank');
      });
    });

    test('should handle complex rating format with parentheses', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const outstandingRadio = screen.getByRole('radio', { name: '95-100 (Outstanding)' });
      fireEvent.click(outstandingRadio);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ wsRank: '95-100 (Outstanding)' })
      );
    });
  });

  // Test 10: Scrollable Sections Testing - CRITICAL
  describe('Scrollable Sections Functionality - CRITICAL', () => {
    test('should implement scrollable regions correctly', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const scrollableSections = screen.getAllByRole('group').filter(section => 
        section.querySelector('.max-h-40.overflow-y-auto')
      );

      expect(scrollableSections.length).toBeGreaterThanOrEqual(2); // Region and Vintage sections
    });

    test('should handle scroll behavior for regions', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const regionScrollable = screen.getByText('Region').parentElement
        .querySelector('.max-h-40.overflow-y-auto');
      
      expect(regionScrollable).toBeInTheDocument();
      expect(regionScrollable.scrollHeight).toBeGreaterThan(0);
    });

    test('should handle scroll behavior for vintages', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const vintageScrollable = screen.getByText('Vintage').parentElement
        .querySelector('.max-h-40.overflow-y-auto');
      
      expect(vintageScrollable).toBeInTheDocument();
      expect(vintageScrollable.scrollHeight).toBeGreaterThan(0);
    });
  });

  // Test 11: Complex Filter Combinations - HIGH RISK
  describe('Complex Filter Combinations - HIGH RISK', () => {
    test('should handle multiple filter selections simultaneously', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      // Apply multiple complex filters
      fireEvent.click(screen.getByRole('button', { name: 'Red Wine' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cabernet Sauvignon' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Napa Valley' }));
      fireEvent.click(screen.getByRole('radio', { name: '2010-2014' }));
      fireEvent.click(screen.getByRole('button', { name: '$50-100' }));

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          wineType: 'Red Wine',
          varietal: 'Cabernet Sauvignon',
          region: 'Napa Valley',
          vintage: '2010-2014',
          priceRange: '$50-100'
        })
      );
    });

    test('should clear all filters including complex ranges', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      // Apply filters
      fireEvent.click(screen.getByRole('button', { name: 'Sparkling' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Pre-2005' }));

      // Clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        wineType: '',
        varietal: '',
        region: '',
        vintage: '',
        priceRange: '',
        body: '',
        sweetness: '',
        wsRank: ''
      });
    });
  });

  // Test 12: Performance Testing - CRITICAL FOR 48+ OPTIONS
  describe('Performance Testing - 48+ Options', () => {
    test('should meet performance targets with complex vintage logic', async () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const startTime = performance.now();

      // Test complex vintage selections rapidly
      const complexVintages = ['2010-2014', '2005-2009', 'Pre-2005'];
      
      for (const vintage of complexVintages) {
        fireEvent.click(screen.getByRole('radio', { name: vintage }));
        await waitFor(() => {
          expect(mockOnFiltersChange).toHaveBeenCalled();
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // Performance requirement
    });

    test('should handle rapid filter changes without performance degradation', async () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const performanceTests = [];
      const filterElements = [
        screen.getByRole('button', { name: 'Red Wine' }),
        screen.getByRole('button', { name: 'Chardonnay' }),
        screen.getByRole('radio', { name: 'Burgundy' }),
        screen.getByRole('radio', { name: '2020' }),
        screen.getByRole('button', { name: '$25-50' })
      ];

      for (const element of filterElements) {
        const startTime = performance.now();
        fireEvent.click(element);
        
        await waitFor(() => {
          const endTime = performance.now();
          performanceTests.push(endTime - startTime);
        });
      }

      const averageTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      expect(averageTime).toBeLessThan(100); // Individual filter changes should be very fast
    });
  });

  // Test 13: Error Handling and Edge Cases
  describe('Error Handling and Edge Cases', () => {
    test('should handle vintage range edge cases properly', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      // Test edge case: Pre-2005 selection
      const pre2005Radio = screen.getByRole('radio', { name: 'Pre-2005' });
      fireEvent.click(pre2005Radio);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ vintage: 'Pre-2005' })
      );

      // Deselect
      fireEvent.click(pre2005Radio);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ vintage: '' })
      );
    });

    test('should handle special characters in varietal names', () => {
      render(<WineFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /wine filters/i }));

      const specialVarietal = screen.getByRole('button', { name: 'Gewürztraminer' });
      fireEvent.click(specialVarietal);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ varietal: 'Gewürztraminer' })
      );
    });
  });
});

// Export test configuration for HIVE MIND reporting
export default {
  suiteName: 'WineFilters - Phase 6.2 (HIGHEST RISK)',
  filterCount: 48,
  categories: 8,
  complexityLevel: 'HIGHEST',
  criticalFeatures: ['vintage ranges', 'scrollable sections', 'special characters'],
  performanceTarget: '500ms',
  riskFactors: ['complex vintage logic', '48+ filter options', 'scrollable UI elements'],
  testStatus: 'COMPREHENSIVE_HIGH_RISK'
};