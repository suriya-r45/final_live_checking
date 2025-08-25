import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, ArrowLeft, Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { Product, BillItem } from '@shared/schema';
import { Currency, formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BillingFormProps {
  currency: Currency;
  products: Product[];
}

export default function BillingForm({ currency, products }: BillingFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    currency: currency,
    makingCharges: '12.0',
    gst: '3.0',
    vat: '10.0', // Bahrain VAT - 10% standard rate
    amountInr: '0.00',
    amountBhd: '0.00',
  });

  const [selectedProducts, setSelectedProducts] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBillId, setEditBillId] = useState<string | null>(null);

  // Check for edit bill data in localStorage
  useEffect(() => {
    const editBillData = localStorage.getItem('editBill');
    if (editBillData) {
      try {
        const billData = JSON.parse(editBillData);
        
        // Calculate percentage values from bill totals (convert back from calculated amounts)
        const subtotal = parseFloat(billData.subtotal || '0');
        const makingChargesAmount = parseFloat(billData.makingCharges || '0');
        const gstAmount = parseFloat(billData.gst || '0');
        const vatAmount = parseFloat(billData.vat || '0');
        
        // Calculate percentages (reverse engineering from bill amounts)
        const makingChargesPercentage = subtotal > 0 ? ((makingChargesAmount / subtotal) * 100).toFixed(1) : '12.0';
        
        // For GST/VAT, we need to calculate based on (subtotal + making charges) not just subtotal
        const taxBase = subtotal + makingChargesAmount;
        const gstPercentage = taxBase > 0 ? ((gstAmount / taxBase) * 100).toFixed(1) : '3.0';
        const vatPercentage = taxBase > 0 ? ((vatAmount / taxBase) * 100).toFixed(1) : '10.0';
        
        // Populate customer data
        setCustomerData({
          customerName: billData.customerName || '',
          customerEmail: billData.customerEmail || '',
          customerPhone: billData.customerPhone || '',
          customerAddress: billData.customerAddress || '',
          currency: billData.currency || currency,
          makingCharges: makingChargesPercentage,
          gst: gstPercentage,
          vat: vatPercentage,
          amountInr: billData.currency === 'INR' ? billData.subtotal : '0.00',
          amountBhd: billData.currency === 'BHD' ? billData.subtotal : '0.00',
        });

        // Populate selected products from bill items
        if (billData.items && Array.isArray(billData.items)) {
          const productMap = new Map<string, { product: Product; quantity: number }>();
          
          billData.items.forEach((item: any) => {
            // Find the product in the products list
            const product = products.find(p => p.id === item.productId);
            if (product) {
              productMap.set(item.productId, { product, quantity: item.quantity || 1 });
            }
          });
          
          setSelectedProducts(productMap);
        }

        setIsEditMode(true);
        setEditBillId(billData.id);
        
        // Clear the edit data from localStorage after loading
        localStorage.removeItem('editBill');
        
        toast({
          title: "Edit Mode",
          description: "Bill loaded for editing. Make your changes and regenerate the bill.",
        });
      } catch (error) {
        console.error('Error loading edit bill data:', error);
        localStorage.removeItem('editBill');
      }
    }
  }, [products, currency, toast]);

  const createBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      return apiRequest('POST', '/api/bills', billData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      toast({
        title: "Success",
        description: "Bill created successfully!",
      });
      resetForm();
      setIsEditMode(false);
      setEditBillId(null);
      // Navigate to bills history tab using wouter
      setLocation('/admin?tab=bills');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bill.",
        variant: "destructive",
      });
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: async ({ id, billData }: { id: string; billData: any }) => {
      return apiRequest('PUT', `/api/bills/${id}`, billData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      toast({
        title: "Success",
        description: "Bill updated successfully!",
      });
      resetForm();
      setIsEditMode(false);
      setEditBillId(null);
      // Navigate to bills history tab using wouter
      setLocation('/admin?tab=bills');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bill.",
        variant: "destructive",
      });
    },
  });

  const handleProductSelection = (productId: string, checked: boolean) => {
    const newSelection = new Map(selectedProducts);
    
    if (checked) {
      const product = products.find(p => p.id === productId);
      if (product) {
        newSelection.set(productId, { product, quantity: 1 });
      }
    } else {
      newSelection.delete(productId);
    }
    
    setSelectedProducts(newSelection);
    updateAmountFields(newSelection);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newSelection = new Map(selectedProducts);
    const item = newSelection.get(productId);
    
    if (item) {
      newSelection.set(productId, { ...item, quantity: Math.max(1, quantity) });
      setSelectedProducts(newSelection);
      updateAmountFields(newSelection);
    }
  };

  const updateAmountFields = (selectedProductsMap: Map<string, { product: Product; quantity: number }>) => {
    let totalInr = 0;
    let totalBhd = 0;
    
    selectedProductsMap.forEach(({ product, quantity }) => {
      totalInr += parseFloat(product.priceInr) * quantity;
      totalBhd += parseFloat(product.priceBhd) * quantity;
    });
    
    setCustomerData(prev => ({
      ...prev,
      amountInr: totalInr.toFixed(2),
      amountBhd: totalBhd.toFixed(3)
    }));
  };

  const calculateBillTotals = () => {
    // Use manually entered amounts instead of calculating from product prices
    const subtotal = customerData.currency === 'INR' 
      ? parseFloat(customerData.amountInr) || 0
      : parseFloat(customerData.amountBhd) || 0;
    
    const billItems: BillItem[] = Array.from(selectedProducts.values()).map(({ product, quantity }) => {
      // Calculate proportional amount for each item based on total edited amount
      const originalPrice = customerData.currency === 'INR' ? parseFloat(product.priceInr) : parseFloat(product.priceBhd);
      const originalItemTotal = originalPrice * quantity;
      
      // Calculate what portion this item represents of the original total
      let originalSubtotal = 0;
      selectedProducts.forEach(({ product: p, quantity: q }) => {
        const pPrice = customerData.currency === 'INR' ? parseFloat(p.priceInr) : parseFloat(p.priceBhd);
        originalSubtotal += pPrice * q;
      });
      
      // Proportionally distribute the edited amount
      const itemTotal = originalSubtotal > 0 ? (originalItemTotal / originalSubtotal) * subtotal : 0;
      
      const makingChargesAmount = (itemTotal * parseFloat(customerData.makingCharges)) / 100;
      
      let gstAmount = 0;
      let vatAmount = 0;
      let finalItemTotal = itemTotal + makingChargesAmount;
      
      if (customerData.currency === 'INR') {
        // India GST calculation
        gstAmount = ((itemTotal + makingChargesAmount) * parseFloat(customerData.gst)) / 100;
        finalItemTotal += gstAmount;
      } else if (customerData.currency === 'BHD') {
        // Bahrain VAT calculation
        vatAmount = ((itemTotal + makingChargesAmount) * parseFloat(customerData.vat)) / 100;
        finalItemTotal += vatAmount;
      }
      
      return {
        productId: product.id,
        productName: `${product.name} (${product.productCode || product.barcode || 'N/A'})`,
        quantity,
        priceInr: product.priceInr,
        priceBhd: product.priceBhd,
        grossWeight: product.grossWeight,
        netWeight: product.netWeight,
        makingCharges: makingChargesAmount.toFixed(2),
        discount: '0',
        sgst: customerData.currency === 'INR' ? (gstAmount / 2).toFixed(2) : '0',
        cgst: customerData.currency === 'INR' ? (gstAmount / 2).toFixed(2) : '0',
        vat: customerData.currency === 'BHD' ? vatAmount.toFixed(2) : '0',
        total: finalItemTotal.toFixed(2),
      };
    });
    
    const makingChargesTotal = (subtotal * parseFloat(customerData.makingCharges)) / 100;
    let gstTotal = 0;
    let vatTotal = 0;
    let total = subtotal + makingChargesTotal;
    
    if (customerData.currency === 'INR') {
      gstTotal = ((subtotal + makingChargesTotal) * parseFloat(customerData.gst)) / 100;
      total += gstTotal;
    } else if (customerData.currency === 'BHD') {
      vatTotal = ((subtotal + makingChargesTotal) * parseFloat(customerData.vat)) / 100;
      total += vatTotal;
    }
    
    return {
      billItems,
      subtotal: subtotal.toFixed(2),
      makingCharges: makingChargesTotal.toFixed(2),
      gst: gstTotal.toFixed(2),
      vat: vatTotal.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product.",
        variant: "destructive",
      });
      return;
    }
    
    const { billItems, subtotal, makingCharges, gst, vat, total } = calculateBillTotals();
    
    const billData = {
      ...customerData,
      subtotal,
      makingCharges,
      gst,
      vat,
      discount: '0',
      total,
      paidAmount: total,
      paymentMethod: 'CASH',
      items: billItems,
    };
    
    if (isEditMode && editBillId) {
      updateBillMutation.mutate({ id: editBillId, billData });
    } else {
      createBillMutation.mutate(billData);
    }
  };

  const resetForm = () => {
    setCustomerData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      currency: currency,
      makingCharges: '12.0',
      gst: '3.0',
      vat: '10.0',
      amountInr: '0.00',
      amountBhd: '0.00',
    });
    setSelectedProducts(new Map());
    setIsEditMode(false);
    setEditBillId(null);
  };

  const totals = calculateBillTotals();

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <Card className="border-2 border-gold bg-gradient-to-r from-cream to-champagne/30 shadow-xl" data-testid="card-billing-form">
        <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{isEditMode ? 'Edit Customer Bill' : 'Create New Bill'}</span>
          {isEditMode && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              Edit Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-create-bill">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-black">Customer Information</h4>
              
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerData.customerName}
                  onChange={(e) => setCustomerData({ ...customerData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  required
                  data-testid="input-customer-name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerData.customerEmail}
                  onChange={(e) => setCustomerData({ ...customerData, customerEmail: e.target.value })}
                  placeholder="customer@email.com"
                  required
                  data-testid="input-customer-email"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerData.customerPhone}
                  onChange={(e) => setCustomerData({ ...customerData, customerPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                  data-testid="input-customer-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerData.customerAddress}
                  onChange={(e) => setCustomerData({ ...customerData, customerAddress: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                  required
                  data-testid="textarea-customer-address"
                />
              </div>
            </div>

            {/* Bill Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-black">Bill Settings</h4>
              
              <div>
                <Label htmlFor="billCurrency">Currency</Label>
                <Select
                  value={customerData.currency}
                  onValueChange={(value: Currency) => setCustomerData({ ...customerData, currency: value })}
                >
                  <SelectTrigger data-testid="select-bill-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupees (INR)</SelectItem>
                    <SelectItem value="BHD">Bahrain Dinar (BHD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="makingCharges">Making Charges (%)</Label>
                <Input
                  id="makingCharges"
                  type="number"
                  step="0.1"
                  value={customerData.makingCharges}
                  onChange={(e) => setCustomerData({ ...customerData, makingCharges: e.target.value })}
                  placeholder="12.0"
                  required
                  data-testid="input-making-charges"
                />
              </div>
              
              {customerData.currency === 'INR' && (
                <div>
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    step="0.1"
                    value={customerData.gst}
                    onChange={(e) => setCustomerData({ ...customerData, gst: e.target.value })}
                    placeholder="3.0"
                    required
                    data-testid="input-gst"
                  />
                </div>
              )}
              
              {customerData.currency === 'BHD' && (
                <div>
                  <Label htmlFor="vat">VAT (%) - Bahrain</Label>
                  <Input
                    id="vat"
                    type="number"
                    step="0.1"
                    value={customerData.vat}
                    onChange={(e) => setCustomerData({ ...customerData, vat: e.target.value })}
                    placeholder="10.0"
                    required
                    data-testid="input-vat"
                  />
                </div>
              )}

              {/* Amount Fields */}
              <div className="space-y-4 border-t pt-4">
                <h5 className="font-medium text-black">Product Amounts (Editable)</h5>
                <p className="text-xs text-gray-600">These amounts are auto-populated from selected products but can be edited manually.</p>
                
                <div>
                  <Label htmlFor="amountInr">Amount (INR)</Label>
                  <Input
                    id="amountInr"
                    type="number"
                    step="0.01"
                    value={customerData.amountInr}
                    onChange={(e) => setCustomerData({ ...customerData, amountInr: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-amount-inr"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amountBhd">Amount (BHD)</Label>
                  <Input
                    id="amountBhd"
                    type="number"
                    step="0.001"
                    value={customerData.amountBhd}
                    onChange={(e) => setCustomerData({ ...customerData, amountBhd: e.target.value })}
                    placeholder="0.000"
                    data-testid="input-amount-bhd"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              {selectedProducts.size > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h5 className="font-medium text-black">Bill Summary</h5>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(totals.subtotal, customerData.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Making Charges ({customerData.makingCharges}%):</span>
                      <span>{formatPrice(totals.makingCharges, customerData.currency)}</span>
                    </div>
                    {customerData.currency === 'INR' && (
                      <div className="flex justify-between">
                        <span>GST ({customerData.gst}%):</span>
                        <span>{formatPrice(totals.gst, customerData.currency)}</span>
                      </div>
                    )}
                    {customerData.currency === 'BHD' && (
                      <div className="flex justify-between">
                        <span>VAT ({customerData.vat}%):</span>
                        <span>{formatPrice(totals.vat, customerData.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{formatPrice(totals.total, customerData.currency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <h4 className="text-lg font-medium text-black mb-4">Select Products</h4>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
            </div>
            
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto" data-testid="product-selection">
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products available.</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No products found matching "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    Clear search
                  </button>
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  const selectedItem = selectedProducts.get(product.id);
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0" data-testid={`product-option-${product.id}`}>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                          data-testid={`checkbox-product-${product.id}`}
                        />
                        <img
                          src={product.images[0] || "https://images.unsplash.com/photo-1603561596112-db2eca6c9df4?w=50"}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium text-black">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(customerData.currency === 'INR' ? product.priceInr : product.priceBhd, customerData.currency)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={product.stock > 5 ? "default" : "destructive"} className="text-xs">
                              Stock: {product.stock}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm text-gray-600">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={selectedItem?.quantity || 1}
                            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                            data-testid={`input-quantity-${product.id}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              className="flex-1 text-white font-bold py-4 text-lg relative overflow-hidden"
              disabled={createBillMutation.isPending || selectedProducts.size === 0}
              data-testid="button-create-bill"
              style={{
                background: 'linear-gradient(45deg, #ff0066, #ff3366, #ff6600, #ff9900) !important',
                boxShadow: '0 0 30px #ff0066, 0 8px 25px rgba(255, 0, 102, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4) !important',
                border: '3px solid #ff0066 !important',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                animation: 'brightPulse 1.5s ease-in-out infinite alternate',
                transform: 'scale(1.02)',
                filter: 'brightness(1.2) saturate(1.5)',
              }}
            >
              <FileText className="h-6 w-6 mr-2" />
              {createBillMutation.isPending ? 'Creating...' : (isEditMode ? 'Update Bill' : 'Generate Bill')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
