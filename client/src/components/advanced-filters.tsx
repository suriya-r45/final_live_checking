import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  SlidersHorizontal, 
  Search, 
  X, 
  Calendar,
  Weight,
  Palette,
  Star,
  TrendingUp,
  Clock,
  ShoppingBag,
  Heart,
  Filter
} from 'lucide-react';
import { ProductFilters } from '@shared/cart-schema';

interface AdvancedFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

const OCCASIONS = [
  'Wedding', 'Engagement', 'Anniversary', 'Birthday', 'Festival', 
  'Office', 'Party', 'Casual', 'Formal', 'Traditional', 'Contemporary'
];

const MATERIALS = [
  'Gold 22K', 'Gold 18K', 'Gold 14K', 'Silver Sterling', 'Silver Oxidized',
  'Platinum', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Gemstone'
];

const GENDERS = ['Men', 'Women', 'Unisex', 'Kids'];

const PURITY_OPTIONS = ['22K', '18K', '14K', '925 Silver', '950 Platinum'];

const STYLE_OPTIONS = [
  'Traditional', 'Contemporary', 'Vintage', 'Minimalist', 'Statement', 
  'Bohemian', 'Classic', 'Modern', 'Antique', 'Designer'
];

const WEIGHT_RANGES = [
  { label: 'Under 5g', min: 0, max: 5 },
  { label: '5g - 10g', min: 5, max: 10 },
  { label: '10g - 20g', min: 10, max: 20 },
  { label: '20g - 50g', min: 20, max: 50 },
  { label: 'Over 50g', min: 50, max: 1000 }
];

export default function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  const handleLocalFilterChange = (key: keyof ProductFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters: ProductFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ProductFilters];
      if (value !== undefined && value !== null && value !== '' && 
          (Array.isArray(value) ? value.length > 0 : true)) {
        count++;
      }
    });
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative premium-button bg-white border-gold-200 hover:border-gold-400 text-gold-700 hover:text-gold-800"
          data-testid="button-advanced-filters"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {getActiveFiltersCount() > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-gold-100 text-gold-800 text-xs px-1.5 py-0.5"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto luxury-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-gradient flex items-center">
            <Filter className="h-6 w-6 mr-2" />
            Advanced Product Filters
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {/* Enhanced Search */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Enhanced Search
            </Label>
            <Input
              placeholder="Search by name, description, or keywords..."
              value={localFilters.search || ''}
              onChange={(e) => handleLocalFilterChange('search', e.target.value)}
              className="input-luxury"
            />
          </div>

          {/* Price Range with Dual Currency */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Price Range (INR)</Label>
            <div className="space-y-2">
              <Slider
                value={[localFilters.priceMin || 0, localFilters.priceMax || 500000]}
                onValueChange={([min, max]) => {
                  handleLocalFilterChange('priceMin', min);
                  handleLocalFilterChange('priceMax', max);
                }}
                max={500000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹{localFilters.priceMin || 0}</span>
                <span>₹{localFilters.priceMax || 500000}</span>
              </div>
            </div>
          </div>

          {/* BHD Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Price Range (BHD)</Label>
            <div className="space-y-2">
              <Slider
                value={[localFilters.priceMinBhd || 0, localFilters.priceMaxBhd || 1250]}
                onValueChange={([min, max]) => {
                  handleLocalFilterChange('priceMinBhd', min);
                  handleLocalFilterChange('priceMaxBhd', max);
                }}
                max={1250}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>BD {localFilters.priceMinBhd || 0}</span>
                <span>BD {localFilters.priceMaxBhd || 1250}</span>
              </div>
            </div>
          </div>

          {/* Weight Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <Weight className="h-4 w-4 mr-2" />
              Weight Range
            </Label>
            <Select
              value={localFilters.weightRange || ''}
              onValueChange={(value) => handleLocalFilterChange('weightRange', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Select weight range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Weights</SelectItem>
                {WEIGHT_RANGES.map((range) => (
                  <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Material & Purity
            </Label>
            <Select
              value={localFilters.material || ''}
              onValueChange={(value) => handleLocalFilterChange('material', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Materials</SelectItem>
                {MATERIALS.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Gender</Label>
            <Select
              value={localFilters.gender || ''}
              onValueChange={(value) => handleLocalFilterChange('gender', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Genders</SelectItem>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Occasion */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Occasion
            </Label>
            <Select
              value={localFilters.occasion || ''}
              onValueChange={(value) => handleLocalFilterChange('occasion', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Occasions</SelectItem>
                {OCCASIONS.map((occasion) => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Sorting */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Advanced Sorting
            </Label>
            <Select
              value={localFilters.sortBy || ''}
              onValueChange={(value) => handleLocalFilterChange('sortBy', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="newest">🆕 Newest Arrivals</SelectItem>
                <SelectItem value="popular">🔥 Most Popular</SelectItem>
                <SelectItem value="price_asc">💰 Price: Low to High</SelectItem>
                <SelectItem value="price_desc">💎 Price: High to Low</SelectItem>
                <SelectItem value="weight_asc">🪶 Weight: Light to Heavy</SelectItem>
                <SelectItem value="weight_desc">⚖️ Weight: Heavy to Light</SelectItem>
                <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                <SelectItem value="stock">📦 In Stock First</SelectItem>
                <SelectItem value="name_asc">🔤 Name: A to Z</SelectItem>
                <SelectItem value="name_desc">🔤 Name: Z to A</SelectItem>
                <SelectItem value="discount">🏷️ Best Discounts</SelectItem>
                <SelectItem value="premium">👑 Premium Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Style
            </Label>
            <Select
              value={localFilters.style || ''}
              onValueChange={(value) => handleLocalFilterChange('style', value)}
            >
              <SelectTrigger className="input-luxury">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Styles</SelectItem>
                {STYLE_OPTIONS.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Availability
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={localFilters.inStock || false}
                  onCheckedChange={(checked) => handleLocalFilterChange('inStock', checked)}
                />
                <Label htmlFor="inStock" className="text-sm">In Stock Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={localFilters.featured || false}
                  onCheckedChange={(checked) => handleLocalFilterChange('featured', checked)}
                />
                <Label htmlFor="featured" className="text-sm">Featured Items</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newArrivals"
                  checked={localFilters.newArrivals || false}
                  onCheckedChange={(checked) => handleLocalFilterChange('newArrivals', checked)}
                />
                <Label htmlFor="newArrivals" className="text-sm">New Arrivals (Last 30 days)</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between pt-6 border-t border-gold-200">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center space-x-2 border-warm-300 text-warm-600 hover:bg-warm-50"
          >
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-warm-300 text-warm-600 hover:bg-warm-50"
            >
              Cancel
            </Button>
            <Button
              onClick={applyFilters}
              className="premium-button px-6"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}