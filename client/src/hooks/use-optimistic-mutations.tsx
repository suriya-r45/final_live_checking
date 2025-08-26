import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

interface OptimisticProductMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useOptimisticProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create product');
      }
      
      return response.json();
    },
    onMutate: async (formData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/products'] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(['/api/products']);

      // Create optimistic product object
      const optimisticProduct = {
        id: `temp-${Date.now()}`,
        name: formData.get('name') || 'New Product',
        description: formData.get('description') || '',
        category: formData.get('category') || '',
        priceInr: parseFloat(formData.get('priceInr') as string) || 0,
        priceBhd: parseFloat(formData.get('priceBhd') as string) || 0,
        images: [],
        stock: parseInt(formData.get('stock') as string) || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData(['/api/products'], (old: Product[] | undefined) => {
        return old ? [optimisticProduct as Product, ...old] : [optimisticProduct as Product];
      });

      // Return a context object with the snapshotted value
      return { previousProducts };
    },
    onError: (err, formData, context) => {
      // Rollback to the previous value
      queryClient.setQueryData(['/api/products'], context?.previousProducts);
      
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (newProduct, formData, context) => {
      // Update cache with the real product data
      queryClient.setQueryData(['/api/products'], (old: Product[] | undefined) => {
        if (!old) return [newProduct];
        
        // Replace the optimistic product with the real one
        return old.map(product => 
          product.id?.startsWith('temp-') ? newProduct : product
        );
      });

      toast({
        title: "Success",
        description: "Product added successfully!",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}