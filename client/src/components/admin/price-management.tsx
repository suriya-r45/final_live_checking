import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, DollarSign, TrendingUp, TrendingDown, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import type { Product } from '@shared/schema';

interface PriceUpdateData {
  priceInr: string;
  priceBhd: string;
  stock: string;
  updateType: 'fixed' | 'percentage';
  percentageChange?: number;
}

export default function PriceManagement() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [priceData, setPriceData] = useState<PriceUpdateData>({
    priceInr: '',
    priceBhd: '',
    stock: '',
    updateType: 'fixed',
    percentageChange: 0
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!token,
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Update product price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, priceData }: { productId: string; priceData: PriceUpdateData }) => {
      const response = await fetch(`/api/products/${productId}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceInr: priceData.priceInr,
          priceBhd: priceData.priceBhd,
          stock: parseInt(priceData.stock)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Price & Stock Updated Successfully",
        description: `${selectedProduct?.name} price and stock have been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsUpdateDialogOpen(false);
      setSelectedProduct(null);
      resetPriceForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Price",
        description: error.message || "Failed to update product price.",
        variant: "destructive",
      });
    },
  });

  // Calculate percentage change
  const calculatePercentageChange = (originalPrice: number, newPrice: number) => {
    return ((newPrice - originalPrice) / originalPrice * 100).toFixed(2);
  };

  const resetPriceForm = () => {
    setPriceData({
      priceInr: '',
      priceBhd: '',
      stock: '',
      updateType: 'fixed',
      percentageChange: 0
    });
  };

  const handleEditPrice = (product: Product) => {
    setSelectedProduct(product);
    setPriceData({
      priceInr: product.priceInr,
      priceBhd: product.priceBhd,
      stock: product.stock.toString(),
      updateType: 'fixed',
      percentageChange: 0
    });
    setIsUpdateDialogOpen(true);
  };

  const handlePercentageUpdate = (percentage: number) => {
    if (selectedProduct) {
      const currentInr = parseFloat(selectedProduct.priceInr);
      const currentBhd = parseFloat(selectedProduct.priceBhd);
      
      const newInr = currentInr * (1 + percentage / 100);
      const newBhd = currentBhd * (1 + percentage / 100);
      
      setPriceData({
        ...priceData,
        priceInr: newInr.toFixed(2),
        priceBhd: newBhd.toFixed(3),
        percentageChange: percentage
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updatePriceMutation.mutate({
        productId: selectedProduct.id,
        priceData
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Price Management
          </h2>
          <p className="text-gray-600 mt-1">
            Update product prices and manage pricing strategies
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Price (INR)</TableHead>
                    <TableHead>Current Price (BHD)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.material}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        ₹{parseFloat(product.priceInr).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        BD {parseFloat(product.priceBhd).toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update Price & Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Update Price & Stock - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Percentage Updates */}
            <div>
              <Label>Quick Percentage Updates</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageUpdate(5)}
                  className="text-green-600"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageUpdate(10)}
                  className="text-green-600"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +10%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageUpdate(-5)}
                  className="text-red-600"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageUpdate(-10)}
                  className="text-red-600"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -10%
                </Button>
              </div>
            </div>

            {/* Manual Price Input */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priceInr">Price (INR)</Label>
                <Input
                  id="priceInr"
                  type="number"
                  step="0.01"
                  value={priceData.priceInr}
                  onChange={(e) => setPriceData({...priceData, priceInr: e.target.value})}
                  required
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: ₹{parseFloat(selectedProduct.priceInr).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="priceBhd">Price (BHD)</Label>
                <Input
                  id="priceBhd"
                  type="number"
                  step="0.001"
                  value={priceData.priceBhd}
                  onChange={(e) => setPriceData({...priceData, priceBhd: e.target.value})}
                  required
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: BD {parseFloat(selectedProduct.priceBhd).toFixed(3)}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={priceData.stock}
                  onChange={(e) => setPriceData({...priceData, stock: e.target.value})}
                  required
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {selectedProduct.stock} units
                  </p>
                )}
              </div>
            </div>

            {/* Price Change Summary */}
            {selectedProduct && priceData.priceInr && priceData.priceBhd && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Price Change Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">INR Change:</span>
                    <div className="font-mono">
                      {calculatePercentageChange(
                        parseFloat(selectedProduct.priceInr),
                        parseFloat(priceData.priceInr)
                      )}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">BHD Change:</span>
                    <div className="font-mono">
                      {calculatePercentageChange(
                        parseFloat(selectedProduct.priceBhd),
                        parseFloat(priceData.priceBhd)
                      )}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePriceMutation.isPending}
                className="bg-gradient-to-r from-rose-900 to-red-900 hover:from-rose-800 hover:to-red-800"
              >
                {updatePriceMutation.isPending ? 'Updating...' : 'Update Price & Stock'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}