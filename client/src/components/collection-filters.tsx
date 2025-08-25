import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, X, ChevronDown } from 'lucide-react';
import { ProductFilters } from '@shared/cart-schema';

interface CollectionFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

export function CollectionFilters({ filters, onFiltersChange }: CollectionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== 'ALL_CATEGORIES' && 
      value !== 'ALL_MATERIALS' && value !== 'ALL_GENDERS' && 
      value !== 'ALL_OCCASIONS' && value !== 'DEFAULT_SORT'
    ).length;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-600 hover:text-black"
              data-testid="button-clear-filters"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
          data-testid="button-show-filters"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          Show Filters
        </Button>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-white border rounded-lg">
          {/* Product Type */}
          <Select
            value={filters.category || 'ALL_CATEGORIES'}
            onValueChange={(value) => {
              const categoryValue = value === 'ALL_CATEGORIES' ? undefined : value;
              handleFilterChange('category', categoryValue);
            }}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="PRODUCT TYPE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_CATEGORIES">ALL TYPES</SelectItem>
              <SelectItem value="rings">RINGS</SelectItem>
              <SelectItem value="necklaces">NECKLACES</SelectItem>
              <SelectItem value="earrings">EARRINGS</SelectItem>
              <SelectItem value="bracelets">BRACELETS</SelectItem>
              <SelectItem value="pendants">PENDANTS</SelectItem>
            </SelectContent>
          </Select>

          {/* Stock Status */}
          <Select
            value={filters.inStock ? 'IN_STOCK' : 'ALL_STOCK'}
            onValueChange={(value) => {
              handleFilterChange('inStock', value === 'IN_STOCK' ? true : undefined);
            }}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="STOCK STATUS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_STOCK">ALL STOCK</SelectItem>
              <SelectItem value="IN_STOCK">IN STOCK</SelectItem>
            </SelectContent>
          </Select>

          {/* Price */}
          <Select
            value={filters.priceMax ? `0-${filters.priceMax}` : 'ALL_PRICES'}
            onValueChange={(value) => {
              if (value === 'ALL_PRICES') {
                handleFilterChange('priceMin', undefined);
                handleFilterChange('priceMax', undefined);
              } else {
                const [min, max] = value.split('-').map(Number);
                handleFilterChange('priceMin', min);
                handleFilterChange('priceMax', max);
              }
            }}
          >
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="PRICE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_PRICES">ALL PRICES</SelectItem>
              <SelectItem value="0-10000">₹0 - ₹10K</SelectItem>
              <SelectItem value="10000-25000">₹10K - ₹25K</SelectItem>
              <SelectItem value="25000-50000">₹25K - ₹50K</SelectItem>
              <SelectItem value="50000-100000">₹50K - ₹1L</SelectItem>
              <SelectItem value="100000-999999">₹1L+</SelectItem>
            </SelectContent>
          </Select>

          {/* Metal Colour */}
          <Select
            value={filters.material || 'ALL_MATERIALS'}
            onValueChange={(value) => {
              const materialValue = value === 'ALL_MATERIALS' ? undefined : value;
              handleFilterChange('material', materialValue);
            }}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="METAL COLOUR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_MATERIALS">ALL METALS</SelectItem>
              <SelectItem value="GOLD">GOLD</SelectItem>
              <SelectItem value="SILVER">SILVER</SelectItem>
              <SelectItem value="DIAMOND">DIAMOND</SelectItem>
              <SelectItem value="PLATINUM">PLATINUM</SelectItem>
            </SelectContent>
          </Select>

          {/* More Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                MORE FILTERS
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => handleFilterChange('gender', filters.gender === 'MALE' ? undefined : 'MALE')}
                className={filters.gender === 'MALE' ? 'bg-blue-50' : ''}
              >
                Men's Jewelry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFilterChange('gender', filters.gender === 'FEMALE' ? undefined : 'FEMALE')}
                className={filters.gender === 'FEMALE' ? 'bg-blue-50' : ''}
              >
                Women's Jewelry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFilterChange('featured', !filters.featured)}
                className={filters.featured ? 'bg-blue-50' : ''}
              >
                Featured Items
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFilterChange('premium', !filters.premium)}
                className={filters.premium ? 'bg-blue-50' : ''}
              >
                Premium Collection
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFilterChange('newArrivals', !filters.newArrivals)}
                className={filters.newArrivals ? 'bg-blue-50' : ''}
              >
                New Arrivals
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort By */}
          <Select
            value={filters.sortBy || 'DEFAULT_SORT'}
            onValueChange={(value) => {
              const sortValue = value === 'DEFAULT_SORT' ? undefined : value;
              handleFilterChange('sortBy', sortValue);
            }}
          >
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="SORT BY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEFAULT_SORT">DEFAULT</SelectItem>
              <SelectItem value="newest">NEWEST</SelectItem>
              <SelectItem value="popular">POPULAR</SelectItem>
              <SelectItem value="price_asc">PRICE LOW</SelectItem>
              <SelectItem value="price_desc">PRICE HIGH</SelectItem>
              <SelectItem value="name_asc">NAME A-Z</SelectItem>
              <SelectItem value="name_desc">NAME Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}