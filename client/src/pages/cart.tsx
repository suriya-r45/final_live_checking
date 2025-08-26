import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/currency';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import Footer from '@/components/footer';
import WhatsAppFloat from '@/components/whatsapp-float';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<'INR' | 'BHD'>('BHD');

  // Calculate total amount based on selected currency
  const totalAmount = items.reduce((sum, item) => {
    const price = parseFloat(currency === 'INR' ? item.product.priceInr : item.product.priceBhd);
    return sum + (price * item.quantity);
  }, 0);

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checking out",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast({
        title: "Login Required",
        description: "Please login to continue with checkout",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }
    
    setLocation('/checkout');
  };

  const handleContinueShopping = () => {
    setLocation('/');
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #f8f6e6 0%, #fff2cc 100%)' }}>
      <Header selectedCurrency={currency} onCurrencyChange={setCurrency} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-4xl font-bold mb-4" style={{ color: '#8b4513' }}>
                Shopping Cart
              </h1>
              <p className="text-gray-600">
                {totalItems > 0 ? `You have ${totalItems} item${totalItems > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
              </p>
            </div>

            {items.length === 0 ? (
              // Empty Cart State
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
                  <p className="text-gray-500 mb-8">
                    Discover our beautiful jewelry collection and find pieces that speak to your style.
                  </p>
                  <Button
                    onClick={handleContinueShopping}
                    className="px-8 py-3 text-lg"
                    style={{ backgroundColor: '#8b4513', color: 'white' }}
                    data-testid="button-continue-shopping"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : (
              // Cart with Items
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items - Desktop and Mobile */}
                <div className="lg:col-span-2">
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Cart Items ({totalItems})
                      </CardTitle>
                      {items.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearCart}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          data-testid="button-clear-cart"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear Cart
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {items.map((item, index) => (
                        <div key={item.product.id}>
                          {index > 0 && <Separator />}
                          
                          <div className="flex flex-col md:flex-row gap-4 py-4">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={item.product.images[0] || "https://images.unsplash.com/photo-1603561596112-db2eca6c9df4?w=200"}
                                alt={item.product.name}
                                className="w-full md:w-24 h-48 md:h-24 object-cover rounded-lg"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-lg text-gray-900" style={{ color: '#2d3748' }}>
                                {item.product.name}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">{item.product.category}</Badge>
                                <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">{item.product.material}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-700 font-medium">
                                <span className="bg-gray-100 px-2 py-1 rounded">Weight: {item.product.grossWeight}g</span>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Stock: {item.product.stock} available</span>
                              </div>
                              
                              {/* Price */}
                              <div className="space-y-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                <div className="text-lg font-bold" style={{ color: '#8b4513' }}>
                                  {formatPrice(parseFloat(currency === 'INR' ? item.product.priceInr : item.product.priceBhd), currency)}
                                  <span className="text-sm font-medium text-gray-600 ml-2">per item</span>
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls & Total */}
                            <div className="flex flex-col md:items-end space-y-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  data-testid={`button-decrease-${item.product.id}`}
                                  className="border-gray-300 hover:bg-gray-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                
                                <span 
                                  className="font-bold text-lg w-8 text-center bg-white px-2 py-1 rounded border" 
                                  data-testid={`quantity-${item.product.id}`}
                                  style={{ color: '#2d3748' }}
                                >
                                  {item.quantity}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.product.stock}
                                  data-testid={`button-increase-${item.product.id}`}
                                  className="border-gray-300 hover:bg-gray-100"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Item Total */}
                              <div className="text-right bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="text-xl font-bold" style={{ color: '#059669' }}>
                                  {formatPrice(
                                    parseFloat(currency === 'INR' ? item.product.priceInr : item.product.priceBhd) * item.quantity, 
                                    currency
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 font-medium">
                                  {item.quantity} × {formatPrice(parseFloat(currency === 'INR' ? item.product.priceInr : item.product.priceBhd), currency)}
                                </div>
                              </div>
                              
                              {/* Remove Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-medium"
                                data-testid={`button-remove-${item.product.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary - Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="shadow-lg sticky top-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Currency Toggle */}
                      <div className="flex gap-2">
                        <Button
                          variant={currency === 'INR' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrency('INR')}
                          className="flex-1"
                        >
                          ₹ INR
                        </Button>
                        <Button
                          variant={currency === 'BHD' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrency('BHD')}
                          className="flex-1"
                        >
                          BD BHD
                        </Button>
                      </div>

                      <Separator />

                      {/* Order Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Items ({totalItems})</span>
                          <span>{formatPrice(totalAmount, currency)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span className="text-gray-600">To be calculated</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold" style={{ color: '#8b4513' }}>
                          <span>Total</span>
                          <span data-testid="cart-total">{formatPrice(totalAmount, currency)}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={handleProceedToCheckout}
                          className="w-full py-3 text-lg"
                          style={{ backgroundColor: '#8b4513', color: 'white' }}
                          data-testid="button-checkout"
                        >
                          Proceed to Checkout
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleContinueShopping}
                          className="w-full"
                          data-testid="button-continue-shopping"
                        >
                          Continue Shopping
                        </Button>
                      </div>

                      {/* Security Info */}
                      <div className="text-xs text-gray-500 text-center">
                        <p>🔒 Secure checkout with 256-bit SSL encryption</p>
                        <p>💳 We accept all major credit cards and UPI</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}