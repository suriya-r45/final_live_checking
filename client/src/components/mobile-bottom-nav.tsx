import React, { useState } from 'react';
import { Grid3X3, ArrowUpDown, Filter, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  onCategorySelect?: (category: string) => void;
  onSortChange?: (sort: string) => void;
  onFilterChange?: (filters: any) => void;
  activeFilters?: number;
  sortBy?: string;
  currentMainCategory?: string;
}

// Categories from admin product form - same as in product-form.tsx
const HOME_CATEGORIES = {
  'rings': {
    name: 'Rings',
    subcategories: [
      'Engagement Rings',
      'Wedding Bands', 
      'Fashion Rings',
      'Cocktail Rings',
      'Promise Rings',
      'Birthstone Rings'
    ]
  },
  'necklaces': {
    name: 'Necklaces',
    subcategories: [
      'Chains',
      'Chokers',
      'Lockets',
      'Beaded Necklaces',
      'Collars',
      'Long Necklaces/Opera Chains',
      'Multi-layered Necklaces'
    ]
  },
  'pendants': {
    name: 'Pendants',
    subcategories: [
      'Solitaire',
      'Halo',
      'Cluster',
      'Heart',
      'Cross',
      'Initial',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional'
    ]
  },
  'earrings': { 
    name: 'Earrings',
    subcategories: [
      'Stud Earrings',
      'Hoop Earrings',
      'Drop Earrings',
      'Dangle Earrings',
      'Ear Cuffs',
      'Huggie Earrings'
    ]
  },
  'bracelets': {
    name: 'Bracelets',
    subcategories: [
      'Cuff',
      'Tennis',
      'Charm',
      'Chain',
      'Beaded',
      'Link',
      'Bolo',
      'Leather',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional'
    ]
  },
  'bangles': {
    name: 'Bangles',
    subcategories: [
      'Classic',
      'Kada',
      'Cuff',
      'Openable',
      'Adjustable',
      'Charm',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional',
      'Temple',
      'Kundan',
      'Polki',
      'Navratna'
    ]
  },
  'watches': {
    name: 'Watches',
    subcategories: [
      "Men's Watches",
      "Women's Watches",
      'Smartwatches',
      'Luxury Watches',
      'Sport Watches'
    ]
  },
  'mens': {
    name: "Men's Jewellery",
    subcategories: [
      'Rings',
      'Bracelets', 
      'Necklaces',
      'Cufflinks',
      'Tie Clips'
    ]
  },
  'children': {
    name: "Children's Jewellery",
    subcategories: [
      "Kids' Rings",
      "Kids' Necklaces",
      "Kids' Earrings",
      "Kids' Bracelets"
    ]
  },
  'materials': {
    name: 'Materials',
    subcategories: [
      'Gold 22K',
      'Gold 18K', 
      'Silver 925',
      'Diamond',
      'Pearl',
      'Gemstone',
      'Platinum'
    ]
  },
  'custom': {
    name: 'Custom Jewellery',
    subcategories: [
      'Engagement Rings',
      'Wedding Sets',
      'Anniversary Bands',
      'Custom Designs',
      'Personalized'
    ]
  },
  'collections': {
    name: 'Collections',
    subcategories: [
      'Bridal Collection',
      'Traditional Collection',
      'Modern Collection',
      'Vintage Collection',
      'Designer Collection'
    ]
  },
  'gold_coins': {
    name: 'Gold Coins',
    subcategories: [
      'Investment',
      'Religious',
      'Customized',
      'Occasion',
      'Corporate Gifting',
      'Collectible',
      'Plain',
      'Hallmarked'
    ]
  }
};

// Helper function to get category icon
const getCategoryIcon = (categoryKey: string) => {
  switch (categoryKey.toUpperCase()) {
    case 'RINGS':
      return '💍';
    case 'NECKLACES':
      return '📿';
    case 'EARRINGS':
      return '🌸';
    case 'BRACELETS':
      return '🔗';
    case 'BANGLES':
      return '💫';
    case 'PENDANTS':
      return '✨';
    case 'WATCHES':
      return '⌚';
    case 'MENS':
      return '👨';
    case 'CHILDREN':
      return '🧒';
    case 'MATERIALS':
      return '⚡';
    case 'CUSTOM':
      return '🔨';
    case 'COLLECTIONS':
      return '🎁';
    case 'GOLD_COINS':
      return '🪙';
    default:
      return '💎';
  }
};


const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'discount', label: 'Discount' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' }
];

const FILTER_OPTIONS = [
  {
    category: 'Materials',
    options: [
      'Diamond',
      'Gold',
      'Gemstone', 
      'Uncut Diamond',
      'Platinum',
      'Silver',
      'Gold Coins',
      'Pearl'
    ]
  },
  {
    category: 'Price Range (INR)',
    options: [
      '₹5000 - ₹10000',
      '₹10000 - ₹20000', 
      '₹20000 - ₹50000',
      '₹50000 - ₹100000',
      '₹100000+'
    ]
  },
  {
    category: 'Price Range (BHD)',
    options: [
      'BD 10 - BD 25',
      'BD 25 - BD 50', 
      'BD 50 - BD 125',
      'BD 125 - BD 250',
      'BD 250+'
    ]
  },
  {
    category: 'Collections',
    options: [
      'Bridal Collection',
      'Wedding Bands',
      'Daily Wear',
      'Party Collection',
      'Traditional',
      'Modern Design'
    ]
  },
  {
    category: 'Weight Ranges',
    options: [
      'Under 5g',
      '5g - 10g',
      '10g - 20g',
      'Above 20g'
    ]
  }
];

export function MobileBottomNav({ 
  onCategorySelect, 
  onSortChange, 
  onFilterChange, 
  activeFilters = 0,
  sortBy,
  currentMainCategory
}: MobileBottomNavProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Get categories to show based on current context
  const getCategoriesToShow = () => {
    // If we're on a specific main category page, show its subcategories
    if (currentMainCategory && HOME_CATEGORIES[currentMainCategory.toLowerCase() as keyof typeof HOME_CATEGORIES]) {
      const mainCategory = HOME_CATEGORIES[currentMainCategory.toLowerCase() as keyof typeof HOME_CATEGORIES];
      const mainCategoryIcon = getCategoryIcon(currentMainCategory.toUpperCase());
      
      return mainCategory.subcategories.map(subcategoryName => ({
        id: subcategoryName,
        name: subcategoryName,
        icon: mainCategoryIcon
      }));
    }
    
    // If no main category is selected, show all main categories
    return Object.entries(HOME_CATEGORIES).map(([key, category]) => ({
      id: key,
      name: category.name,
      icon: getCategoryIcon(key.toUpperCase())
    }));
  };

  const handleFilterToggle = (filter: string) => {
    const updated = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    setSelectedFilters(updated);
    onFilterChange?.(updated);
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    onFilterChange?.([]);
  };

  return (
    <>
      {/* Fixed bottom navigation - only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div 
          className="flex items-center justify-between px-4 py-3 shadow-2xl border-t"
          style={{ 
            background: 'linear-gradient(135deg, #881337 0%, #7f1d1d 100%)'
          }}
        >
          {/* Categories */}
          <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 flex flex-col items-center gap-1 text-white hover:bg-rose-800 hover:text-rose-100 transition-colors"
              >
                <Grid3X3 className="h-5 w-5" />
                <span className="text-xs font-medium">CATEGORIES</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] bg-white">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-rose-900">Select Category</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {getCategoriesToShow().map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-16 flex flex-col items-center gap-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                    onClick={() => {
                      onCategorySelect?.(category.id);
                      setIsCategorySheetOpen(false);
                    }}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-xs text-center leading-tight">{category.name}</span>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Sheet open={isSortSheetOpen} onOpenChange={setIsSortSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 flex flex-col items-center gap-1 text-white hover:bg-rose-800 hover:text-rose-100 transition-colors"
              >
                <ArrowUpDown className="h-5 w-5" />
                <span className="text-xs font-medium">SORT</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] bg-white">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-rose-900">Sort Designs By</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "default" : "ghost"}
                    className={`w-full justify-start h-12 ${
                      sortBy === option.value 
                        ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                        : 'text-gray-700 hover:bg-rose-50'
                    }`}
                    onClick={() => {
                      onSortChange?.(option.value);
                      setIsSortSheetOpen(false);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Filter */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 flex flex-col items-center gap-1 text-white hover:bg-rose-800 hover:text-rose-100 transition-colors relative"
              >
                <div className="relative">
                  <Filter className="h-5 w-5" />
                  {activeFilters > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      style={{ backgroundColor: '#ec4899', color: 'white' }}
                    >
                      {activeFilters}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">FILTER</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] bg-white">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-rose-900">Filters</SheetTitle>
                  {selectedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-rose-700 hover:text-rose-900"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="space-y-6 max-h-[65vh] overflow-y-auto pt-4">
                {FILTER_OPTIONS.map((filterGroup) => (
                  <div key={filterGroup.category} className="space-y-3">
                    <h3 className="font-medium text-gray-900">{filterGroup.category}</h3>
                    <div className="space-y-2">
                      {filterGroup.options.map((option) => (
                        <Button
                          key={option}
                          variant="ghost"
                          className={`w-full justify-between h-10 ${
                            selectedFilters.includes(option)
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => handleFilterToggle(option)}
                        >
                          <span>{option}</span>
                          {selectedFilters.includes(option) && (
                            <span className="text-rose-500">✓</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply Filters Button */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
                <Button
                  className="flex-1 text-white"
                  style={{ backgroundColor: '#881337' }}
                  onClick={() => {
                    onFilterChange?.(selectedFilters);
                    setIsFilterSheetOpen(false);
                    // Show a quick feedback that filters were applied
                    if (selectedFilters.length > 0) {
                      // Create a temporary toast-like message
                      const message = document.createElement('div');
                      message.textContent = `${selectedFilters.length} filter(s) applied!`;
                      message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium';
                      document.body.appendChild(message);
                      setTimeout(() => document.body.removeChild(message), 2000);
                    }
                  }}
                >
                  APPLY FILTERS ({selectedFilters.length})
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />
    </>
  );
}