import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MoveUp, MoveDown, FolderOpen, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Category, InsertCategory } from '@shared/schema';

// Standard jewelry categories and subcategories
const HOME_CATEGORIES = {
  'rings': {
    name: 'Rings',
    subcategories: [
      'Engagement Rings',
      'Wedding Bands', 
      'Fashion Rings',
      'Cocktail Rings',
      'Promise Rings',
      'Birthstone Rings'
    ]
  },
  'necklaces': {
    name: 'Necklaces',
    subcategories: [
      'Chains',
      'Chokers',
      'Lockets',
      'Beaded Necklaces',
      'Collars',
      'Long Necklaces/Opera Chains',
      'Multi-layered Necklaces'
    ]
  },
  'pendants': {
    name: 'Pendants',
    subcategories: [
      'Solitaire',
      'Halo',
      'Cluster',
      'Heart',
      'Cross',
      'Initial',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional'
    ]
  },
  'earrings': { 
    name: 'Earrings',
    subcategories: [
      'Stud Earrings',
      'Hoop Earrings',
      'Drop Earrings',
      'Dangle Earrings',
      'Ear Cuffs',
      'Huggie Earrings'
    ]
  },
  'bracelets': {
    name: 'Bracelets',
    subcategories: [
      'Cuff',
      'Tennis',
      'Charm',
      'Chain',
      'Beaded',
      'Link',
      'Bolo',
      'Leather',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional'
    ]
  },
  'bangles': {
    name: 'Bangles',
    subcategories: [
      'Classic',
      'Kada',
      'Cuff',
      'Openable',
      'Adjustable',
      'Charm',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Bridal',
      'Minimalist',
      'Traditional',
      'Temple',
      'Kundan',
      'Polki',
      'Navratna'
    ]
  },
  'watches': {
    name: 'Watches',
    subcategories: [
      "Men's Watches",
      "Women's Watches",
      'Smartwatches',
      'Luxury Watches',
      'Sport Watches'
    ]
  },
  'mens': {
    name: "Men's Jewellery",
    subcategories: [
      'Rings',
      'Bracelets', 
      'Necklaces',
      'Cufflinks',
      'Tie Clips'
    ]
  },
  'children': {
    name: "Children's Jewellery",
    subcategories: [
      "Kids' Rings",
      "Kids' Necklaces",
      "Kids' Earrings",
      "Kids' Bracelets"
    ]
  },
  'materials': {
    name: 'Materials',
    subcategories: [
      'Gold Jewellery',
      'Silver Jewellery',
      'Platinum Jewellery',
      'Diamond Jewellery',
      'Gemstone Jewellery',
      'Pearl Jewellery'
    ]
  },
  'collections': {
    name: 'Collections',
    subcategories: [
      'Bridal Collection',
      'Vintage Collection',
      'Contemporary Collection',
      'Minimalist Collection',
      'Celebrity Collection'
    ]
  },
  'custom': {
    name: 'Custom Jewellery',
    subcategories: [
      'Design Your Own',
      'Engraving Services',
      'Repairs & Restorations'
    ]
  },
  'new_arrivals': {
    name: 'New Arrivals',
    subcategories: [
      'Latest Products',
      'Featured Items',
      'Trending Now',
      'Exclusive Pieces'
    ]
  },
  'gold_coins': {
    name: 'Gold Coins',
    subcategories: [
      'Investment',
      'Religious',
      'Customized',
      'Occasion',
      'Corporate Gifting',
      'Collectible',
      'Plain',
      'Hallmarked'
    ]
  }
};

interface CategoryWithChildren extends Category {
  children?: Category[];
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
}

const defaultFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parentId: null,
  displayOrder: 0,
  isActive: true,
};

export default function CategoryManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<CategoryWithChildren[]>({
    queryKey: ['/api/categories'],
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Update slug when name changes
  useEffect(() => {
    if (formData.name && !editingCategory) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }));
    }
  }, [formData.name, editingCategory]);

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Category created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsFormOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating category',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCategory> }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Category updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsFormOpen(false);
      setEditingCategory(null);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating category',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Category deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting category',
        description: error.message || 'Category may have subcategories or be used by products',
        variant: 'destructive'
      });
    },
  });

  // Bulk import categories mutation
  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      
      // First create all main categories
      for (const [key, category] of Object.entries(HOME_CATEGORIES)) {
        const mainCategoryData = {
          name: category.name,
          slug: key,
          description: `${category.name} collection - premium jewelry items`,
          parentId: null,
          displayOrder: 0,
          isActive: true,
        };

        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(mainCategoryData)
        });
        
        if (response.ok) {
          const createdCategory = await response.json();
          results.push(createdCategory);

          // Create subcategories for this main category
          for (let i = 0; i < category.subcategories.length; i++) {
            const subCat = category.subcategories[i];
            const subCategoryData = {
              name: subCat,
              slug: `${key}-${subCat.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')}`,
              description: `${subCat} in ${category.name}`,
              parentId: createdCategory.id,
              displayOrder: i,
              isActive: true,
            };

            const subResponse = await fetch('/api/categories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(subCategoryData)
            });

            if (subResponse.ok) {
              const createdSubCategory = await subResponse.json();
              results.push(createdSubCategory);
            }
          }
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      toast({ 
        title: 'Categories imported successfully!', 
        description: `Created ${results.length} categories and subcategories`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error importing categories',
        description: error.message || 'Some categories may already exist',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData: InsertCategory = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      parentId: formData.parentId || undefined,
      displayOrder: formData.displayOrder,
      isActive: formData.isActive,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || null,
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: CategoryWithChildren, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = level * 20;

    return (
      <div key={category.id} className="mb-2">
        <div 
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(category.id)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{category.name}</span>
                {!category.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {hasChildren && (
                  <Badge variant="outline">
                    {category.children?.length} subcategories
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Slug: {category.slug}
                {category.description && (
                  <span> • {category.description}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(category)}
              data-testid={`button-edit-${category.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(category.id)}
              className="text-red-600 hover:text-red-700"
              data-testid={`button-delete-${category.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAllCategories = (categories: CategoryWithChildren[]): Category[] => {
    const result: Category[] = [];
    const traverse = (cats: CategoryWithChildren[]) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children) {
          traverse(cat.children);
        }
      });
    };
    traverse(categories);
    return result;
  };

  const mainCategories = getAllCategories(categories).filter(cat => !cat.parentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-gray-600 mt-1">
            Manage your jewelry categories and subcategories
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  setFormData(defaultFormData);
                }}
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            
            <Button 
              onClick={() => {
                if (confirm('This will import all standard jewelry categories and subcategories. Continue?')) {
                  bulkImportMutation.mutate();
                }
              }}
              variant="outline"
              disabled={bulkImportMutation.isPending}
              data-testid="button-bulk-import"
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import Standard Categories'}
            </Button>
          </div>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Rings, Necklaces"
                  required
                  data-testid="input-category-name"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., rings, necklaces"
                  required
                  data-testid="input-category-slug"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Auto-generated from name. Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <Label htmlFor="parentId">Parent Category</Label>
                <Select 
                  value={formData.parentId || "none"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value === "none" ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent (Main Category)</SelectItem>
                    {mainCategories.map(category => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        disabled={editingCategory?.id === category.id}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this category"
                  rows={3}
                  data-testid="input-category-description"
                />
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="input-category-order"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  data-testid="checkbox-category-active"
                />
                <Label htmlFor="isActive">Category is active</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found. Create your first category to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}