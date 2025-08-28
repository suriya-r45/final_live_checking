import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import Header from '@/components/header';
import ProductForm from '@/components/admin/product-form';
import BillingForm from '@/components/admin/billing-form';
import BillPreview from '@/components/admin/bill-preview';
import CategoryManagement from '@/components/admin/category-management';
import PriceManagement from '@/components/admin/price-management';
import { EstimatesList } from '@/components/admin/estimates-list';
import { HomeSectionsManagement } from '@/components/admin/home-sections-management';
import OrderTracking from '@/components/admin/order-tracking';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Bill } from '@shared/schema';
import { Currency } from '@/lib/currency';
import { Package, FileText, TrendingUp, Users, Calculator, DollarSign, Edit, QrCode, Printer, Search, CheckSquare, Square, Plus, Receipt, History, ClipboardList, Tag, BarChart3, Grid3X3 } from 'lucide-react';
import BarcodeDisplay from '@/components/barcode-display';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { isAdmin, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'products' || tabParam === 'billing' || tabParam === 'bills' || tabParam === 'estimates' || tabParam === 'categories' || tabParam === 'pricing' || tabParam === 'barcodes' || tabParam === 'home-sections' || tabParam === 'orders') {
      return tabParam;
    }
    return 'products';
  });
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Helper functions for product selection
  const handleProductSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    const productsWithQR = products.filter(p => p.productCode);
    setSelectedProducts(new Set(productsWithQR.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedProducts(new Set());
  };

  const printSelectedQRCodes = async () => {
    if (selectedProducts.size === 0) return;
    
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id) && p.productCode);
    if (selectedProductsList.length === 0) return;

    try {
      // Generate all QR codes as data URLs first (same as individual print)
      const qrDataURLs: {[key: string]: string} = {};
      
      for (const product of selectedProductsList) {
        const qrData = `🏷️ PALANIAPPA JEWELLERS
📋 Product Code: ${product.productCode}
💍 Product Name: ${product.name}
⚖️ Purity: ${product.purity || '22K'}
📊 Gross Weight: ${product.grossWeight} g
📈 Net Weight: ${product.netWeight} g
💎 Stone: ${product.stones || 'None'}
📉 Gold Rate: ${product.goldRateAtCreation ? `₹${product.goldRateAtCreation}/g` : 'N/A'}
💰 Approx Price: ₹${parseInt(product.priceInr).toLocaleString('en-IN')}

📞 Contact: +91 95972 01554
💬 WhatsApp: +91 95972 01554`;

        // Generate QR code as data URL (same method as individual print)
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M',
          scale: 4
        });
        
        qrDataURLs[product.id] = qrCodeDataURL;
      }

      // Now create the print window with pre-generated QR codes as images
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const qrCodesPerPage = 4; // 2x2 grid
        
        let barcodesHTML = '';
        for (let i = 0; i < selectedProductsList.length; i += qrCodesPerPage) {
          const pageProducts = selectedProductsList.slice(i, i + qrCodesPerPage);
          
          barcodesHTML += `
            <div style="page-break-after: ${i + qrCodesPerPage < selectedProductsList.length ? 'always' : 'auto'}; padding: 20px; min-height: 100vh; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 20px;">
          `;
          
          pageProducts.forEach((product) => {
            const productType = product.name.split(' ')[0].toUpperCase();
            barcodesHTML += `
              <div style="border: 2px solid #000; border-radius: 10px; padding: 20px; width: 320px; text-align: center; background: white; position: relative; font-family: Arial, sans-serif;">
                <div style="position: absolute; top: 8px; right: 8px; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; color: #000 !important; font-size: 12px; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">●</div>
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">PALANIAPPA JEWELLERS</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px; font-family: monospace;">${product.productCode}</div>
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>${productType}</span>
                  <span>${product.purity || '22K'}</span>
                </div>
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 12px;">Gross Weight : ${product.grossWeight} g</div>
                <div style="margin: 12px 0; display: flex; justify-content: center;">
                  <img src="${qrDataURLs[product.id]}" style="width: 120px; height: 120px;" alt="QR Code">
                </div>
                <div style="font-size: 14px; font-weight: bold; margin-top: 8px; font-family: monospace;">${product.productCode}</div>
              </div>
            `;
          });
          
          barcodesHTML += '</div>';
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Selected Product QR Codes</title>
              <style>
                @page { size: A4; margin: 0.5in; }
                body { margin: 0; padding: 0; }
              </style>
            </head>
            <body>
              ${barcodesHTML}
              <script>
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR codes for printing",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAdmin && !token) {
      window.location.href = '/login';
    }
  }, [isAdmin, token]);

  // Handle URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'products' || tabParam === 'billing' || tabParam === 'bills' || tabParam === 'estimates' || tabParam === 'categories' || tabParam === 'pricing' || tabParam === 'barcodes' || tabParam === 'home-sections' || tabParam === 'orders') {
      setActiveTab(tabParam);
    }
  }, []);

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'products' || tabParam === 'billing' || tabParam === 'bills' || tabParam === 'estimates' || tabParam === 'categories' || tabParam === 'pricing' || tabParam === 'barcodes' || tabParam === 'home-sections' || tabParam === 'orders') {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Also check when location changes (for programmatic navigation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'products' || tabParam === 'billing' || tabParam === 'bills' || tabParam === 'estimates' || tabParam === 'categories' || tabParam === 'pricing' || tabParam === 'barcodes' || tabParam === 'home-sections' || tabParam === 'orders') {
      setActiveTab(tabParam);
    }
  }, [location]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!token,
  });

  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ['/api/bills'],
    queryFn: async () => {
      const response = await fetch('/api/bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    },
    enabled: !!token,
  });

  const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.total), 0);
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 5).length;

  // WhatsApp send mutation for bills
  const sendBillToWhatsAppMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await fetch(`/api/bills/${billId}/send-whatsapp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to send bill to WhatsApp");
      }
      return response.json();
    },
    onSuccess: (data: { whatsappUrl: string; message: string }) => {
      toast({
        title: "Success",
        description: "Bill sent to WhatsApp successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      
      // Open WhatsApp URL
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send bill to WhatsApp.",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" data-testid="page-admin-dashboard" style={{ backgroundColor: '#ffffff' }}>
      <Header 
        selectedCurrency={selectedCurrency} 
        onCurrencyChange={setSelectedCurrency} 
      />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-rose-900">Admin Dashboard</h1>
          </div>
          <Button
            onClick={() => setLocation('/estimates')}
            className="bg-gradient-to-r from-rose-800 to-red-800 hover:from-rose-900 hover:to-red-900 text-white font-semibold shadow-md w-full sm:w-auto text-sm px-3 py-2"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Create Customer Estimate
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card data-testid="card-total-products" className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{totalProducts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-bills" className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Bills</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{bills.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue" className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {selectedCurrency === 'INR' ? '₹' : 'BD'} {totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-low-stock" className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{lowStockProducts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="tabs-admin">
          <div className="relative">
            {/* Mobile: Vertical scrollable tabs */}
            <div className="md:hidden">
              <div className="overflow-x-auto">
                <TabsList className="grid w-full grid-cols-9 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 shadow-md h-auto p-2 rounded-xl min-w-max">
                  <TabsTrigger value="products" data-testid="tab-products" className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-1" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="billing" data-testid="tab-billing" className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <Receipt className="h-4 w-4 mr-1" />
                    Billing
                  </TabsTrigger>
                  <TabsTrigger value="bills" data-testid="tab-bills" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <History className="h-4 w-4 mr-1" />
                    Bills History
                  </TabsTrigger>
                  <TabsTrigger value="estimates" data-testid="tab-estimates" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Estimates
                  </TabsTrigger>
                  <TabsTrigger value="categories" data-testid="tab-categories" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <Tag className="h-4 w-4 mr-1" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="barcodes" data-testid="tab-barcodes" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Codes
                  </TabsTrigger>
                  <TabsTrigger value="home-sections" data-testid="tab-home-sections" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Home Sections
                  </TabsTrigger>
                  <TabsTrigger value="orders" data-testid="tab-orders" className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 px-3 py-3 mx-1 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap">
                    <Package className="h-4 w-4 mr-1" />
                    Order Tracking
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            {/* Desktop: Original horizontal layout */}
            <TabsList className="hidden md:grid w-full grid-cols-9 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 shadow-sm h-auto p-1">
              <TabsTrigger value="products" data-testid="tab-products" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <Plus className="h-4 w-4 mr-1" />
                Products
              </TabsTrigger>
              <TabsTrigger value="billing" data-testid="tab-billing" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <Receipt className="h-4 w-4 mr-1" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="bills" data-testid="tab-bills" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <History className="h-4 w-4 mr-1" />
                Bills History
              </TabsTrigger>
              <TabsTrigger value="estimates" data-testid="tab-estimates" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <ClipboardList className="h-4 w-4 mr-1" />
                Customer Estimates
              </TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <Tag className="h-4 w-4 mr-1" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="barcodes" data-testid="tab-barcodes" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <QrCode className="h-4 w-4 mr-1" />
                QR Codes
              </TabsTrigger>
              <TabsTrigger value="home-sections" data-testid="tab-home-sections" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <Grid3X3 className="h-4 w-4 mr-1" />
                Home Sections
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders" className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-800 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 px-1 py-2 mx-0.5 rounded-md min-h-[40px] flex items-center justify-center">
                <Package className="h-4 w-4 mr-1" />
                Order Tracking
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-6">
            <ProductForm currency={selectedCurrency} />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingForm 
              currency={selectedCurrency} 
              products={products} 
            />
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <Card data-testid="card-bills-history">
              <CardHeader>
                <CardTitle>Bills History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Bills */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by customer name, mobile number, or bill number..."
                      value={billSearchTerm}
                      onChange={(e) => setBillSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      data-testid="input-search-bills"
                    />
                  </div>
                  {bills.length === 0 ? (
                    <p className="text-gray-500 text-center py-8" data-testid="message-no-bills">
                      No bills generated yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bill No.</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Currency</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bills
                            .filter(bill => {
                              if (!billSearchTerm) return true;
                              const searchLower = billSearchTerm.toLowerCase();
                              return (
                                bill.customerName.toLowerCase().includes(searchLower) ||
                                bill.customerPhone.toLowerCase().includes(searchLower) ||
                                bill.billNumber.toLowerCase().includes(searchLower)
                              );
                            })
                            .map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50" data-testid={`row-bill-${bill.id}`}>
                              <td className="px-4 py-3 text-sm font-medium text-black">{bill.billNumber}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{bill.customerName}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(bill.createdAt!).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-black">
                                {bill.currency === 'INR' ? '₹' : 'BD'} {parseFloat(bill.total).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{bill.currency}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedBill(bill)}
                                    data-testid={`button-preview-${bill.id}`}
                                  >
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Store bill data in localStorage for editing
                                      localStorage.setItem('editBill', JSON.stringify(bill));
                                      // Set active tab immediately
                                      setActiveTab('billing');
                                      // Also update URL for consistency
                                      setLocation('/admin?tab=billing');
                                      
                                      toast({
                                        title: "Bill Loaded",
                                        description: `Bill ${bill.billNumber} loaded for editing.`,
                                      });
                                    }}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    data-testid={`button-edit-${bill.id}`}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/api/bills/${bill.id}/pdf`;
                                      link.download = `${bill.customerName.replace(/\s+/g, '_')}_${bill.billNumber}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    data-testid={`button-download-${bill.id}`}
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendBillToWhatsAppMutation.mutate(bill.id)}
                                    disabled={sendBillToWhatsAppMutation.isPending}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    data-testid={`button-whatsapp-${bill.id}`}
                                  >
                                    {sendBillToWhatsAppMutation.isPending ? "Sending..." : "Send to WhatsApp"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estimates" className="space-y-6">
            <EstimatesList />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PriceManagement />
          </TabsContent>

          <TabsContent value="barcodes" className="space-y-6">
            <Card data-testid="card-barcode-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Product QR Code Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {products.length === 0 ? (
                    <div className="text-center py-8">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500" data-testid="message-no-products">
                        No products available for QR code generation.
                      </p>
                      <p className="text-sm text-gray-400">
                        Add products first to generate QR codes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-sm text-gray-600 mb-4">
                        Total Products: <span className="font-semibold">{products.length}</span> | 
                        Products with QR Codes: <span className="font-semibold">{products.filter(p => p.productCode).length}</span>
                      </div>
                      
                      {/* Search Products by Name */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search products by name..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products
                          .filter(product => 
                            product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                          )
                          .map((product) => (
                          <div key={product.id} className="bg-white border rounded-lg shadow-sm relative">
                            {/* Selection Checkbox */}
                            {product.productCode && (
                              <div className="absolute top-3 left-3 z-10">
                                <button
                                  onClick={() => handleProductSelect(product.id)}
                                  className="flex items-center justify-center w-6 h-6 border-2 border-gray-400 rounded hover:border-rose-500 transition-colors"
                                  style={{ backgroundColor: selectedProducts.has(product.id) ? '#be185d' : 'white' }}
                                >
                                  {selectedProducts.has(product.id) && (
                                    <CheckSquare className="w-4 h-4 text-white" />
                                  )}
                                </button>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start gap-3 mb-4">
                                <img
                                  src={product.images?.[0] || '/placeholder-jewelry.jpg'}
                                  alt={product.name}
                                  className="w-16 h-16 rounded-lg object-cover border"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {product.category}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    ₹{parseInt(product.priceInr).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                              
                              {product.productCode ? (
                                <div className="space-y-3">
                                  <div className="flex justify-center">
                                    <BarcodeDisplay 
                                      product={product}
                                    />
                                  </div>
                                  <p className="text-xs text-center font-mono text-gray-600">
                                    {product.productCode}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-4">
                                  <QrCode className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-xs">No QR code generated</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {products.filter(p => p.productCode).length > 0 && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={handleSelectAll}
                            className="text-sm"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleClearSelection}
                            className="text-sm"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Clear Selection
                          </Button>
                          <Button
                            onClick={printSelectedQRCodes}
                            disabled={selectedProducts.size === 0}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-sm"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Selected ({selectedProducts.size})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="home-sections" className="space-y-6">
            <HomeSectionsManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderTracking />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bill Preview Modal */}
      {selectedBill && (
        <BillPreview
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}