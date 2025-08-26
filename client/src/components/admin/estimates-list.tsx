import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, Calendar, User, Package, Calculator, Edit, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Estimate {
  id: string;
  quotationNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productName: string;
  category: string;
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
  subtotal: string;
  totalAmount: string;
  currency: string;
  validUntil: string;
  status: string;
  sentToWhatsApp: boolean;
  createdAt: string;
}

export function EstimatesList() {
  console.log('🔥 EstimatesList - Component rendering');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  // Get token from localStorage for authentication
  const token = localStorage.getItem("token");
  
  // Check authentication - redirect if not logged in
  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              You need to be logged in as an admin to view estimates.
            </p>
            <Button
              onClick={() => setLocation('/login')}
              className="bg-red-800 hover:bg-red-700 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch estimates from the API
  const { data: estimates, isLoading, error } = useQuery<Estimate[]>({
    queryKey: ['/api/estimates'],
    enabled: !!token,
  });

  // Mutation to delete estimate
  const deleteEstimateMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      return apiRequest(`/api/estimates/${estimateId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete estimate error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete estimate",
      });
    }
  });

  // Mutation to send estimate to WhatsApp
  const sendToWhatsAppMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const response = await apiRequest(`/api/estimates/${estimateId}/send-whatsapp`, 'POST');
      return response.json();
    },
    onSuccess: (data: { whatsappUrl: string; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      
      // Open WhatsApp with the generated URL
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Success",
        description: "Opening WhatsApp with estimate details...",
      });
    },
    onError: (error) => {
      console.error('WhatsApp send error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send estimate to WhatsApp",
      });
    }
  });

  const handleEditEstimate = (estimate: Estimate) => {
    // Store estimate data in localStorage for editing
    localStorage.setItem('editEstimate', JSON.stringify(estimate));
    setLocation('/estimates?tab=create');
  };

  // Filter estimates based on search query
  const filteredEstimates = estimates?.filter(estimate =>
    estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.customerPhone.includes(searchQuery) ||
    estimate.quotationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.productName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">Failed to load estimates. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by customer name, phone, quotation number, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-rose-500 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Estimates Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredEstimates.length} of {estimates?.length || 0} estimates
        </p>
      </div>

      {/* Estimates List */}
      {filteredEstimates.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first estimate to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="border border-gray-200 hover:border-rose-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      {estimate.quotationNo}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{estimate.customerName}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{estimate.customerPhone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-rose-800">
                      {estimate.currency === 'INR' ? '₹' : 'BHD '}{Number(estimate.totalAmount).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Valid until: {new Date(estimate.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Product Details</span>
                    </div>
                    <p className="text-gray-900 font-medium">{estimate.productName}</p>
                    <p className="text-sm text-gray-600">{estimate.purity} • {estimate.category}</p>
                    <p className="text-sm text-gray-600">Code: {estimate.productCode}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Weight & Pricing</span>
                    </div>
                    <p className="text-sm text-gray-600">Gross: {estimate.grossWeight}g</p>
                    <p className="text-sm text-gray-600">Net: {estimate.netWeight}g</p>
                    <p className="text-sm text-gray-600">Metal: {estimate.currency === 'INR' ? '₹' : 'BHD '}{Number(estimate.metalValue).toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Status</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit ${
                        estimate.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        estimate.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {estimate.status}
                      </span>
                      {estimate.sentToWhatsApp && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 w-fit">
                          <MessageCircle className="h-3 w-3" />
                          Sent to WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEstimate(estimate)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendToWhatsAppMutation.mutate(estimate.id)}
                    disabled={sendToWhatsAppMutation.isPending}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {sendToWhatsAppMutation.isPending ? 'Sending...' : 'Send to WhatsApp'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEstimateMutation.mutate(estimate.id)}
                    disabled={deleteEstimateMutation.isPending}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {deleteEstimateMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}