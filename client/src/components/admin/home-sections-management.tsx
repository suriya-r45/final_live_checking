import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Settings, Eye, EyeOff, Move, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import type { HomeSection, Product, HomeSectionItem } from "@shared/schema";

interface HomeSectionWithItems extends HomeSection {
  items: HomeSectionItemWithProduct[];
}

interface HomeSectionItemWithProduct extends HomeSectionItem {
  product: Product;
}

interface CreateHomeSectionData {
  title: string;
  subtitle: string;
  description: string;
  layoutType: 'grid' | 'featured' | 'mixed';
  isActive: boolean;
  displayOrder: number;
  backgroundColor: string;
  textColor: string;
}

interface AddSectionItemData {
  productId: string;
  displayName?: string;
  displayPrice?: string;
  displayPriceInr?: string;
  displayPriceBhd?: string;
  position: number;
  size: 'small' | 'normal' | 'large';
}

export function HomeSectionsManagement() {
  const [activeTab, setActiveTab] = useState("sections");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addingItemToSection, setAddingItemToSection] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: homeSections, isLoading: sectionsLoading } = useQuery<HomeSectionWithItems[]>({
    queryKey: ["/api/home-sections"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/home-sections");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 0, // Always refetch to get latest products
    refetchOnWindowFocus: true,
  });

  // Mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: CreateHomeSectionData) => {
      const response = await apiRequest("POST", "/api/home-sections", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Refresh products too
      toast({ title: "Success", description: "Home section created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create home section" });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateHomeSectionData> }) => {
      const response = await apiRequest("PUT", `/api/home-sections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] });
      toast({ title: "Success", description: "Home section updated successfully" });
      setEditingSectionId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update home section" });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/home-sections/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] });
      toast({ title: "Success", description: "Home section deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete home section" });
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: AddSectionItemData }) => {
      const response = await apiRequest("POST", `/api/home-sections/${sectionId}/items`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] });
      toast({ title: "Success", description: "Product added to section successfully" });
      setAddingItemToSection("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add product to section" });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ sectionId, itemId }: { sectionId: string; itemId: string }) => {
      const response = await apiRequest("DELETE", `/api/home-sections/${sectionId}/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] });
      toast({ title: "Success", description: "Product removed from section successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove product from section" });
    }
  });

  if (sectionsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="home-sections-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Custom Home Sections</h2>
          <p className="text-muted-foreground">Create and manage custom showcase sections for your homepage</p>
        </div>
        <CreateSectionDialog
          onCreate={(data) => createSectionMutation.mutate(data)}
          isLoading={createSectionMutation.isPending}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="sections">Manage Sections</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          {!homeSections || homeSections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No custom sections yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first custom home section to showcase products in unique layouts
                </p>
                <CreateSectionDialog
                  onCreate={(data) => createSectionMutation.mutate(data)}
                  isLoading={createSectionMutation.isPending}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {homeSections.map((section: HomeSectionWithItems) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  products={products || []}
                  onUpdate={(data) => updateSectionMutation.mutate({ id: section.id, data })}
                  onDelete={() => deleteSectionMutation.mutate(section.id)}
                  onAddItem={(data) => addItemMutation.mutate({ sectionId: section.id, data })}
                  onRemoveItem={(itemId) => removeItemMutation.mutate({ sectionId: section.id, itemId })}
                  isUpdating={updateSectionMutation.isPending}
                  isDeleting={deleteSectionMutation.isPending}
                  isAddingItem={addItemMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="rounded-lg border bg-background p-6">
            <h3 className="text-lg font-semibold mb-4">Homepage Preview</h3>
            <div className="space-y-8">
              {homeSections?.filter((section: HomeSectionWithItems) => section.isActive).map((section: HomeSectionWithItems) => (
                <div
                  key={section.id}
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: section.backgroundColor || '#fff8e1',
                    color: section.textColor || '#8b4513'
                  }}
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                    {section.subtitle && <p className="text-lg opacity-90">{section.subtitle}</p>}
                    {section.description && <p className="mt-2 opacity-80">{section.description}</p>}
                  </div>
                  
                  <div className={`grid gap-4 ${getLayoutClasses(section.layoutType, section.items.length)}`}>
                    {section.items.map((item: HomeSectionItemWithProduct, index: number) => (
                      <div
                        key={item.id}
                        className={`rounded-lg bg-background/10 p-4 ${getSizeClasses(item.size || 'normal')}`}
                      >
                        <div className="aspect-square bg-background/20 rounded-lg mb-3 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 opacity-50" />
                        </div>
                        <h4 className="font-semibold text-sm">
                          {item.displayName || item.product.name}
                        </h4>
                        <p className="text-sm opacity-80">
                          {item.displayPrice || `Starting from ${(section.textColor || '#8b4513') === '#FFFFFF' ? 'BHD' : '₹'} ${item.product.priceInr}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No active sections to preview</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateSectionDialog({ 
  onCreate, 
  isLoading 
}: { 
  onCreate: (data: CreateHomeSectionData) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateHomeSectionData>({
    title: "",
    subtitle: "",
    description: "",
    layoutType: "grid",
    isActive: true,
    displayOrder: 0,
    backgroundColor: "#fff8e1",
    textColor: "#8b4513"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setOpen(false);
    // Reset form
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      layoutType: "grid",
      isActive: true,
      displayOrder: 0,
      backgroundColor: "#fff8e1",
      textColor: "#8b4513"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-section-button">
          <Plus className="h-4 w-4 mr-2" />
          Create Section
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Home Section</DialogTitle>
          <DialogDescription>
            Design a custom section to showcase products in unique layouts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Section Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Diamond Jewellery"
                required
                data-testid="input-section-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layoutType">Layout Type *</Label>
              <Select
                value={formData.layoutType}
                onValueChange={(value: 'grid' | 'featured' | 'mixed') => 
                  setFormData(prev => ({ ...prev, layoutType: value }))
                }
              >
                <SelectTrigger data-testid="select-layout-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="featured">Featured Layout</SelectItem>
                  <SelectItem value="mixed">Mixed Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g., Sparkle through the events with timeless diamonds"
              data-testid="input-section-subtitle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for the section"
              data-testid="textarea-section-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                data-testid="input-background-color"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <Input
                id="textColor"
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                data-testid="input-text-color"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              data-testid="switch-section-active"
            />
            <Label htmlFor="isActive">Make section active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-create-section">
              {isLoading ? "Creating..." : "Create Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({ 
  section, 
  products, 
  onUpdate, 
  onDelete, 
  onAddItem, 
  onRemoveItem,
  isUpdating,
  isDeleting,
  isAddingItem
}: {
  section: HomeSectionWithItems;
  products: Product[];
  onUpdate: (data: Partial<CreateHomeSectionData>) => void;
  onDelete: () => void;
  onAddItem: (data: AddSectionItemData) => void;
  onRemoveItem: (itemId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isAddingItem: boolean;
}) {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <Card data-testid={`section-card-${section.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <Badge variant={section.isActive ? "default" : "secondary"}>
                {section.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{section.layoutType}</Badge>
            </div>
            {section.subtitle && <p className="text-sm text-muted-foreground">{section.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate({ isActive: !section.isActive })}
              disabled={isUpdating}
              data-testid={`button-toggle-${section.id}`}
            >
              {section.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddProduct(true)}
              disabled={isAddingItem}
              data-testid={`button-add-product-${section.id}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  data-testid={`button-delete-${section.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Section</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{section.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {section.items.length > 0 ? (
            <div className="grid gap-3">
              {section.items.map((item: HomeSectionItemWithProduct) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement as HTMLElement;
                            parent.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {item.displayName || item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.displayPriceInr || item.displayPrice || `₹${item.product.priceInr}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.size}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      data-testid={`button-remove-item-${item.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No products added yet</p>
            </div>
          )}
        </div>

        <AddProductDialog
          open={showAddProduct}
          onOpenChange={setShowAddProduct}
          products={products}
          onAdd={onAddItem}
          isLoading={isAddingItem}
          existingItems={section.items}
        />
      </CardContent>
    </Card>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  products,
  onAdd,
  isLoading,
  existingItems
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onAdd: (data: AddSectionItemData) => void;
  isLoading: boolean;
  existingItems: HomeSectionItemWithProduct[];
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayPriceInr, setDisplayPriceInr] = useState("");
  const [displayPriceBhd, setDisplayPriceBhd] = useState("");
  const [size, setSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [addToDefaultLayout, setAddToDefaultLayout] = useState(false);
  const [customizeLayout, setCustomizeLayout] = useState(false);

  const existingProductIds = existingItems.map(item => item.productId);
  const availableProducts = products.filter(p => !existingProductIds.includes(p.id));

  const handleSubmit = () => {
    if (!selectedProductId) return;
    
    onAdd({
      productId: selectedProductId,
      displayName: displayName || undefined,
      displayPrice: displayPriceInr || undefined, // Keep for backward compatibility
      displayPriceInr: displayPriceInr || undefined,
      displayPriceBhd: displayPriceBhd || undefined,
      position: existingItems.length,
      size
    });

    // Reset form
    setSelectedProductId("");
    setDisplayName("");
    setDisplayPriceInr("");
    setDisplayPriceBhd("");
    setSize('normal');
    setAddToDefaultLayout(false);
    setCustomizeLayout(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product to Section</DialogTitle>
          <DialogDescription>
            Select a product to showcase in this section
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger data-testid="select-product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ₹{product.priceInr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Custom Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Optional custom name"
                data-testid="input-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayPriceInr">Custom Display Price (INR)</Label>
              <Input
                id="displayPriceInr"
                value={displayPriceInr}
                onChange={(e) => setDisplayPriceInr(e.target.value)}
                placeholder="e.g., ₹ 1,23,456"
                data-testid="input-display-price-inr"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayPriceBhd">Custom Display Price (BHD)</Label>
            <Input
              id="displayPriceBhd"
              value={displayPriceBhd}
              onChange={(e) => setDisplayPriceBhd(e.target.value)}
              placeholder="e.g., BHD 500.750"
              data-testid="input-display-price-bhd"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Display Size</Label>
            <Select value={size} onValueChange={(value: 'small' | 'normal' | 'large') => setSize(value)}>
              <SelectTrigger data-testid="select-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large (Featured)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Layout Options */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Layout Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addToDefaultLayout"
                  checked={addToDefaultLayout}
                  onCheckedChange={(checked) => setAddToDefaultLayout(checked === true)}
                  data-testid="checkbox-add-to-default"
                />
                <Label 
                  htmlFor="addToDefaultLayout"
                  className="text-sm font-normal cursor-pointer"
                >
                  Add to default layout
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customizeLayout"
                  checked={customizeLayout}
                  onCheckedChange={(checked) => setCustomizeLayout(checked === true)}
                  data-testid="checkbox-customize-layout"
                />
                <Label 
                  htmlFor="customizeLayout"
                  className="text-sm font-normal cursor-pointer"
                >
                  Customize layout
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedProductId || isLoading}
            data-testid="button-add-product"
          >
            {isLoading ? "Adding..." : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getLayoutClasses(layoutType: string, itemCount: number): string {
  switch (layoutType) {
    case 'grid':
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    case 'featured':
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 'mixed':
      return 'grid-cols-2 md:grid-cols-4';
    default:
      return 'grid-cols-2 md:grid-cols-3';
  }
}

function getSizeClasses(size: string): string {
  switch (size) {
    case 'small':
      return 'col-span-1';
    case 'large':
      return 'col-span-2 row-span-2';
    default:
      return 'col-span-1';
  }
}