import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '@/lib/currency';
import { Product } from '@shared/schema';
import { ProductFilters as IProductFilters } from '@shared/cart-schema';
import ProductCard from '@/components/product-card';

import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import Header from '@/components/header';
import Footer from '@/components/footer';
import WhatsAppFloat from '@/components/whatsapp-float';
import { ArrowLeft, Crown, Star, Gem, Filter, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface CollectionsPageProps {
  material?: string;
  category?: string;
}

// Categories from admin product form - same as in mobile-bottom-nav.tsx  
const HOME_CATEGORIES = {
  'rings': { name: 'Rings', subcategories: ['Engagement Rings', 'Wedding Bands', 'Fashion Rings', 'Cocktail Rings', 'Promise Rings', 'Birthstone Rings'] },
  'necklaces': { name: 'Necklaces', subcategories: ['Chains', 'Chokers', 'Lockets', 'Beaded Necklaces', 'Collars', 'Long Necklaces/Opera Chains', 'Multi-layered Necklaces'] },
  'pendants': { name: 'Pendants', subcategories: ['Solitaire', 'Halo', 'Cluster', 'Heart', 'Cross', 'Initial', 'Diamond', 'Gemstone', 'Pearl', 'Bridal', 'Minimalist', 'Traditional'] },
  'earrings': { name: 'Earrings', subcategories: ['Stud Earrings', 'Hoop Earrings', 'Drop Earrings', 'Dangle Earrings', 'Ear Cuffs', 'Huggie Earrings'] },
  'bracelets': { name: 'Bracelets', subcategories: ['Cuff', 'Tennis', 'Charm', 'Chain', 'Beaded', 'Link', 'Bolo', 'Leather', 'Diamond', 'Gemstone', 'Pearl', 'Bridal', 'Minimalist', 'Traditional'] },
  'bangles': { name: 'Bangles', subcategories: ['Classic', 'Kada', 'Cuff', 'Openable', 'Adjustable', 'Charm', 'Diamond', 'Gemstone', 'Pearl', 'Bridal', 'Minimalist', 'Traditional', 'Temple', 'Kundan', 'Polki', 'Navratna'] },
  'watches': { name: 'Watches', subcategories: ["Men's Watches", "Women's Watches", 'Smartwatches', 'Luxury Watches', 'Sport Watches'] },
  'mens': { name: "Men's Jewellery", subcategories: ['Rings', 'Bracelets', 'Necklaces', 'Cufflinks', 'Tie Clips'] },
  'children': { name: "Children's Jewellery", subcategories: ["Kids' Rings", "Kids' Necklaces", "Kids' Earrings", "Kids' Bracelets"] }
};

export default function CollectionsPage({ material, category }: CollectionsPageProps) {
  const [location, setLocation] = useLocation();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BHD');
  const [filters, setFilters] = useState<IProductFilters>({
    material: material, // Set initial filter based on material
    category: category // Set initial filter based on category
  });
  const [sortBy, setSortBy] = useState<string>('latest');
  const [selectedMobileFilters, setSelectedMobileFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [weightRange, setWeightRange] = useState<[number, number]>([0, 50]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Dynamic items per page based on screen size
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280 ? 15 : 12; // Desktop: 5x3=15, Mobile: 3x4=12
    }
    return 15;
  };
  
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  // Update items per page on window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const newItemsPerPage = getItemsPerPage();
        if (newItemsPerPage !== itemsPerPage) {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1); // Reset to first page when changing layout
        }
      };
      
      // Set initial value
      setItemsPerPage(getItemsPerPage());
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [itemsPerPage]);

  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Filter and sort products based on current filters
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Apply search filter (from advanced search)
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.material?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply search filter (from mobile filters)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply advanced material filters
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(product => {
        const productMaterial = product.material?.toLowerCase() || '';
        const productMetalType = product.metalType?.toLowerCase() || '';
        return selectedMaterials.some(mat => 
          productMaterial.includes(mat.toLowerCase()) || 
          productMetalType.includes(mat.toLowerCase())
        );
      });
    }

    // Apply price range filter (advanced)
    if (priceRange[0] > 0 || priceRange[1] < 200000) {
      filtered = filtered.filter(product => {
        const price = selectedCurrency === 'INR' ? parseFloat(product.priceInr) : parseFloat(product.priceBhd);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Apply weight range filter (advanced)
    if (weightRange[0] > 0 || weightRange[1] < 50) {
      filtered = filtered.filter(product => {
        const weight = parseFloat(product.grossWeight || '0');
        return weight >= weightRange[0] && weight <= weightRange[1];
      });
    }

    // Apply availability filter
    if (availabilityFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock > 0);
    } else if (availabilityFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    // Apply category filter from URL parameter or mobile nav
    if (filters.category && filters.category !== 'ALL_CATEGORIES') {
      // Map display category names to database category names (case-insensitive)
      const categoryMapping: { [key: string]: string } = {
        'rings': 'rings',
        'necklaces': 'necklaces', 
        'pendants': 'pendants',
        'earrings': 'earrings',
        'bracelets': 'bracelets',
        'bangles': 'bangles',
        'watches': 'watches',
        'mens_jewellery': 'mens_jewellery',
        'mens': 'mens_jewellery',
        'children_jewellery': 'children_jewellery',
        'children': 'children_jewellery',
        'materials': 'materials',
        'collections': 'collections',
        'custom_jewellery': 'custom_jewellery',
        'custom': 'custom_jewellery',
        'new_arrivals': 'new_arrivals',
        'new-arrivals': 'new_arrivals',
        'gold_coins': 'gold_coins',
        'mangalsutra': 'mangalsutra',
        'nose jewellery': 'nose jewellery',
        'anklets & toe rings': 'anklets & toe rings',
        'anklets': 'anklets & toe rings'
      };
      
      const dbCategory = categoryMapping[filters.category.toLowerCase()] || filters.category.toLowerCase();
      
      // Filter by main category (case-insensitive)
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === dbCategory.toLowerCase()
      );
    }

    // Apply mobile filters
    if (selectedMobileFilters.length > 0) {
      filtered = filtered.filter(product => {
        // Check material filters
        const materialFilters = selectedMobileFilters.filter(f => 
          ['Diamond', 'Gold', 'Gemstone', 'Uncut Diamond', 'Platinum', 'Silver', 'Gold Coins', 'Pearl'].includes(f)
        );
        if (materialFilters.length > 0) {
          const hasMatchingMaterial = materialFilters.some(mat => {
            const productMaterial = product.material?.toLowerCase() || '';
            const productCategory = product.category?.toLowerCase() || '';
            const materialLower = mat.toLowerCase();
            
            // Map filter to product material/category
            if (materialLower === 'gold' && (productMaterial.includes('gold') || productCategory.includes('gold'))) return true;
            if (materialLower === 'silver' && (productMaterial.includes('silver') || productCategory.includes('silver'))) return true;
            if (materialLower === 'diamond' && (productMaterial.includes('diamond') || productCategory.includes('diamond'))) return true;
            if (materialLower === 'platinum' && (productMaterial.includes('platinum') || productCategory.includes('platinum'))) return true;
            if (materialLower === 'pearl' && (productMaterial.includes('pearl') || productCategory.includes('pearl'))) return true;
            if (materialLower === 'gemstone' && (productMaterial.includes('gemstone') || productCategory.includes('gemstone'))) return true;
            
            return productMaterial.includes(materialLower) || productCategory.includes(materialLower);
          });
          if (!hasMatchingMaterial) return false;
        }

        // Check price range filters (INR and BHD)
        const priceFilters = selectedMobileFilters.filter(f => f.includes('₹') || f.includes('BD'));
        if (priceFilters.length > 0) {
          const priceInr = parseFloat(product.priceInr);
          const priceBhd = parseFloat(product.priceBhd);
          const hasMatchingPrice = priceFilters.some(range => {
            // INR ranges
            if (range === '₹5000 - ₹10000') return priceInr >= 5000 && priceInr <= 10000;
            if (range === '₹10000 - ₹20000') return priceInr >= 10000 && priceInr <= 20000;
            if (range === '₹20000 - ₹50000') return priceInr >= 20000 && priceInr <= 50000;
            if (range === '₹50000 - ₹100000') return priceInr >= 50000 && priceInr <= 100000;
            if (range === '₹100000+') return priceInr >= 100000;
            // BHD ranges
            if (range === 'BD 10 - BD 25') return priceBhd >= 10 && priceBhd <= 25;
            if (range === 'BD 25 - BD 50') return priceBhd >= 25 && priceBhd <= 50;
            if (range === 'BD 50 - BD 125') return priceBhd >= 50 && priceBhd <= 125;
            if (range === 'BD 125 - BD 250') return priceBhd >= 125 && priceBhd <= 250;
            if (range === 'BD 250+') return priceBhd >= 250;
            return false;
          });
          if (!hasMatchingPrice) return false;
        }

        // Check weight filters
        const weightFilters = selectedMobileFilters.filter(f => f.includes('g'));
        if (weightFilters.length > 0) {
          const weight = parseFloat(product.grossWeight || '0');
          const hasMatchingWeight = weightFilters.some(range => {
            if (range === 'Under 5g') return weight < 5;
            if (range === '5g - 10g') return weight >= 5 && weight <= 10;
            if (range === '10g - 20g') return weight >= 10 && weight <= 20;
            if (range === 'Above 20g') return weight > 20;
            return false;
          });
          if (!hasMatchingWeight) return false;
        }

        return true;
      });
    }

    // Category filter already applied above with proper mapping

    // Apply material filter
    if (filters.material) {
      filtered = filtered.filter(product => {
        if (filters.material === 'GOLD') {
          return product.material?.includes('GOLD');
        } else if (filters.material === 'GOLD_18K') {
          return product.material === 'GOLD_18K';
        } else if (filters.material === 'GOLD_22K') {
          return product.material === 'GOLD_22K';
        } else if (filters.material === 'SILVER') {
          return product.material?.includes('SILVER');
        } else if (filters.material === 'SILVER_925') {
          return product.material === 'SILVER_925';
        } else if (filters.material === 'DIAMOND') {
          return product.material?.includes('DIAMOND');
        } else if (filters.material === 'GOLD_PLATED_SILVER') {
          return product.material === 'GOLD_PLATED_SILVER';
        } else if (filters.material === 'PLATINUM') {
          return product.material === 'PLATINUM';
        } else if (filters.material === 'PEARL') {
          return product.material === 'PEARL';
        }
        return product.material === filters.material;
      });
    }

    // Apply price range filter
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filtered = filtered.filter(product => {
        const price = selectedCurrency === 'INR' ? parseFloat(product.priceInr) : parseFloat(product.priceBhd);
        const min = filters.priceMin || 0;
        const max = filters.priceMax || Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Apply advanced filters
    if (filters.featured) {
      // Use stock and name as criteria for featured items
      filtered = filtered.filter(product => product.stock > 0 || product.name.toLowerCase().includes('featured'));
    }

    if (filters.discount) {
      // Filter for items that might be on sale (can be enhanced with actual discount field)
      filtered = filtered.filter(product => product.name.toLowerCase().includes('sale') || product.name.toLowerCase().includes('discount'));
    }

    if (filters.premium) {
      // Filter for premium items based on price threshold
      filtered = filtered.filter(product => parseFloat(selectedCurrency === 'INR' ? product.priceInr : product.priceBhd) > 50000);
    }

    if (filters.newArrivals) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(product => 
        product.createdAt && new Date(product.createdAt) > thirtyDaysAgo
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return parseFloat(selectedCurrency === 'INR' ? a.priceInr : a.priceBhd) -
              parseFloat(selectedCurrency === 'INR' ? b.priceInr : b.priceBhd);
          case 'price_desc':
            return parseFloat(selectedCurrency === 'INR' ? b.priceInr : b.priceBhd) -
              parseFloat(selectedCurrency === 'INR' ? a.priceInr : a.priceBhd);
          case 'newest':
            return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'popular':
            return b.name.localeCompare(a.name); // Can be enhanced with actual popularity metrics
          case 'rating':
            return a.name.localeCompare(b.name); // Can be enhanced with actual rating logic
          case 'weight_asc':
            return parseFloat(a.grossWeight || '0') - parseFloat(b.grossWeight || '0');
          case 'weight_desc':
            return parseFloat(b.grossWeight || '0') - parseFloat(a.grossWeight || '0');
          case 'stock':
            return (b.stock || 0) - (a.stock || 0);
          default:
            return 0;
        }
      });
    }

    // Apply advanced sorting
    if (sortBy && sortBy !== 'latest') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return parseFloat(selectedCurrency === 'INR' ? a.priceInr : a.priceBhd) -
              parseFloat(selectedCurrency === 'INR' ? b.priceInr : b.priceBhd);
          case 'price_desc':
            return parseFloat(selectedCurrency === 'INR' ? b.priceInr : b.priceBhd) -
              parseFloat(selectedCurrency === 'INR' ? a.priceInr : a.priceBhd);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'weight_asc':
            return parseFloat(a.grossWeight || '0') - parseFloat(b.grossWeight || '0');
          case 'weight_desc':
            return parseFloat(b.grossWeight || '0') - parseFloat(a.grossWeight || '0');
          case 'stock_high':
            return b.stock - a.stock;
          case 'stock_low':
            return a.stock - b.stock;
          case 'popularity':
            // Sort by stock as proxy for popularity
            return (b.stock * 0.7 + b.name.length * 0.3) - (a.stock * 0.7 + a.name.length * 0.3);
          case 'discount':
            return a.name.localeCompare(b.name);
          case 'featured':
            return b.stock - a.stock;
          case 'rating':
            return a.name.localeCompare(b.name);
          case 'newest':
            return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
          case 'oldest':
            return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
          case 'latest':
          default:
            return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        }
      });
    }

    return filtered;
  }, [allProducts, filters, selectedCurrency, sortBy, selectedMobileFilters, searchQuery, priceRange, weightRange, selectedMaterials, availabilityFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const getCollectionTitle = () => {
    switch (material) {
      case 'GOLD':
        return 'Gold Collection';
      case 'SILVER':
        return 'Silver Collection';
      case 'DIAMOND':
        return 'Diamond Collection';
      default:
        return 'All Collections';
    }
  };

  const getCollectionIcon = () => {
    switch (material) {
      case 'GOLD':
        return Crown;
      case 'SILVER':
        return Star;
      case 'DIAMOND':
        return Gem;
      default:
        return Crown;
    }
  };

  const IconComponent = getCollectionIcon();

  return (
    <div className="min-h-screen" data-testid="page-collections" style={{ background: 'linear-gradient(135deg, #fdfbf7 0%, #fff9e6 100%)' }}>
      <Header
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      {/* Collection Header */}
      <section className="py-8" style={{ background: 'linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <IconComponent className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
              <h1 className="text-3xl md:text-5xl font-bold" style={{ color: '#8b4513' }}>
                {getCollectionTitle()}
              </h1>
              <IconComponent className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
            </div>
            <p className="text-xl text-black mb-6">
              Explore our complete {material?.toLowerCase()} jewelry collection
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Filters and Search Section - Desktop */}
      <section className="py-4 bg-gray-50 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 items-center justify-between mb-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search jewelry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name: A to Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z to A</SelectItem>
                  <SelectItem value="weight_asc">Weight: Light to Heavy</SelectItem>
                  <SelectItem value="weight_desc">Weight: Heavy to Light</SelectItem>
                  <SelectItem value="stock_high">High Stock First</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Button */}
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Advanced Filters
                    {(selectedMaterials.length > 0 || priceRange[0] > 0 || priceRange[1] < 200000 || weightRange[0] > 0 || weightRange[1] < 50 || availabilityFilter !== 'all') && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedMaterials.length + 
                         (priceRange[0] > 0 || priceRange[1] < 200000 ? 1 : 0) + 
                         (weightRange[0] > 0 || weightRange[1] < 50 ? 1 : 0) + 
                         (availabilityFilter !== 'all' ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-96 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-6">
                    {/* Material Filter */}
                    <div>
                      <h3 className="font-medium mb-3">Material</h3>
                      <div className="space-y-2">
                        {['Gold', 'Silver', 'Diamond', 'Platinum', 'Pearl', 'Gemstone'].map((material) => (
                          <div key={material} className="flex items-center space-x-2">
                            <Checkbox
                              id={material}
                              checked={selectedMaterials.includes(material)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMaterials([...selectedMaterials, material]);
                                } else {
                                  setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                                }
                              }}
                            />
                            <label htmlFor={material} className="text-sm">{material}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-3">
                        Price Range ({selectedCurrency === 'INR' ? '₹' : 'BHD'})
                      </h3>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          max={200000}
                          min={0}
                          step={1000}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{selectedCurrency === 'INR' ? '₹' : 'BHD'}{priceRange[0].toLocaleString()}</span>
                          <span>{selectedCurrency === 'INR' ? '₹' : 'BHD'}{priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Weight Range */}
                    <div>
                      <h3 className="font-medium mb-3">Weight Range (grams)</h3>
                      <div className="px-2">
                        <Slider
                          value={weightRange}
                          onValueChange={(value) => setWeightRange(value as [number, number])}
                          max={50}
                          min={0}
                          step={0.5}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{weightRange[0]}g</span>
                          <span>{weightRange[1]}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <h3 className="font-medium mb-3">Availability</h3>
                      <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="in-stock">In Stock Only</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMaterials([]);
                          setPriceRange([0, 200000]);
                          setWeightRange([0, 50]);
                          setAvailabilityFilter('all');
                          setSearchQuery('');
                        }}
                        className="w-full"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-0.5 sm:px-4">
          <div className="w-full">
            {/* Products Section */}
            <div>
              {isLoading ? (
                <div className="grid grid-cols-3 gap-0.5 sm:gap-2 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6 items-start">
                  {[...Array(itemsPerPage)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                      <div className="h-64 bg-gray-300"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-300 mb-2"></div>
                        <div className="h-4 bg-gray-300 mb-2 w-3/4"></div>
                        <div className="h-6 bg-gray-300"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Active Filters Display */}
                  {selectedMobileFilters.length > 0 && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-rose-600" />
                          <span className="text-sm font-medium text-rose-700">Active Filters:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedMobileFilters.map((filter, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-rose-100 text-rose-700 border-rose-300">
                                {filter}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedMobileFilters([]);
                            setCurrentPage(1);
                          }}
                          className="text-rose-600 hover:text-rose-700 text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                      {selectedMobileFilters.length > 0 && (
                        <span className="text-rose-600 font-medium"> (filtered)</span>
                      )}
                    </p>
                    <p className="text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6 items-start" data-testid="grid-products">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={selectedCurrency}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2"
                      >
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-10 h-10"
                            style={currentPage === page ? {
                              background: 'linear-gradient(135deg, #881337 0%, #7f1d1d 100%)',
                              color: 'white'
                            } : {}}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2"
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12" data-testid="empty-products">
                      <div className="text-6xl mb-4">💍</div>
                      <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your filters to see more results</p>
                      <Button
                        onClick={() => {
                          setFilters({ material });
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onCategorySelect={(category) => {
          setFilters({ ...filters, category });
          setCurrentPage(1);
        }}
        onSortChange={(sort) => {
          setSortBy(sort);
          setCurrentPage(1);
        }}
        onFilterChange={(selectedFilters) => {
          setSelectedMobileFilters(selectedFilters);
          setCurrentPage(1);
        }}
        activeFilters={selectedMobileFilters.length + Object.keys(filters).filter(key => {
          const value = filters[key as keyof IProductFilters];
          return value !== undefined && value !== '' && value !== 'ALL_CATEGORIES' && 
                 value !== 'ALL_MATERIALS' && value !== 'DEFAULT_SORT';
        }).length}
        sortBy={sortBy}
        currentMainCategory={category}
      />

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}