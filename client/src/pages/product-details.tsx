import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Share2, Heart, Ruler, Weight, Package, Star, Info } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import WhatsAppFloat from '@/components/whatsapp-float';
import { Product, JEWELRY_CATEGORIES } from '@shared/schema';
import { Currency } from '@/lib/currency';
import { useCart } from '@/lib/cart';
import { sendProductWhatsAppMessage } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch custom pricing from home sections
  const { data: homeSections } = useQuery({
    queryKey: ['/api/home-sections/public'],
    queryFn: async () => {
      const response = await fetch('/api/home-sections/public');
      if (!response.ok) throw new Error('Failed to fetch home sections');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-300 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Check for custom display pricing from home sections
  const getCustomPrice = () => {
    if (homeSections && product) {
      for (const section of homeSections) {
        const item = section.items?.find((item: any) => item.productId === product.id);
        if (item) {
          if (selectedCurrency === 'INR') {
            return item.displayPriceInr ? parseFloat(item.displayPriceInr) : 
                   item.displayPrice ? parseFloat(item.displayPrice) : null;
          } else {
            return item.displayPriceBhd ? parseFloat(item.displayPriceBhd) : null;
          }
        }
      }
    }
    return null;
  };

  const customPrice = getCustomPrice();
  const price = customPrice !== null ? customPrice : 
    (selectedCurrency === 'INR' ? parseFloat(product.priceInr) : parseFloat(product.priceBhd));
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : 'BD';
  const category = JEWELRY_CATEGORIES[product.category as keyof typeof JEWELRY_CATEGORIES];
  const images = product.images || ['/placeholder-jewelry.jpg'];

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWhatsAppEnquiry = () => {
    const priceText = `${currencySymbol} ${price.toFixed(2)}`;
    sendProductWhatsAppMessage(product.name, priceText, selectedCurrency);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard!",
      });
    }
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-product-details">
      <Header selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden relative group">
              <img
                src={images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="img-product-main"
              />
              
              {/* Image Navigation Arrows - Only show if multiple images */}
              {images.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <Button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    data-testid="button-previous-image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  {/* Right Arrow */}
                  <Button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-all">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
              
              {/* WhatsApp Enquiry Button on Main Image */}
              <Button
                className="absolute top-4 right-4 text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: '#25D366' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#128C7E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
                onClick={() => {
                  const message = `Hi! I'm interested in this beautiful piece: *${product.name}*\n\nPrice: ${selectedCurrency === 'INR' ? '₹' + product.priceInr : 'BD ' + product.priceBhd}\nCategory: ${product.category.replace(/_/g, ' ')}\n\nCould you provide more details about this jewelry piece?`;
                  const whatsappUrl = `https://wa.me/919942061393?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                data-testid="button-whatsapp-main-image"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
              </Button>
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    <button
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex ? 'border-yellow-600' : 'border-gray-200'
                      }`}
                      data-testid={`button-image-${index}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    {/* WhatsApp Button on Each Thumbnail */}
                    <Button
                      size="sm"
                      className="absolute -top-2 -right-2 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                      style={{ backgroundColor: '#25D366' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#128C7E'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
                      onClick={() => {
                        const message = `Hi! I'd like to inquire about this specific view of *${product.name}* (Image ${index + 1})\n\nPrice: ${selectedCurrency === 'INR' ? '₹' + product.priceInr : 'BD ' + product.priceBhd}\nCategory: ${product.category.replace(/_/g, ' ')}\n\nCould you tell me more about this angle/detail of the jewelry?`;
                        const whatsappUrl = `https://wa.me/919942061393?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      data-testid={`button-whatsapp-thumbnail-${index}`}
                    >
                      <svg 
                        className="w-3 h-3" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-black" data-testid="text-product-name">
                  {product.name}
                </h1>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-wishlist">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {category && (
                <Badge variant="secondary" className="mb-4" data-testid="badge-category">
                  {category.name}
                </Badge>
              )}
              
              <div className="text-4xl font-bold text-black mb-2" data-testid="text-product-price">
                {currencySymbol} {price.toFixed(2)}
              </div>
              
              {product.stock > 0 ? (
                <Badge className="bg-green-100 text-green-800" data-testid="badge-in-stock">
                  In Stock ({product.stock} available)
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-out-of-stock">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Enhanced Product Description */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-black mb-3">Product Description</h3>
                <p className="text-gray-600 leading-relaxed" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>
              


              {/* Detailed Product Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-black mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-600" />
                    Material Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium">{product.material}</span>
                    </div>
                    {product.purity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purity:</span>
                        <span className="font-medium">{product.purity}</span>
                      </div>
                    )}
                    {product.grossWeight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Weight:</span>
                        <span className="font-medium">{product.grossWeight}g</span>
                      </div>
                    )}
                    {product.netWeight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Weight:</span>
                        <span className="font-medium">{product.netWeight}g</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-black mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-green-600" />
                    Product Features
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Code:</span>
                      <span className="font-medium" data-testid="text-product-code">{product.productCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Suitable For:</span>
                      <span className="font-medium">{product.gender || 'Unisex'}</span>
                    </div>
                    {product.size && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{product.size}</span>
                      </div>
                    )}
                    {product.occasion && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Perfect For:</span>
                        <span className="font-medium">{product.occasion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Care Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-black mb-3 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-blue-600" />
                  Care Instructions
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <strong>Daily Care:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Store in a dry, clean place</li>
                      <li>• Avoid contact with perfumes and cosmetics</li>
                      <li>• Remove during swimming or bathing</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Cleaning:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Clean gently with soft brush</li>
                      <li>• Use mild soap and warm water</li>
                      <li>• Professional cleaning recommended annually</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Ruler className="h-5 w-5 mr-2" />
                  Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.material && (
                    <div>
                      <span className="text-gray-600">Material:</span>
                      <span className="ml-2 font-medium">{product.material}</span>
                    </div>
                  )}
                  {product.grossWeight && (
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-600">Gross Weight:</span>
                      <span className="ml-2 font-medium">{product.grossWeight}g</span>
                    </div>
                  )}
                  {product.netWeight && (
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-600">Net Weight:</span>
                      <span className="ml-2 font-medium">{product.netWeight}g</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{category?.name || product.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* WhatsApp Enquiry Button - Above Add to Cart */}
              <Button
                onClick={handleWhatsAppEnquiry}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                data-testid="button-whatsapp-enquiry"
              >
                <svg 
                  className="w-5 h-5 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
                WhatsApp Enquiry
              </Button>
              
              {/* Add to Cart Button */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 text-sm text-gray-600">

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-black mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-600" />
                  Shipping Information
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>India Shipping:</span>
                    <span className="font-medium">₹150 - ₹300</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bahrain Shipping:</span>
                    <span className="font-medium">BD 2 - BD 5</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Delivery time: 3-7 business days
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                <span>Handcrafted with love</span>
              </div>
            </div>
          </div>
        </div>


        {/* Back Button */}
        <div className="mt-12">
          <Link href="/">
            <Button variant="outline" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}