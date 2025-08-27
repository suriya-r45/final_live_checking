import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/header';
import { 
  QrCode, 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Share2,
  Weight,
  Gem,
  TrendingUp,
  ShoppingCart,
  Star
} from 'lucide-react';
import { Currency } from '@/lib/currency';

interface QRProductData {
  productCode: string;
  productName: string;
  purity: string;
  grossWeight: string;
  netWeight: string;
  stone: string;
  goldRate: string;
  approxPrice: string;
}

export default function QRScanResult() {
  const [location, setLocation] = useLocation();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [productData, setProductData] = useState<QRProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse QR data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const qrData = urlParams.get('data');
    
    if (qrData) {
      parseQRData(qrData);
    } else {
      // Try to parse from hash or direct text
      const hash = window.location.hash.substring(1);
      if (hash) {
        parseQRData(decodeURIComponent(hash));
      }
    }
    setLoading(false);
  }, []);

  const parseQRData = (data: string) => {
    try {
      // Parse the QR data format: "Product Code: XXX\nProduct Name: XXX\n..."
      const lines = data.split('\n');
      const parsedData: Partial<QRProductData> = {};

      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.trim()) {
          case 'Product Code':
            parsedData.productCode = value;
            break;
          case 'Product Name':
            parsedData.productName = value;
            break;
          case 'Purity':
            parsedData.purity = value;
            break;
          case 'Gross Weight':
            parsedData.grossWeight = value;
            break;
          case 'Net Weight':
            parsedData.netWeight = value;
            break;
          case 'Stone':
            parsedData.stone = value;
            break;
          case 'Gold Rate':
            parsedData.goldRate = value;
            break;
          case 'Approx Price':
            parsedData.approxPrice = value;
            break;
        }
      });

      if (parsedData.productCode && parsedData.productName) {
        setProductData(parsedData as QRProductData);
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
    }
  };

  const handleWhatsAppInquiry = () => {
    if (!productData) return;
    
    const message = `Hi! I'm interested in this jewelry piece:

🏷️ *${productData.productName}*
📋 Product Code: ${productData.productCode}
⚖️ Weight: ${productData.grossWeight}
💎 Purity: ${productData.purity}
💰 Price: ${productData.approxPrice}

Could you please provide more details and availability?`;

    const whatsappUrl = `https://wa.me/919597201554?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (!productData) return;

    const shareData = {
      title: `${productData.productName} - Palaniappa Jewellers`,
      text: `Check out this beautiful jewelry piece: ${productData.productName} (${productData.productCode})`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <QrCode className="h-16 w-16 mx-auto text-rose-600 animate-pulse mb-4" />
          <p className="text-lg text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50">
        <Header 
          selectedCurrency={selectedCurrency} 
          onCurrencyChange={setSelectedCurrency} 
        />
        
        <div className="container mx-auto px-4 py-16 text-center">
          <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid QR Code</h1>
          <p className="text-gray-600 mb-8">
            The QR code data could not be parsed. Please try scanning again.
          </p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-gradient-to-r from-rose-800 to-red-800 hover:from-rose-900 hover:to-red-900 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50">
      <Header 
        selectedCurrency={selectedCurrency} 
        onCurrencyChange={setSelectedCurrency} 
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-rose-700 hover:text-rose-900 hover:bg-rose-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Main Product Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-rose-800 to-red-800 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                    {productData.productName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <QrCode className="h-3 w-3 mr-1" />
                      {productData.productCode}
                    </Badge>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <span className="ml-2 text-sm">Premium Quality</span>
                    </div>
                  </div>
                </div>
                <QrCode className="h-16 w-16 text-white/80" />
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Product Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
                  <div className="flex items-center mb-3">
                    <Gem className="h-6 w-6 text-yellow-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Purity</h3>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">{productData.purity}</p>
                  <p className="text-sm text-gray-600 mt-1">Gold Purity</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-3">
                    <Weight className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Gross Weight</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{productData.grossWeight}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Weight</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center mb-3">
                    <Weight className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Net Weight</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{productData.netWeight}</p>
                  <p className="text-sm text-gray-600 mt-1">Gold Weight</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center mb-3">
                    <Gem className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Stone</h3>
                  </div>
                  <p className="text-xl font-bold text-purple-700">{productData.stone}</p>
                  <p className="text-sm text-gray-600 mt-1">Stone Details</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="h-6 w-6 text-orange-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Gold Rate</h3>
                  </div>
                  <p className="text-xl font-bold text-orange-700">{productData.goldRate}</p>
                  <p className="text-sm text-gray-600 mt-1">Current Rate</p>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-xl border border-rose-200">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="h-6 w-6 text-rose-600 mr-3" />
                    <h3 className="font-semibold text-gray-800">Price</h3>
                  </div>
                  <p className="text-2xl font-bold text-rose-700">{productData.approxPrice}</p>
                  <p className="text-sm text-gray-600 mt-1">Approximate Price</p>
                </div>
              </div>

              {/* Branding and Quality Assurance */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl mb-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Palaniappa Jewellers</h3>
                  <p className="text-gray-600 mb-4">
                    Legacy of Excellence • Premium Quality • Trusted Since Generations
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <span>✓ BIS Hallmarked</span>
                    <span>✓ Quality Assured</span>
                    <span>✓ Authentic Gold</span>
                    <span>✓ Expert Craftsmanship</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleWhatsAppInquiry}
                  className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp Inquiry
                </Button>

                <Button
                  onClick={() => window.open('tel:+919597201554', '_self')}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold"
                  size="lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-rose-600 text-rose-600 hover:bg-rose-50 h-14 text-lg font-semibold"
                  size="lg"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Product
                </Button>
              </div>

              {/* Contact Information */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-2">
                  <strong>Contact:</strong> +91 95972 01554
                </p>
                <p className="text-sm text-gray-500">
                  Visit our store for exclusive collections and personalized service
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}