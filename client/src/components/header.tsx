import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, LogOut, Search, MapPin, Heart, ShoppingCart, Menu, Phone, Store, Camera, Mic } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Currency, CURRENCY_NAMES } from '@/lib/currency';
import CartButton from '@/components/cart/cart-button';
import MobileMenu from '@/components/mobile-menu';
import logoPath from '@assets/1000284180_1755240849891_1755886428742.jpg';

interface HeaderProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export default function Header({ selectedCurrency, onCurrencyChange }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/collections?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50" data-testid="header-main">
        <div className="container mx-auto px-4">
          {/* Top Row */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left Section - Mobile Menu & Brand */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu - Mobile Only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-amber-900 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </Button>

              {/* Brand with Logo */}
              <Link href="/" className="flex items-center space-x-2 md:space-x-3" data-testid="link-home">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border border-gray-300">
                  <img 
                    src={logoPath} 
                    alt="Palaniappa Jewellers Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-amber-900 tracking-wide">PALANIAPPA JEWELLERS</h1>
                  <p className="text-xs text-gray-600 font-medium">Since 2025</p>
                </div>
              </Link>
            </div>

            {/* Right Section - Icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Currency Selection */}
              <Select value={selectedCurrency} onValueChange={onCurrencyChange} data-testid="select-currency">
                <SelectTrigger className="bg-transparent border-0 text-amber-900 hover:text-amber-700 p-0 h-auto transition-colors duration-200 w-16 md:w-20">
                  <div className="flex flex-col items-center cursor-pointer w-full">
                    <span className="text-[8px] md:text-xs whitespace-nowrap mb-0.5">Country</span>
                    <div className="text-center text-[9px] md:text-xs font-medium">
                      <SelectValue />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR" data-testid="option-inr">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 rounded-sm" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="8" fill="#FF9933"/>
                        <rect y="8" width="24" height="8" fill="#FFFFFF"/>
                        <rect y="16" width="24" height="8" fill="#138808"/>
                        <circle cx="12" cy="12" r="3" fill="#000080"/>
                      </svg>
                      <span>₹ INR</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BHD" data-testid="option-bhd">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 rounded-sm" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="12" fill="#FFFFFF"/>
                        <rect y="12" width="24" height="12" fill="#CE1126"/>
                        <path d="M0 0 L8 6 L0 12 V8 L4 6 L0 4 Z" fill="#CE1126"/>
                      </svg>
                      <span>BD BHD</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Login/Profile */}
              <div className="flex flex-col items-center px-1">
                {user ? (
                  <div className="flex items-center space-x-1 md:space-x-2">
                    {isAdmin && (
                      <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-amber-900 hover:text-amber-700 hover:bg-gray-100 transition-all duration-200 px-2 py-1" data-testid="button-admin-dashboard">
                          <span className="text-xs">Dashboard</span>
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="p-2 text-amber-900 hover:text-amber-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-6 w-6" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/login">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                      <User className="h-6 w-6 text-amber-900" />
                    </button>
                  </Link>
                )}
              </div>

              {/* Wishlist Heart */}
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Heart className="h-6 w-6 text-amber-900" />
              </button>

              {/* Cart with Badge */}
              <div className="relative">
                <CartButton />
              </div>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="pb-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="h-5 w-5 text-amber-900" />
                </div>
                <Input
                  type="text"
                  placeholder="Search for Gold Jewellery, Diamond Je..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full h-12 pl-12 pr-20 rounded-full bg-gray-50 border-gray-200 text-amber-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                  data-testid="search-input"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Camera className="h-5 w-5 text-amber-900" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Mic className="h-5 w-5 text-amber-900" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
    </>
  );
}
