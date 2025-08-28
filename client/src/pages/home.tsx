import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/product-card';
import ProductFilters from '@/components/product-filters';
import WhatsAppFloat from '@/components/whatsapp-float';
import { Button } from '@/components/ui/button';
import { Product, HomeSection, HomeSectionItem } from '@shared/schema';
import { Currency } from '@/lib/currency';
import { ProductFilters as IProductFilters } from '@shared/cart-schema';
import { ArrowRight, Star, Sparkles, Crown, Gem, Heart, Watch, Users, Baby, Palette, Wrench } from "lucide-react";
import ringsImage from '@assets/rings_luxury.png';

interface HomeSectionWithItems extends HomeSection {
  items: HomeSectionItemWithProduct[];
}

interface HomeSectionItemWithProduct extends HomeSectionItem {
  product: Product;
}
import pendantsImage from '@assets/pendants_luxury.png';
import earringsImage from '@assets/earrings_luxury.png';
import braceletsImage from '@assets/bracelets_luxury.png';
import necklacesImage from '@assets/necklaces_luxury_new.png';
import chainsImage from '@assets/chains_luxury.png';
import banglesImage from '@assets/bangles_luxury.png';
import watchesImage from '@assets/watches_luxury.png';
import mensJewelryImage from '@assets/mens_jewelry_luxury.png';
import childrenJewelryImage from '@assets/children_jewelry_luxury.png';
import customJewelryImage from '@assets/custom_jewelry_luxury.png';
import collectionsImage from '@assets/collections_luxury.png';
import goldCollectionImage from '@assets/gold_1756147150804.png';
import silverCollectionImage from '@assets/silver_1756147563831.png';
import diamondCollectionImage from '@assets/diamond_1756147563832.png';
import mangalsutraImage from '@assets/mangalsutra_hero.png';
import noseJewelryImage from '@assets/nose_jewelry_hero.png';
import ankletsImage from '@assets/anklets_hero.png';
import broochesImage from '@assets/brooches_hero.png';
import bridalCollectionsImage from '@assets/bridal_hero.png';

export default function Home() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BHD');

  // Handle "View All" button clicks - navigate to collections page
  const handleViewAllClick = (material: string) => {
    const materialPath = material.toLowerCase();
    window.location.href = `/collections/${materialPath}`;
  };

  // Category carousel data
  const categories = [
    { name: 'Rings', image: ringsImage, key: 'rings' },
    { name: 'Earrings', image: earringsImage, key: 'earrings' },
    { name: 'Pendants', image: pendantsImage, key: 'pendants' },
    { name: 'Necklaces', image: necklacesImage, key: 'necklaces' },
    { name: 'Bangles & Bracelets', image: banglesImage, key: 'bangles' },
    { name: 'Chains', image: chainsImage, key: 'chains' },
    { name: 'Nosepins', image: noseJewelryImage, key: 'nose-jewelry' },
    { name: 'Bracelets', image: braceletsImage, key: 'bracelets' },
    { name: 'Watches', image: watchesImage, key: 'watches' },
    { name: "Men's Jewelry", image: mensJewelryImage, key: 'mens' },
    { name: "Children's Jewelry", image: childrenJewelryImage, key: 'children' },
    { name: 'Custom Jewelry', image: customJewelryImage, key: 'custom' },
    { name: 'Collections', image: collectionsImage, key: 'collections' },
    { name: 'Gold Collection', image: goldCollectionImage, key: 'gold' },
    { name: 'Silver Collection', image: silverCollectionImage, key: 'silver' },
    { name: 'Diamond Collection', image: diamondCollectionImage, key: 'diamond' },
    { name: 'Mangalsutra', image: mangalsutraImage, key: 'mangalsutra' },
    { name: 'Anklets & Toe Rings', image: ankletsImage, key: 'anklets' },
    { name: 'Brooches & Pins', image: broochesImage, key: 'brooches' },
    { name: 'Bridal Collections', image: bridalCollectionsImage, key: 'bridal-collections' }
  ];


  // Fetch all products for display
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch custom home sections
  const { data: homeSections = [] } = useQuery<HomeSectionWithItems[]>({
    queryKey: ['/api/home-sections/public'],
    queryFn: async () => {
      const response = await fetch('/api/home-sections/public');
      if (!response.ok) throw new Error('Failed to fetch home sections');
      const data = await response.json();
      return data;
    },
  });

  // Simple filtering for home page (not used directly but keeps type consistency)
  const filteredProducts = useMemo(() => {
    return allProducts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }, [allProducts]);

  // Category counts for display
  const getCategoryCount = (category: string) => {
    return allProducts.filter(product => {
      // Don't exclude new arrivals - they should be counted in their respective categories too
      // Map display category names to database category names (handle both cases)
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
        'anklets': 'anklets & toe rings' // Handle compound category names
      };
      const mappedCategory = categoryMapping[category.toLowerCase()] || category.toLowerCase();
      return product.category.toLowerCase() === mappedCategory.toLowerCase();
    }).length;
  };

  const getMaterialCount = (material: string) => {
    return allProducts.filter(product => {
      // Don't exclude new arrivals - they should be counted in their material categories too
      // Use metalType field for broad material categorization instead of material field
      return product.metalType === material;
    }).length;
  };

  // Material-based collections
  const goldProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'GOLD' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  const silverProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'SILVER' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  const diamondProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'DIAMOND' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  // Platinum Products
  const platinumProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'PLATINUM' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  // Gemstone Products  
  const gemstoneProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'GEMSTONE' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  // Pearl Products
  const pearlProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'PEARL' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  // Gold Plated Silver Products
  const goldPlatedSilverProducts = useMemo(() => 
    allProducts.filter(product => 
      product.material?.includes('GOLD_PLATED_SILVER') && !product.isNewArrival
    ).slice(0, 8), 
    [allProducts]
  );

  // Other Products
  const otherProducts = useMemo(() => 
    allProducts.filter(product => product.metalType === 'OTHER' && !product.isNewArrival).slice(0, 8), 
    [allProducts]
  );

  // New Arrivals - Products specifically marked as new arrivals
  const newArrivalProducts = useMemo(() => {    
    return allProducts
      .filter(product => product.isNewArrival) // Only products explicitly marked as new arrivals
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 9);
  }, [allProducts]);

  // Layout classes for home sections
  const getLayoutClasses = (layoutType: string, itemCount: number) => {
    switch (layoutType) {
      case 'featured':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'mixed':
        return 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="min-h-screen" data-testid="page-home" style={{ background: 'linear-gradient(135deg, #fefefe 0%, #faf9f6 100%)' }}>
      <Header
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      {/* 1. Explore Our Collections - New Carousel Design */}
      <section className="pt-6 pb-8" data-testid="section-categories" style={{ background: 'linear-gradient(135deg, #fefdfb 0%, #fef9f4 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-2xl md:text-4xl font-bold text-black">Explore Our Collections</h2>
          </div>
          
          {/* Category Carousel */}
          <div className="relative">
            
            {/* Category Items Container */}
            <div 
              id="category-carousel"
              className="flex overflow-x-auto scrollbar-hide gap-4 px-2 py-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category, index) => (
                <div 
                  key={category.key}
                  className="flex-shrink-0 cursor-pointer hover:transform hover:scale-105 transition-transform duration-200"
                  onClick={() => handleViewAllClick(category.key)}
                  data-testid={`category-card-${category.key}`}
                >
                  <div className="flex flex-col items-center">
                    {/* Category Image */}
                    <div 
                      className="w-24 h-24 md:w-32 md:h-32 rounded-lg shadow-lg overflow-hidden mb-3"
                      style={{
                        backgroundImage: `url(${category.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    
                    {/* Category Name */}
                    <h3 
                      className="text-sm md:text-base font-semibold text-center max-w-[100px] leading-tight" 
                      style={{ color: '#8b4513' }}
                    >
                      {category.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Custom Admin Sections */}
      {homeSections.length > 0 && homeSections.map((section) => {
        if (section.items.length === 0) return null;
        
        return (
          <section 
            key={section.id} 
            className="py-8" 
            data-testid={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            style={{ 
              background: section.backgroundColor || 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)' 
            }}
          >
            <div className="container mx-auto px-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-6">
                  <Star className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                  <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>
                    {section.title}
                  </h2>
                  <Star className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
                </div>
                {section.description && (
                  <p className="text-sm sm:text-xl text-black">{section.description}</p>
                )}
              </div>
              <div className={`grid gap-3 md:gap-6 mb-8 ${getLayoutClasses(section.layoutType, section.items.length)}`}>
                {section.items.map((item) => (
                  <div key={item.id} className={getSizeClasses(item.size || 'normal')}>
                    <ProductCard
                      product={item.product}
                      currency={selectedCurrency}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button 
                  variant="outline" 
                  className="border-2 px-8 py-3 text-lg" 
                  style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                  onClick={() => window.location.href = '/collections'}
                >
                  View All <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        );
      })}

      {/* New Arrivals */}
      {newArrivalProducts.length > 0 && (
        <section className="py-8" data-testid="section-new-arrivals" style={{ background: 'linear-gradient(135deg, #fff8e1 0%, #fef3c7 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>New Arrivals</h2>
                <Heart className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Latest additions to our exclusive collection</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {newArrivalProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?category=new-arrivals'}
              >
                View All New Arrivals <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Gold Plated Silver Collection */}
      {goldPlatedSilverProducts.length > 0 && (
        <section className="py-8" data-testid="section-gold-plated-silver-collection" style={{ background: '#fff8e1' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-6">
                <Crown className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Gold Plated Silver Collection</h2>
                <Crown className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Affordable luxury with gold plated silver</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {goldPlatedSilverProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=gold-plated-silver'}
              >
                View All Gold Plated Silver <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Material-Based Sections - Always show these regardless of custom sections */}
      
      {/* Gold Collection */}
      {goldProducts.length > 0 && (
        <section className="py-8" data-testid="section-gold-collection" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Crown className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Gold Collection</h2>
                <Crown className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Exquisite gold jewelry crafted to perfection</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {goldProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=gold'}
              >
                View All Gold <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Silver Collection */}
      {silverProducts.length > 0 && (
        <section className="py-8" data-testid="section-silver-collection" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Crown className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Silver Collection</h2>
                <Crown className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Elegant silver jewelry for every occasion</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {silverProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=silver'}
              >
                View All Silver <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Diamond Collection */}
      {diamondProducts.length > 0 && (
        <section className="py-8" data-testid="section-diamond-collection" style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f1f5f9 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Gem className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Diamond Collection</h2>
                <Gem className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Brilliant diamonds for life's special moments</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {diamondProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=diamond'}
              >
                View All Diamonds <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Platinum Collection */}
      {platinumProducts.length > 0 && (
        <section className="py-8" data-testid="section-platinum-collection" style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Crown className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Platinum Collection</h2>
                <Crown className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Premium platinum jewelry for discerning taste</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {platinumProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=platinum'}
              >
                View All Platinum <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Gemstone Collection */}
      {gemstoneProducts.length > 0 && (
        <section className="py-8" data-testid="section-gemstone-collection" style={{ background: 'linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Gem className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Gemstone Collection</h2>
                <Gem className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Colorful gemstones for vibrant elegance</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {gemstoneProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=gemstone'}
              >
                View All Gemstones <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Pearl Collection */}
      {pearlProducts.length > 0 && (
        <section className="py-8" data-testid="section-pearl-collection" style={{ background: 'linear-gradient(135deg, #fefcf0 0%, #fef3c7 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Pearl Collection</h2>
                <Sparkles className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Timeless pearls for classic beauty</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {pearlProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=pearl'}
              >
                View All Pearls <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}


      {/* Other Materials Collection */}
      {otherProducts.length > 0 && (
        <section className="py-8" data-testid="section-other-collection" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Palette className="h-8 w-8 mr-4" style={{ color: '#b8860b' }} />
                <h2 className="text-lg sm:text-2xl md:text-4xl font-bold" style={{ color: '#8b4513' }}>Other Materials Collection</h2>
                <Palette className="h-8 w-8 ml-4" style={{ color: '#b8860b' }} />
              </div>
              <p className="text-sm sm:text-xl text-black">Unique materials for distinctive styles</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
              {otherProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={selectedCurrency}
                  showActions={true}
                />
              ))}
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-2 px-8 py-3 text-lg" 
                style={{ borderColor: '#b8860b', color: '#8b4513' }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b8860b'; e.currentTarget.style.color = 'white'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b4513'; }}
                onClick={() => window.location.href = '/collections?material=other'}
              >
                View All <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}