/**
 * HIVE MIND Phase 6.3: SpiritFilters Comprehensive Testing
 * Testing 42+ filter options across 5 categories with 5-column grid layout
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpiritFilters from '../../src/components/spirits/SpiritFilters';

describe('SpiritFilters - HIVE MIND Phase 6.3', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    totalCount: 300,
    filteredCount: 180
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Component Structure (5 categories, 5-column grid)
  describe('Component Structure (5 categories, 5-column grid)', () => {
    test('should render all 5 spirit filter categories', () => {
      render(<SpiritFilters {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      
      expect(screen.getByText('Spirit Type')).toBeInTheDocument();
      expect(screen.getByText('Age Statement')).toBeInTheDocument();
      expect(screen.getByText('Region/Origin')).toBeInTheDocument();
      expect(screen.getByText('Proof Range')).toBeInTheDocument();
      expect(screen.getByText('Rarity')).toBeInTheDocument();
    });

    test('should implement 5-column grid layout', () => {
      render(<SpiritFilters {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      
      const gridContainer = screen.getByRole('main') || document.querySelector('.grid');
      expect(gridContainer).toHaveClass('xl:grid-cols-5');
    });

    test('should show correct spirit count display', () => {
      render(<SpiritFilters {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      
      expect(screen.getByText(/Showing 180 of 300 spirits/)).toBeInTheDocument();
    });

    test('should use amber color scheme for spirit filters', () => {
      render(<SpiritFilters {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      expect(toggleButton.querySelector('.text-amber-600')).toBeInTheDocument();
    });
  });

  // Test 2: Spirit Type Filters (13 options - LARGEST CATEGORY)
  describe('Spirit Type Filters (13 options)', () => {
    const spiritTypes = [
      'Whiskey', 'Bourbon', 'Scotch', 'Rye', 'Irish Whiskey', 'Tequila', 'Mezcal',
      'Gin', 'Rum', 'Vodka', 'Brandy', 'Cognac', 'Armagnac'
    ];

    test('should render all 13 spirit type options', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      spiritTypes.forEach(spirit => {
        expect(screen.getByRole('checkbox', { name: spirit })).toBeInTheDocument();
      });
    });

    test('should handle spirit type selection as checkboxes', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const bourbonCheckbox = screen.getByRole('checkbox', { name: 'Bourbon' });
      fireEvent.click(bourbonCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ spiritType: 'Bourbon' })
      );

      // Test deselection
      fireEvent.click(bourbonCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });

    test('should handle complex spirit names', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const complexSpirits = ['Irish Whiskey', 'Armagnac'];
      
      complexSpirits.forEach(spirit => {
        const checkbox = screen.getByRole('checkbox', { name: spirit });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ spiritType: spirit })
        );
      });
    });
  });

  // Test 3: Age Statement Filters (8 options) - COMPLEX LOGIC
  describe('Age Statement Filters (8 options) - COMPLEX LOGIC', () => {
    const ageStatements = [
      'No Age Statement', '3-5 Years', '6-10 Years', '12 Years', 
      '15 Years', '18 Years', '21+ Years', 'Vintage'
    ];

    test('should render all age statement options', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      ageStatements.forEach(age => {
        expect(screen.getByRole('checkbox', { name: age })).toBeInTheDocument();
      });
    });

    test('should handle complex age statement logic', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Test range-based age statements
      const complexAges = ['21+ Years', 'No Age Statement', 'Vintage'];
      
      complexAges.forEach(age => {
        const checkbox = screen.getByRole('checkbox', { name: age });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ age })
        );
      });
    });

    test('should handle numeric and text age statements', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Test specific year ages
      const yearAges = ['12 Years', '15 Years', '18 Years'];
      
      yearAges.forEach(age => {
        const checkbox = screen.getByRole('checkbox', { name: age });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ age })
        );
      });
    });
  });

  // Test 4: Region/Origin Filters (12 options)
  describe('Region/Origin Filters (12 options)', () => {
    const regions = [
      'Scotland', 'Ireland', 'Kentucky', 'Tennessee', 'Japan', 'Canada',
      'Mexico', 'Jamaica', 'Barbados', 'France', 'England', 'Other'
    ];

    test('should render all region/origin options', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      regions.forEach(region => {
        expect(screen.getByRole('checkbox', { name: region })).toBeInTheDocument();
      });
    });

    test('should handle international region selection', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const internationalRegions = ['Japan', 'Jamaica', 'Barbados'];
      
      internationalRegions.forEach(region => {
        const checkbox = screen.getByRole('checkbox', { name: region });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ region })
        );
      });
    });

    test('should handle "Other" region category', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const otherCheckbox = screen.getByRole('checkbox', { name: 'Other' });
      fireEvent.click(otherCheckbox);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'Other' })
      );
    });
  });

  // Test 5: Proof Range Filters (5 options) - TECHNICAL COMPLEXITY
  describe('Proof Range Filters (5 options) - TECHNICAL COMPLEXITY', () => {
    const proofRanges = [
      'Under 80 Proof', '80-90 Proof', '90-100 Proof', 
      '100-110 Proof', '110+ Proof (Cask Strength)'
    ];

    test('should render all proof range options', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      proofRanges.forEach(proof => {
        expect(screen.getByRole('checkbox', { name: proof })).toBeInTheDocument();
      });
    });

    test('should handle cask strength proof category', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const caskStrengthCheckbox = screen.getByRole('checkbox', { name: '110+ Proof (Cask Strength)' });
      fireEvent.click(caskStrengthCheckbox);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ proof: '110+ Proof (Cask Strength)' })
      );
    });

    test('should handle numerical proof ranges', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const numericalProofs = ['80-90 Proof', '90-100 Proof', '100-110 Proof'];
      
      numericalProofs.forEach(proof => {
        const checkbox = screen.getByRole('checkbox', { name: proof });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ proof })
        );
      });
    });
  });

  // Test 6: Rarity Filters (6 options)
  describe('Rarity Filters (6 options)', () => {
    const rarityLevels = [
      'Standard', 'Small Batch', 'Single Barrel', 
      'Limited Edition', 'Rare/Allocated', 'Vintage'
    ];

    test('should render all rarity level options', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      rarityLevels.forEach(rarity => {
        expect(screen.getByRole('checkbox', { name: rarity })).toBeInTheDocument();
      });
    });

    test('should handle special rarity categories', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const specialRarities = ['Rare/Allocated', 'Single Barrel', 'Limited Edition'];
      
      specialRarities.forEach(rarity => {
        const checkbox = screen.getByRole('checkbox', { name: rarity });
        fireEvent.click(checkbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ rarity })
        );
      });
    });
  });

  // Test 7: 5-Column Grid Layout Responsiveness - CRITICAL
  describe('5-Column Grid Layout Responsiveness - CRITICAL', () => {
    test('should implement responsive grid breakpoints', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const gridContainer = document.querySelector('.grid');
      
      expect(gridContainer).toHaveClass(
        'grid-cols-1',      // Mobile
        'md:grid-cols-2',   // Medium screens
        'lg:grid-cols-3',   // Large screens
        'xl:grid-cols-5'    // Extra large screens
      );
    });

    test('should handle grid layout with 5 filter categories', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const filterSections = screen.getAllByRole('group');
      expect(filterSections.length).toBeGreaterThanOrEqual(5);
    });

    test('should maintain proper spacing in grid layout', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-6');
    });
  });

  // Test 8: Filter Toggle and UI Behavior
  describe('Filter Toggle and UI Behavior', () => {
    test('should toggle filter panel visibility with ChevronUp/Down icons', () => {
      render(<SpiritFilters {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /filters/i });
      
      // Panel should be closed initially
      expect(screen.queryByText('Spirit Type')).not.toBeInTheDocument();
      expect(toggleButton.querySelector('.h-4.w-4')).toBeInTheDocument();

      // Open panel
      fireEvent.click(toggleButton);
      expect(screen.getByText('Spirit Type')).toBeInTheDocument();

      // Close panel
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Spirit Type')).not.toBeInTheDocument();
    });

    test('should show active filter count in badge', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply multiple filters
      fireEvent.click(screen.getByRole('checkbox', { name: 'Bourbon' }));
      fireEvent.click(screen.getByRole('checkbox', { name: '12 Years' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Kentucky' }));

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('should show clear all button when filters are active', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply a filter
      fireEvent.click(screen.getByRole('checkbox', { name: 'Scotch' }));

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });
  });

  // Test 9: Filter Management and Clear Functionality
  describe('Filter Management and Clear Functionality', () => {
    test('should clear all filters simultaneously', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply multiple filters
      fireEvent.click(screen.getByRole('checkbox', { name: 'Whiskey' }));
      fireEvent.click(screen.getByRole('checkbox', { name: '18 Years' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Scotland' }));
      fireEvent.click(screen.getByRole('checkbox', { name: '100-110 Proof' }));

      // Clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });

    test('should remove empty filters from state', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply and then remove a filter
      const ginCheckbox = screen.getByRole('checkbox', { name: 'Gin' });
      
      fireEvent.click(ginCheckbox); // Apply
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ spiritType: 'Gin' });
      
      fireEvent.click(ginCheckbox); // Remove
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  // Test 10: Performance Testing - 42+ OPTIONS
  describe('Performance Testing - 42+ Options', () => {
    test('should meet performance targets with 42+ filter options', async () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const performanceTests = [];
      const testFilters = [
        { name: 'Bourbon', category: 'spiritType' },
        { name: '12 Years', category: 'age' },
        { name: 'Kentucky', category: 'region' },
        { name: '90-100 Proof', category: 'proof' },
        { name: 'Small Batch', category: 'rarity' }
      ];

      for (const filter of testFilters) {
        const startTime = performance.now();
        
        fireEvent.click(screen.getByRole('checkbox', { name: filter.name }));
        
        await waitFor(() => {
          const endTime = performance.now();
          performanceTests.push(endTime - startTime);
          expect(mockOnFiltersChange).toHaveBeenCalled();
        });
      }

      const averageTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      expect(averageTime).toBeLessThan(500); // Performance requirement
    });

    test('should handle rapid filter toggling without performance issues', async () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      const rapidToggleTest = async () => {
        const startTime = performance.now();
        
        const vodkaCheckbox = screen.getByRole('checkbox', { name: 'Vodka' });
        
        // Rapid toggle 10 times
        for (let i = 0; i < 10; i++) {
          fireEvent.click(vodkaCheckbox);
        }

        await waitFor(() => {
          expect(mockOnFiltersChange).toHaveBeenCalled();
        });

        const endTime = performance.now();
        return endTime - startTime;
      };

      const duration = await rapidToggleTest();
      expect(duration).toBeLessThan(1000); // Should handle rapid toggling
    });
  });

  // Test 11: Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle missing onFiltersChange prop', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SpiritFilters totalCount={100} filteredCount={50} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      expect(() => {
        fireEvent.click(screen.getByRole('checkbox', { name: 'Bourbon' }));
      }).not.toThrow();

      consoleError.mockRestore();
    });

    test('should handle zero counts gracefully', () => {
      render(<SpiritFilters 
        {...defaultProps} 
        totalCount={0} 
        filteredCount={0} 
      />);
      
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.getByText(/Showing 0 of 0 spirits/)).toBeInTheDocument();
    });

    test('should handle large numbers gracefully', () => {
      render(<SpiritFilters 
        {...defaultProps} 
        totalCount={9999} 
        filteredCount={8888} 
      />);
      
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.getByText(/Showing 8888 of 9999 spirits/)).toBeInTheDocument();
    });
  });

  // Test 12: Integration with Spirit Collections
  describe('Integration with Spirit Collections', () => {
    test('should maintain filter state during collection operations', () => {
      render(<SpiritFilters {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /filters/i }));

      // Apply filters
      fireEvent.click(screen.getByRole('checkbox', { name: 'Rum' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Jamaica' }));

      // Verify filters are maintained
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          spiritType: 'Rum',
          region: 'Jamaica'
        })
      );
    });
  });
});

// Performance Benchmark Suite
describe('SpiritFilters Performance Benchmarks - HIVE MIND', () => {
  test('should complete full filter suite under performance threshold', async () => {
    const mockOnFiltersChange = jest.fn();
    
    render(<SpiritFilters 
      onFiltersChange={mockOnFiltersChange}
      totalCount={1000} 
      filteredCount={500} 
    />);
    
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));

    const startTime = performance.now();

    // Test all filter categories
    const testSequence = [
      { name: 'Whiskey', type: 'checkbox' },
      { name: '15 Years', type: 'checkbox' },
      { name: 'Scotland', type: 'checkbox' },
      { name: '100-110 Proof', type: 'checkbox' },
      { name: 'Single Barrel', type: 'checkbox' }
    ];

    for (const filter of testSequence) {
      fireEvent.click(screen.getByRole(filter.type, { name: filter.name }));
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalled();
      });
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    expect(totalDuration).toBeLessThan(2000); // Complete filter suite under 2s
  });
});

export default {
  suiteName: 'SpiritFilters - Phase 6.3',
  filterCount: 42,
  categories: 5,
  gridLayout: '5-column responsive',
  complexityFeatures: ['age statement logic', 'proof ranges', 'international regions'],
  performanceTarget: '500ms per filter',
  layoutFeatures: ['5-column grid', 'responsive breakpoints', 'amber theme'],
  testStatus: 'COMPREHENSIVE'
};