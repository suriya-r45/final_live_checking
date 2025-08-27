import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import Login from "@/pages/login";
import ProductDetails from "@/pages/product-details";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/order-success";
import { EstimatesPage } from "@/pages/estimates";
import CollectionsPage from "@/pages/collections";
import QRScanResult from "@/pages/qr-scan-result";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/estimates" component={EstimatesPage} />
      {/* Material-based routes */}
      <Route path="/collections/gold" component={() => <CollectionsPage material="GOLD" />} />
      <Route path="/collections/gold-18k" component={() => <CollectionsPage material="GOLD_18K" />} />
      <Route path="/collections/gold-22k" component={() => <CollectionsPage material="GOLD_22K" />} />
      <Route path="/collections/silver" component={() => <CollectionsPage material="SILVER" />} />
      <Route path="/collections/silver-925" component={() => <CollectionsPage material="SILVER_925" />} />
      <Route path="/collections/diamond" component={() => <CollectionsPage material="DIAMOND" />} />
      <Route path="/collections/gold-plated-silver" component={() => <CollectionsPage material="GOLD_PLATED_SILVER" />} />
      <Route path="/collections/platinum" component={() => <CollectionsPage material="PLATINUM" />} />
      <Route path="/collections/pearl" component={() => <CollectionsPage material="PEARL" />} />
      {/* Category-based routes */}
      <Route path="/collections/rings" component={() => <CollectionsPage category="rings" />} />
      <Route path="/collections/necklaces" component={() => <CollectionsPage category="necklaces" />} />
      <Route path="/collections/pendants" component={() => <CollectionsPage category="pendants" />} />
      <Route path="/collections/earrings" component={() => <CollectionsPage category="earrings" />} />
      <Route path="/collections/bracelets" component={() => <CollectionsPage category="bracelets" />} />
      <Route path="/collections/bangles" component={() => <CollectionsPage category="bangles" />} />
      <Route path="/collections/watches" component={() => <CollectionsPage category="watches" />} />
      <Route path="/collections/mens" component={() => <CollectionsPage category="mens" />} />
      <Route path="/collections/children" component={() => <CollectionsPage category="children" />} />
      <Route path="/collections/materials" component={() => <CollectionsPage category="materials" />} />
      <Route path="/collections/collections" component={() => <CollectionsPage category="collections" />} />
      <Route path="/collections/custom-jewellery" component={() => <CollectionsPage category="custom-jewellery" />} />
      <Route path="/collections/gold-coins" component={() => <CollectionsPage category="gold-coins" />} />
      <Route path="/collections/new-arrivals" component={() => <CollectionsPage category="new-arrivals" />} />
      <Route path="/collections/mangalsutra" component={() => <CollectionsPage category="mangalsutra" />} />
      <Route path="/collections/nose-jewelry" component={() => <CollectionsPage category="nose-jewelry" />} />
      <Route path="/collections/anklets-toe-rings" component={() => <CollectionsPage category="anklets-toe-rings" />} />
      <Route path="/collections/bridal-collections" component={() => <CollectionsPage category="bridal-collections" />} />
      {/* Subcategory routes - catch all subcategory combinations */}
      <Route path="/collections/:subcategory" component={({ params }) => <CollectionsPage category={params.subcategory} />} />
      {/* Generic collections route */}
      <Route path="/collections" component={() => <CollectionsPage />} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/qr-scan" component={QRScanResult} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
