import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatPrice } from '@/lib/currency';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { ShoppingBag } from 'lucide-react';

// Initialize Stripe if key is available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm() {
  // Only use Stripe hooks if Stripe is available
  const stripe = stripePromise ? useStripe() : null;
  const elements = stripePromise ? useElements() : null;
  const { items, totalAmount, clearCart } = useCart();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(stripePromise ? 'stripe' : 'gpay');
  const [isIndianUser, setIsIndianUser] = useState(true); // Detect based on phone or location
  
  // State to track if cart has been loaded from localStorage
  const [cartLoaded, setCartLoaded] = useState(false);
  
  // Wait for cart to load from localStorage before redirecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setCartLoaded(true);
    }, 100); // Small delay to ensure cart is loaded from localStorage
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!user || !token) {
      toast({
        title: "Login Required",
        description: "Please login to continue with checkout.",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }
  }, [user, token, setLocation, toast]);
  
  // Redirect to cart if no items (only after cart is loaded)
  useEffect(() => {
    if (cartLoaded && items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      setLocation('/cart');
    }
  }, [cartLoaded, items.length, setLocation, toast]);
  
  // Customer information - auto-populate from logged-in user
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.mobile || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    deliveryInstructions: ''
  });

  // Update customer info when user data is available
  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.mobile || prev.phone,
      }));
    }
  }, [user]);
  
  // Auto-detect Indian user based on phone number
  useEffect(() => {
    if (customerInfo.phone.startsWith('+91') || customerInfo.phone.startsWith('91') || 
        (customerInfo.phone.length === 10 && /^[6-9]/.test(customerInfo.phone))) {
      setIsIndianUser(true);
    }
  }, [customerInfo.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate customer information
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || 
        !customerInfo.address || !customerInfo.city || !customerInfo.state || 
        !customerInfo.postalCode || !customerInfo.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required delivery details",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'stripe') {
        if (!stripe || !elements) {
          return;
        }

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/order-success`,
          },
        });

        if (error) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Create order after successful Stripe payment
          try {
            // Calculate totals
            const subtotal = totalAmount;
            const makingCharges = subtotal * 0.15; // 15% making charges
            const gst = subtotal * 0.03; // 3% GST for India
            const total = subtotal + makingCharges + gst;

            // Prepare order data
            const orderData = {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              customerAddress: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.postalCode}, ${customerInfo.country}`,
              currency: 'INR',
              subtotal,
              makingCharges,
              gst,
              vat: 0,
              discount: 0,
              total,
              paidAmount: total,
              paymentMethod: 'STRIPE',
              items: items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                priceInr: item.product.priceInr,
                priceBhd: item.product.priceBhd,
                grossWeight: item.product.grossWeight,
                netWeight: item.product.netWeight,
                makingCharges: (parseFloat(item.product.priceInr) * item.quantity * 0.15).toFixed(2),
                discount: '0',
                sgst: (parseFloat(item.product.priceInr) * item.quantity * 0.015).toFixed(2),
                cgst: (parseFloat(item.product.priceInr) * item.quantity * 0.015).toFixed(2),
                vat: '0',
                total: (parseFloat(item.product.priceInr) * item.quantity * 1.18).toFixed(2)
              }))
            };

            // Create order in database
            const response = await apiRequest('POST', '/api/orders', orderData);
            const orderResult = await response.json();

            if (orderResult) {
              clearCart();
              toast({
                title: "Payment Successful",
                description: `Order ${orderResult.orderNumber} created successfully!`,
              });
              setLocation('/order-success');
            }
          } catch (orderError) {
            console.error('Failed to create order:', orderError);
            // Still clear cart since payment was successful
            clearCart();
            toast({
              title: "Payment Successful",
              description: "Payment completed but order could not be saved. Please contact support with your payment confirmation.",
              variant: "destructive",
            });
            setLocation('/order-success');
          }
        }
      } else {
        // Handle Indian payment methods (GPay, PhonePe, Paytm)
        const amount = totalAmount;
        const merchantInfo = {
          name: "Palaniappa Jewellers",
          vpa: "jewelrypalaniappa@ybl", // Example UPI ID
          merchantCode: "PALANIAPPA"
        };

        if (paymentMethod === 'gpay') {
          // Google Pay UPI deep link
          const gpayUrl = `googlepay://pay?pa=${merchantInfo.vpa}&pn=${encodeURIComponent(merchantInfo.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Jewelry Purchase from Palaniappa Jewellers')}`;
          
          toast({
            title: "Redirecting to Google Pay",
            description: "Opening Google Pay app...",
          });
          
          // Try to open GPay app, fallback to web
          window.location.href = gpayUrl;
          
          // Fallback to web version if app doesn't open
          setTimeout(() => {
            if (document.hidden === false) {
              window.open(`https://pay.google.com/about/`, '_blank');
            }
          }, 1000);
        } 
        
        else if (paymentMethod === 'phonepe') {
          // PhonePe UPI deep link
          const phonePeUrl = `phonepe://pay?pa=${merchantInfo.vpa}&pn=${encodeURIComponent(merchantInfo.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Jewelry Purchase')}`;
          
          toast({
            title: "Redirecting to PhonePe",
            description: "Opening PhonePe app...",
          });
          
          window.location.href = phonePeUrl;
          
          // Fallback to web version
          setTimeout(() => {
            if (document.hidden === false) {
              window.open(`https://www.phonepe.com/`, '_blank');
            }
          }, 1000);
        } 
        
        else if (paymentMethod === 'paytm') {
          // Paytm UPI deep link
          const paytmUrl = `paytmmp://pay?pa=${merchantInfo.vpa}&pn=${encodeURIComponent(merchantInfo.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Jewelry Purchase')}`;
          
          toast({
            title: "Redirecting to Paytm",
            description: "Opening Paytm app...",
          });
          
          window.location.href = paytmUrl;
          
          // Fallback to web version
          setTimeout(() => {
            if (document.hidden === false) {
              window.open(`https://paytm.com/`, '_blank');
            }
          }, 1000);
        }
        
        // Create order after simulated payment success
        setTimeout(async () => {
          try {
            // Calculate totals
            const subtotal = totalAmount;
            const makingCharges = subtotal * 0.15; // 15% making charges
            const gst = subtotal * 0.03; // 3% GST for India
            const total = subtotal + makingCharges + gst;

            // Prepare order data
            const orderData = {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              customerAddress: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.postalCode}, ${customerInfo.country}`,
              currency: 'INR',
              subtotal,
              makingCharges,
              gst,
              vat: 0,
              discount: 0,
              total,
              paidAmount: total,
              paymentMethod: paymentMethod.toUpperCase(),
              items: items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                priceInr: item.product.priceInr,
                priceBhd: item.product.priceBhd,
                grossWeight: item.product.grossWeight,
                netWeight: item.product.netWeight,
                makingCharges: (parseFloat(item.product.priceInr) * item.quantity * 0.15).toFixed(2),
                discount: '0',
                sgst: (parseFloat(item.product.priceInr) * item.quantity * 0.015).toFixed(2),
                cgst: (parseFloat(item.product.priceInr) * item.quantity * 0.015).toFixed(2),
                vat: '0',
                total: (parseFloat(item.product.priceInr) * item.quantity * 1.18).toFixed(2)
              }))
            };

            // Create order in database
            const response = await apiRequest('POST', '/api/orders', orderData);
            const orderResult = await response.json();

            if (orderResult) {
              clearCart();
              toast({
                title: "Payment Successful",
                description: `Order ${orderResult.orderNumber} created successfully!`,
              });
              setLocation('/order-success');
            }
          } catch (error) {
            console.error('Failed to create order:', error);
            toast({
              title: "Order Creation Failed",
              description: "Payment successful but order could not be saved. Please contact support.",
              variant: "destructive",
            });
          }
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while cart is initializing
  if (!cartLoaded || (cartLoaded && items.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!cartLoaded ? 'Loading checkout...' : 'Redirecting to cart...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 to-red-900 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">Checkout</h1>
          <p className="text-center text-rose-100 mt-2">Secure payment with 256-bit SSL encryption</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Order Summary */}
            <div className="lg:order-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-64 md:max-h-80 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-start gap-3 py-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <img
                            src={item.product.images[0] || "https://images.unsplash.com/photo-1603561596112-db2eca6c9df4?w=100"}
                            alt={item.product.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm md:text-base truncate">{item.product.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.product.material}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-medium text-sm md:text-base">
                            {formatPrice(parseFloat(item.product.priceInr) * item.quantity, 'INR')}
                          </span>
                          <p className="text-xs text-gray-500">
                            {formatPrice(parseFloat(item.product.priceInr), 'INR')} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatPrice(totalAmount, 'INR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-600">Calculated at delivery</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-600">Included</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold" style={{ color: '#8b4513' }}>
                    <span>Total:</span>
                    <span>{formatPrice(totalAmount, 'INR')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:order-1">
              <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Payment & Shipping Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          required
                          data-testid="input-customer-name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          required
                          data-testid="input-customer-email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 9876543210 or +973 XXXXXXXX"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        data-testid="input-customer-phone"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      🚚 Delivery Details
                    </h3>
                    
                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        placeholder="House number, street name, area"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        required
                        data-testid="input-customer-address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="City name"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                          required
                          data-testid="input-customer-city"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">State/Region *</Label>
                        <Input
                          id="state"
                          placeholder="State or Region"
                          value={customerInfo.state}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                          required
                          data-testid="input-customer-state"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          placeholder="PIN/ZIP Code"
                          value={customerInfo.postalCode}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                          required
                          data-testid="input-customer-postal"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          placeholder="India / Bahrain / Other"
                          value={customerInfo.country}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                          required
                          data-testid="input-customer-country"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                      <Input
                        id="deliveryInstructions"
                        placeholder="Any special delivery instructions, landmarks, preferred time, etc."
                        value={customerInfo.deliveryInstructions}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                        data-testid="input-delivery-instructions"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="text-blue-600 text-lg">📦</div>
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">Delivery Information</p>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Delivery within Bahrain (2-3 business days)</li>
                            <li>• International shipping to India available (5-7 business days)</li>
                            <li>• All jewelry items are insured during transit</li>
                            <li>• Signature required upon delivery for security</li>
                            <li>• Delivery charges calculated based on location</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Method</h3>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={setPaymentMethod}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center cursor-pointer flex-1">
                          💳 Credit/Debit Card
                          <span className="ml-auto text-xs text-gray-500">Visa, Mastercard, etc.</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="gpay" id="gpay" />
                        <Label htmlFor="gpay" className="flex items-center cursor-pointer flex-1">
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjIgMTJMMTIgMjJMMiAxMkwxMiAyWiIgZmlsbD0iIzQyODVGNCIvPgo8cGF0aCBkPSJNMTIgN0wxNyAxMkwxMiAxN0w3IDEyTDEyIDdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="GPay" className="w-5 h-5 mr-2"/>
                          Google Pay
                          <span className="ml-auto text-xs text-gray-500">UPI</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="phonepe" id="phonepe" />
                        <Label htmlFor="phonepe" className="flex items-center cursor-pointer flex-1">
                          <div className="w-5 h-5 mr-2 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            P
                          </div>
                          PhonePe
                          <span className="ml-auto text-xs text-gray-500">UPI</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="paytm" id="paytm" />
                        <Label htmlFor="paytm" className="flex items-center cursor-pointer flex-1">
                          <div className="w-5 h-5 mr-2 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            ₹
                          </div>
                          Paytm
                          <span className="ml-auto text-xs text-gray-500">UPI</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payment Element */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">
                      {paymentMethod === 'stripe' ? 'Payment Information' : 'Payment Details'}
                    </h3>
                    
                    {paymentMethod === 'stripe' && stripePromise && elements ? (
                      <div className="space-y-4">
                        <PaymentElement options={{
                          layout: {
                            type: 'accordion',
                            defaultCollapsed: false,
                            radios: false,
                            spacedAccordionItems: false
                          }
                        }} />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="flex gap-1">
                            <span className="text-blue-600">💳</span>
                            <span className="text-red-600">💳</span>
                            <span className="text-yellow-600">💳</span>
                            <span className="text-green-600">💳</span>
                          </div>
                          <span>Secure payments powered by Stripe</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {paymentMethod === 'gpay' && '📱'}
                            {paymentMethod === 'phonepe' && '📱'}
                            {paymentMethod === 'paytm' && '📱'}
                            {!stripePromise && paymentMethod === 'stripe' && '⚠️'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              {!stripePromise && paymentMethod === 'stripe' && "Payment Setup Required"}
                              {paymentMethod === 'gpay' && "Google Pay Payment"}
                              {paymentMethod === 'phonepe' && "PhonePe Payment"}
                              {paymentMethod === 'paytm' && "Paytm Payment"}
                            </p>
                            <p className="text-sm text-blue-800">
                              {!stripePromise && paymentMethod === 'stripe' && "Online card payments are currently being set up. Please choose UPI payment or contact us directly."}
                              {paymentMethod === 'gpay' && "You'll be redirected to Google Pay to complete your secure UPI payment."}
                              {paymentMethod === 'phonepe' && "You'll be redirected to PhonePe to complete your secure UPI payment."}
                              {paymentMethod === 'paytm' && "You'll be redirected to Paytm to complete your secure UPI payment."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={paymentMethod === 'stripe' ? !stripe || isProcessing : isProcessing}
                    className="w-full"
                    data-testid="button-pay"
                  >
                    {isProcessing ? 'Processing...' : 
                     paymentMethod === 'stripe' ? `Pay ${formatPrice(totalAmount, 'INR')}` :
                     paymentMethod === 'gpay' ? `Pay with Google Pay ${formatPrice(totalAmount, 'INR')}` :
                     paymentMethod === 'phonepe' ? `Pay with PhonePe ${formatPrice(totalAmount, 'INR')}` :
                     `Pay with Paytm ${formatPrice(totalAmount, 'INR')}`}
                  </Button>
                </form>
              </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items } = useCart();
  const [, setLocation] = useLocation();
  const [cartLoaded, setCartLoaded] = useState(false);
  
  // Wait for cart to load from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setCartLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading while cart is loading
  if (!cartLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }
  
  // Handle empty cart (only after cart is loaded)
  if (cartLoaded && items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">
              Add some beautiful jewelry pieces to your cart before checking out.
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="px-8 py-3 text-lg"
              style={{ backgroundColor: '#8b4513', color: 'white' }}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout form with items
  // Wrap with Stripe Elements provider if Stripe is available
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    );
  }
  
  // Return CheckoutForm without Stripe wrapper if Stripe is not available
  return <CheckoutForm />;
}