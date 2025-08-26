import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface EstimateFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productName: string;
  category: string;
  subCategory: string;
  purity: string;
  grossWeight: string;
  netWeight: string;
  productCode: string;
  metalValue: string;
  makingChargesPercentage: string;
  makingCharges: string;
  stoneDiamondChargesPercentage: string;
  stoneDiamondCharges: string;
  wastagePercentage: string;
  wastageCharges: string;
  hallmarkingCharges: string;
  gstPercentage: string;
  gstAmount: string;
  vatPercentage: string;
  vatAmount: string;
  subtotal: string;
  totalAmount: string;
  validUntil: string;
  currency: string;
}

// Categories structure for estimates
const HOME_CATEGORIES = {
  'rings': {
    name: 'Rings 💍',
    subcategories: [
      'Engagement Rings',
      'Wedding Bands',
      'Couple Rings',
      'Cocktail Party Rings',
      'Daily Wear Rings',
      'Mens Rings'
    ]
  },
  'necklaces': {
    name: 'Necklaces 📿',
    subcategories: [
      'Chains',
      'Chokers',
      'Lockets',
      'Beaded Necklaces',
      'Collars',
      'Long Necklaces Opera Chains',
      'Multi Layered Necklaces'
    ]
  },
  'earrings': { 
    name: 'Earrings 🌸',
    subcategories: [
      'Studs',
      'Hoops',
      'Drops Danglers',
      'Chandbalis',
      'Jhumkas',
      'Ear Cuffs',
      'Kids Earrings'
    ]
  },
  'bracelets': {
    name: 'Bracelets 🔗',
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
    name: 'Bangles 💫',
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
  'pendants': {
    name: 'Pendants ✨',
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
  'mangalsutra': {
    name: 'Mangalsutra & Thali Chains 🖤',
    subcategories: [
      'Traditional Mangalsutra',
      'Modern Mangalsutra',
      'Thali Thirumangalyam Chains'
    ]
  },
  'nose jewellery': {
    name: 'Nose Jewellery 👃',
    subcategories: [
      'Nose Pins',
      'Nose Rings Nath',
      'Septum Rings'
    ]
  },
  'anklets & toe rings': {
    name: 'Anklets & Toe Rings 👣',
    subcategories: [
      'Silver Anklets',
      'Beaded Anklets',
      'Bridal Toe Rings',
      'Daily Wear Toe Rings'
    ]
  },
  'brooches & pins': {
    name: 'Brooches & Pins 🎀',
    subcategories: [
      'Saree Pins',
      'Suit Brooches',
      'Bridal Brooches',
      'Cufflinks',
      'Tie Pins'
    ]
  },
  'kids jewellery': {
    name: 'Kids Jewellery 🧒',
    subcategories: [
      'Baby Bangles',
      'Nazariya Bracelets',
      'Kids Earrings',
      'Kids Chains',
      'Kids Rings'
    ]
  },
  'bridal & special collections': {
    name: 'Bridal & Special Collections 👰',
    subcategories: [
      'Bridal Sets',
      'Temple Jewellery Sets',
      'Antique Jewellery Collections',
      'Custom Made Jewellery'
    ]
  },
  'shop by material / gemstone': {
    name: 'Shop by Material / Gemstone 💎',
    subcategories: [
      'Gold Jewellery 22K 18K 14K',
      'Silver Jewellery Sterling Oxidized',
      'Platinum Jewellery',
      'Diamond Jewellery',
      'Gemstone Jewellery',
      'Pearl Jewellery',
      'Fashion Artificial Jewellery'
    ]
  }
};

export function EstimateForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);

  const [formData, setFormData] = useState<EstimateFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    productName: "",
    category: "",
    subCategory: "",
    purity: "22K",
    grossWeight: "",
    netWeight: "",
    productCode: "",
    metalValue: "",
    makingChargesPercentage: "15",
    makingCharges: "",
    stoneDiamondChargesPercentage: "0",
    stoneDiamondCharges: "0",
    wastagePercentage: "2",
    wastageCharges: "",
    hallmarkingCharges: "450",
    gstPercentage: "3",
    gstAmount: "",
    vatPercentage: "1",
    vatAmount: "",
    subtotal: "",
    totalAmount: "",
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    currency: "INR"
  });

  // Check for edit estimate data in localStorage
  useEffect(() => {
    const editEstimateData = localStorage.getItem('editEstimate');
    if (editEstimateData) {
      try {
        const estimateData = JSON.parse(editEstimateData);
        
        setFormData({
          customerName: estimateData.customerName || "",
          customerPhone: estimateData.customerPhone || "",
          customerEmail: estimateData.customerEmail || "",
          productName: estimateData.productName || "",
          category: estimateData.category || "",
          subCategory: estimateData.subCategory || "",
          purity: estimateData.purity || "22K",
          grossWeight: estimateData.grossWeight || "",
          netWeight: estimateData.netWeight || "",
          productCode: estimateData.productCode || "",
          metalValue: estimateData.metalValue || "",
          makingChargesPercentage: estimateData.makingChargesPercentage || "15",
          makingCharges: estimateData.makingCharges || "",
          stoneDiamondChargesPercentage: estimateData.stoneDiamondChargesPercentage || "0",
          stoneDiamondCharges: estimateData.stoneDiamondCharges || "0",
          wastagePercentage: estimateData.wastagePercentage || "2",
          wastageCharges: estimateData.wastageCharges || "",
          hallmarkingCharges: estimateData.hallmarkingCharges || "450",
          gstPercentage: estimateData.gstPercentage || "3",
          gstAmount: estimateData.gstAmount || "",
          vatPercentage: estimateData.vatPercentage || "1",
          vatAmount: estimateData.vatAmount || "",
          subtotal: estimateData.subtotal || "",
          totalAmount: estimateData.totalAmount || "",
          validUntil: estimateData.validUntil ? new Date(estimateData.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currency: estimateData.currency || "INR"
        });
        
        setIsEditMode(true);
        setEditingEstimateId(estimateData.id);
        
        // Clear the edit data from localStorage after loading
        localStorage.removeItem('editEstimate');
        
        toast({
          title: "Edit Mode",
          description: "Estimate loaded for editing. Make your changes and update the estimate.",
        });
      } catch (error) {
        console.error('Error loading edit estimate data:', error);
        localStorage.removeItem('editEstimate');
      }
    }
  }, []);

  // Auto-generate product code when category and subcategory are selected
  useEffect(() => {
    if (formData.category && formData.subCategory) {
      generateProductCodeForEstimate();
    } else {
      setFormData(prev => ({ ...prev, productCode: "" }));
    }
  }, [formData.category, formData.subCategory]);

  // Auto-populate product name when purity and subcategory are selected
  useEffect(() => {
    if (formData.purity && formData.subCategory) {
      const autoGeneratedName = `${formData.purity} ${formData.subCategory}`;
      setFormData(prev => ({ ...prev, productName: autoGeneratedName }));
    }
  }, [formData.purity, formData.subCategory]);

  const generateProductCodeForEstimate = async () => {
    if (!formData.category || !formData.subCategory) return;
    
    try {
      // Generate product code on frontend for estimates (similar to backend logic)
      const getCategoryAbbreviation = (category: string): string => {
        const categoryMappings: { [key: string]: string } = {
          'rings': 'RN',
          'necklaces': 'NK', 
          'earrings': 'ER',
          'bracelets': 'BR',
          'bangles': 'BG',
          'pendants': 'PD',
          'mangalsutra': 'MS',
          'nose jewellery': 'NJ',
          'anklets & toe rings': 'AN',
          'brooches & pins': 'BP',
          'kids jewellery': 'KJ',
          'bridal & special collections': 'SC',
          'shop by material / gemstone': 'MT'
        };
        return categoryMappings[category.toLowerCase()] || 'GN';
      };

      const getSubCategoryAbbreviation = (category: string, subCategory: string): string => {
        const categoryKey = category.toLowerCase();
        const subCategoryKey = subCategory.toLowerCase();
        
        const subCategoryMappings: { [category: string]: { [subCategory: string]: string } } = {
          'rings': {
            'engagement rings': 'ENG', 'wedding bands': 'WB', 'couple rings': 'CR',
            'cocktail party rings': 'CPR', 'daily wear rings': 'DWR', 'mens rings': 'MR'
          },
          'necklaces': {
            'chains': 'CHN', 'chokers': 'CH', 'lockets': 'LK', 'beaded necklaces': 'BD',
            'collars': 'COL', 'long necklaces opera chains': 'LON', 'multi layered necklaces': 'MLN'
          },
          'earrings': {
            'studs': 'ST', 'hoops': 'HP', 'drops danglers': 'DR', 'chandbalis': 'CHB',
            'jhumkas': 'JK', 'ear cuffs': 'EC', 'kids earrings': 'KER'
          },
          'bracelets': {
            'cuff': 'CF', 'tennis': 'TN', 'charm': 'CM', 'chain': 'CHN', 'beaded': 'BD',
            'link': 'LK', 'bolo': 'BL', 'leather': 'LTH', 'diamond': 'DM', 'gemstone': 'GS',
            'pearl': 'PRL', 'bridal': 'BDL', 'minimalist': 'MIN', 'traditional': 'TRD'
          },
          'bangles': {
            'classic': 'CL', 'kada': 'KD', 'cuff': 'CF', 'openable': 'OP', 'adjustable': 'ADJ',
            'charm': 'CM', 'diamond': 'DM', 'gemstone': 'GS', 'pearl': 'PRL', 'bridal': 'BDL',
            'minimalist': 'MIN', 'traditional': 'TRD', 'temple': 'TMP', 'kundan': 'KND',
            'polki': 'PLK', 'navratna': 'NVR'
          },
          'pendants': {
            'solitaire': 'SOL', 'halo': 'HL', 'cluster': 'CLT', 'heart': 'HRT', 'cross': 'CRS',
            'initial': 'INI', 'diamond': 'DM', 'gemstone': 'GS', 'pearl': 'PRL', 'bridal': 'BDL',
            'minimalist': 'MIN', 'traditional': 'TRD'
          },
          'mangalsutra': {
            'traditional mangalsutra': 'TMS', 'modern mangalsutra': 'MMS', 'thali thirumangalyam chains': 'TTC'
          },
          'nose jewellery': {
            'nose pins': 'NP', 'nose rings nath': 'NR', 'septum rings': 'SR'
          },
          'anklets & toe rings': {
            'silver anklets': 'SA', 'beaded anklets': 'BA', 'bridal toe rings': 'BTR', 'daily wear toe rings': 'DTR'
          },
          'brooches & pins': {
            'saree pins': 'SP', 'suit brooches': 'SB', 'bridal brooches': 'BB', 'cufflinks': 'CLF', 'tie pins': 'TP'
          },
          'kids jewellery': {
            'baby bangles': 'BBG', 'nazariya bracelets': 'NZB', 'kids earrings': 'KER', 'kids chains': 'KCH', 'kids rings': 'KRG'
          },
          'bridal & special collections': {
            'bridal sets': 'BDS', 'temple jewellery sets': 'TJS', 'antique jewellery collections': 'AJC', 'custom made jewellery': 'CMJ'
          },
          'shop by material / gemstone': {
            'gold jewellery 22k 18k 14k': 'GLD', 'silver jewellery sterling oxidized': 'SLV', 'platinum jewellery': 'PLT',
            'diamond jewellery': 'DMJ', 'gemstone jewellery': 'GSJ', 'pearl jewellery': 'PRJ', 'fashion artificial jewellery': 'FAJ'
          }
        };
        
        const categoryMapping = subCategoryMappings[categoryKey];
        return categoryMapping?.[subCategoryKey] || 'GN';
      };

      const categoryAbbr = getCategoryAbbreviation(formData.category);
      const subCategoryAbbr = getSubCategoryAbbreviation(formData.category, formData.subCategory);
      const year = new Date().getFullYear();
      // Now fetch actual products to get real product codes
      const response = await fetch("/api/products", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const products = await response.json();
      
      // Find a product with matching category and subcategory
      const matchingProduct = products.find((product: any) => 
        product.category.toLowerCase() === formData.category.toLowerCase() && 
        product.subCategory?.toLowerCase() === formData.subCategory.toLowerCase()
      );
      
      if (matchingProduct && matchingProduct.productCode) {
        // Use the existing product's code
        setFormData(prev => ({ ...prev, productCode: matchingProduct.productCode }));
        return; // Exit here since we found and set the code
      }
      
      // If no matching product found, still generate code for now
      const sequence = Math.floor(Math.random() * 999) + 1;
      
      const generatedCode = `PJ-${categoryAbbr}-${subCategoryAbbr}-${year}-${String(sequence).padStart(3, '0')}`;
      
      setFormData(prev => ({ ...prev, productCode: generatedCode }));
    } catch (error) {
      console.error('Error generating product code:', error);
    }
  };

  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      // Ensure all numeric fields are properly formatted (convert empty strings to "0")
      const cleanedData = {
        ...data,
        grossWeight: data.grossWeight || "0",
        netWeight: data.netWeight || "0",
        metalValue: data.metalValue || "0",
        makingCharges: data.makingCharges || "0",
        stoneDiamondCharges: data.stoneDiamondCharges || "0",
        wastageCharges: data.wastageCharges || "0",
        hallmarkingCharges: data.hallmarkingCharges || "0",
        gstAmount: data.gstAmount || "0",
        vatAmount: data.vatAmount || "0",
        subtotal: data.subtotal || "0",
        totalAmount: data.totalAmount || "0",
        validUntil: data.validUntil,
      };
      
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cleanedData),
      });
      if (!response.ok) {
        throw new Error("Failed to create estimate");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Estimate created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        productName: "",
        category: "",
        subCategory: "",
        purity: "22K",
        grossWeight: "",
        netWeight: "",
        productCode: "",
        metalValue: "",
        makingChargesPercentage: "15",
        makingCharges: "",
        stoneDiamondChargesPercentage: "0",
        stoneDiamondCharges: "0",
        wastagePercentage: "2",
        wastageCharges: "",
        hallmarkingCharges: "450",
        gstPercentage: "3",
        gstAmount: "",
        vatPercentage: "1",
        vatAmount: "",
        subtotal: "",
        totalAmount: "",
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: "INR"
      });
      // Redirect to estimates section in admin dashboard
      setLocation('/admin?tab=estimates');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const cleanedData = {
        ...data,
        grossWeight: data.grossWeight || "0",
        netWeight: data.netWeight || "0",
        metalValue: data.metalValue || "0",
        makingCharges: data.makingCharges || "0",
        stoneDiamondCharges: data.stoneDiamondCharges || "0",
        wastageCharges: data.wastageCharges || "0",
        hallmarkingCharges: data.hallmarkingCharges || "0",
        gstAmount: data.gstAmount || "0",
        vatAmount: data.vatAmount || "0",
        subtotal: data.subtotal || "0",
        totalAmount: data.totalAmount || "0",
        validUntil: data.validUntil,
      };
      
      const response = await fetch(`/api/estimates/${editingEstimateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cleanedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update estimate");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Estimate updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      resetForm();
      setLocation('/estimates?tab=list');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      productName: "",
      category: "",
      subCategory: "",
      purity: "22K",
      grossWeight: "",
      netWeight: "",
      productCode: "",
      metalValue: "",
      makingChargesPercentage: "15",
      makingCharges: "",
      stoneDiamondChargesPercentage: "0",
      stoneDiamondCharges: "0",
      wastagePercentage: "2",
      wastageCharges: "",
      hallmarkingCharges: "450",
      gstPercentage: "3",
      gstAmount: "",
      vatPercentage: "1",
      vatAmount: "",
      subtotal: "",
      totalAmount: "",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "INR"
    });
    setIsEditMode(false);
    setEditingEstimateId(null);
  };

  const calculatePricing = () => {
    const metalVal = parseFloat(formData.metalValue) || 0;
    const makingPercent = parseFloat(formData.makingChargesPercentage) || 0;
    const stonePercent = parseFloat(formData.stoneDiamondChargesPercentage) || 0;
    const wastagePercent = parseFloat(formData.wastagePercentage) || 0;
    const hallmarking = parseFloat(formData.hallmarkingCharges) || 0;
    const gstPercent = parseFloat(formData.gstPercentage) || 0;
    const vatPercent = parseFloat(formData.vatPercentage) || 0;

    const makingCharges = (metalVal * makingPercent) / 100;
    const stoneCharges = (metalVal * stonePercent) / 100;
    const wastageCharges = (metalVal * wastagePercent) / 100;
    const subtotal = metalVal + makingCharges + stoneCharges + wastageCharges + hallmarking;
    
    const gstAmount = (subtotal * gstPercent) / 100;
    const vatAmount = (subtotal * vatPercent) / 100;
    const totalAmount = subtotal + gstAmount + vatAmount;

    setFormData(prev => ({
      ...prev,
      makingCharges: makingCharges.toFixed(2),
      stoneDiamondCharges: stoneCharges.toFixed(2),
      wastageCharges: wastageCharges.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      subtotal: subtotal.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.productName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode) {
      updateEstimateMutation.mutate(formData);
    } else {
      createEstimateMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof EstimateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Button
        variant="ghost"
        onClick={() => setLocation('/admin')}
        className="mb-4 text-luxury-black hover:bg-champagne/20 border border-gold/30"
        data-testid="button-back-to-dashboard-form"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Button>
      <Card className="border-2 border-gold bg-gradient-to-r from-cream to-champagne/30 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Calculator className="h-6 w-6 text-yellow-600" />
            <span>{isEditMode ? 'Edit Customer Estimate' : 'Create Customer Estimate'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => {
                    handleInputChange("category", value);
                    // Reset subcategory when category changes
                    setFormData(prev => ({ ...prev, subCategory: "", productCode: "" }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(HOME_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Select 
                    value={formData.subCategory} 
                    onValueChange={(value) => handleInputChange("subCategory", value)}
                    disabled={!formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.category ? "Select Sub Category" : "Select Category First"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category && HOME_CATEGORIES[formData.category as keyof typeof HOME_CATEGORIES]?.subcategories.map((subCat) => (
                        <SelectItem key={subCat} value={subCat}>
                          {subCat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purity">Purity</Label>
                  <Select value={formData.purity} onValueChange={(value) => handleInputChange("purity", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24K">24K Gold</SelectItem>
                      <SelectItem value="22K">22K Gold</SelectItem>
                      <SelectItem value="18K">18K Gold</SelectItem>
                      <SelectItem value="916">916 Hallmark</SelectItem>
                      <SelectItem value="999">999 Silver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange("productName", e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productCode">Product Code</Label>
                  <Input
                    id="productCode"
                    value={formData.productCode}
                    placeholder="Select category and subcategory to fetch product code"
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="grossWeight">Gross Weight (g)</Label>
                  <Input
                    id="grossWeight"
                    type="number"
                    step="0.01"
                    value={formData.grossWeight}
                    onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                    placeholder="Enter gross weight"
                  />
                </div>
                <div>
                  <Label htmlFor="netWeight">Net Weight (g)</Label>
                  <Input
                    id="netWeight"
                    type="number"
                    step="0.01"
                    value={formData.netWeight}
                    onChange={(e) => handleInputChange("netWeight", e.target.value)}
                    placeholder="Enter net weight"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Calculation */}
            <div className="bg-gradient-to-r from-gray-100 to-yellow-100 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
                Pricing Calculation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="metalValue">Metal Value (₹)</Label>
                  <Input
                    id="metalValue"
                    type="number"
                    step="0.01"
                    value={formData.metalValue}
                    onChange={(e) => handleInputChange("metalValue", e.target.value)}
                    placeholder="Enter metal value"
                  />
                </div>

                <div>
                  <Label htmlFor="makingChargesPercentage">Making Charges (%)</Label>
                  <Input
                    id="makingChargesPercentage"
                    type="number"
                    step="0.01"
                    value={formData.makingChargesPercentage}
                    onChange={(e) => handleInputChange("makingChargesPercentage", e.target.value)}
                    placeholder="Making charges percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="stoneDiamondChargesPercentage">Stone/Diamond Charges (%)</Label>
                  <Input
                    id="stoneDiamondChargesPercentage"
                    type="number"
                    step="0.01"
                    value={formData.stoneDiamondChargesPercentage}
                    onChange={(e) => handleInputChange("stoneDiamondChargesPercentage", e.target.value)}
                    placeholder="Stone charges percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="wastagePercentage">Wastage (%)</Label>
                  <Input
                    id="wastagePercentage"
                    type="number"
                    step="0.01"
                    value={formData.wastagePercentage}
                    onChange={(e) => handleInputChange("wastagePercentage", e.target.value)}
                    placeholder="Wastage percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="hallmarkingCharges">Hallmarking Charges (₹)</Label>
                  <Input
                    id="hallmarkingCharges"
                    type="number"
                    step="0.01"
                    value={formData.hallmarkingCharges}
                    onChange={(e) => handleInputChange("hallmarkingCharges", e.target.value)}
                    placeholder="Hallmarking charges"
                  />
                </div>
                <div>
                  <Label htmlFor="gstPercentage">GST (%)</Label>
                  <Input
                    id="gstPercentage"
                    type="number"
                    step="0.01"
                    value={formData.gstPercentage}
                    onChange={(e) => handleInputChange("gstPercentage", e.target.value)}
                    placeholder="GST percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="vatPercentage">VAT (%)</Label>
                  <Input
                    id="vatPercentage"
                    type="number"
                    step="0.01"
                    value={formData.vatPercentage}
                    onChange={(e) => handleInputChange("vatPercentage", e.target.value)}
                    placeholder="VAT percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange("validUntil", e.target.value)}
                  />
                </div>
              </div>
              
              <Button
                type="button"
                onClick={calculatePricing}
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Calculate Pricing
              </Button>

              {/* Calculated Values Display */}
              {formData.totalAmount && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">Calculated Pricing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">

                    <div>
                      <span className="text-gray-600">Stone Charges:</span>
                      <div className="font-semibold">₹{formData.stoneDiamondCharges}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Wastage:</span>
                      <div className="font-semibold">₹{formData.wastageCharges}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">GST:</span>
                      <div className="font-semibold">₹{formData.gstAmount}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">VAT:</span>
                      <div className="font-semibold">₹{formData.vatAmount}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Subtotal:</span>
                      <div className="font-semibold">₹{formData.subtotal}</div>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 border-t pt-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <div className="text-xl font-bold text-yellow-600">₹{formData.totalAmount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {isEditMode && (
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-600 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                type="submit"
                className={`${isEditMode ? 'flex-1' : 'w-full'} bg-rose-800 hover:bg-rose-700 text-rose-100 font-semibold py-3 rounded-lg shadow-lg border border-rose-700 transition-all`}
                disabled={createEstimateMutation.isPending || updateEstimateMutation.isPending}
              >
                {createEstimateMutation.isPending ? "Creating Estimate..." : 
                 updateEstimateMutation.isPending ? "Updating Estimate..." : 
                 isEditMode ? "Update Estimate" : "Create Estimate"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}