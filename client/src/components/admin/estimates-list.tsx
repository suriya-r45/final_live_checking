import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, Calendar, User, Package, Calculator, Edit } from "lucide-react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["/api/estimates"],
    queryFn: async () => {
      const response = await fetch("/api/estimates", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch estimates");
      }
      return response.json();
    },
  });

  const sendToWhatsAppMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const response = await fetch(`/api/estimates/${estimateId}/send-whatsapp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to send to WhatsApp");
      }
      return response.json();
    },
    onSuccess: (data: { whatsappUrl: string; message: string }) => {
      toast({
        title: "Success",
        description: "Estimate sent to WhatsApp successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      
      // Open WhatsApp URL
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send estimate to WhatsApp.",
        variant: "destructive",
      });
    },
  });

  const filteredEstimates = estimates.filter((estimate: Estimate) =>
    estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.quotationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Estimates</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 text-gray-400 h-4 w-4" style={{transform: 'translateY(-50%)'}} />
            <Input
              placeholder="Search estimates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {filteredEstimates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No estimates found</h3>
            <p className="text-gray-500">
              {searchQuery ? "No estimates match your search criteria." : "Start creating estimates for your customers."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEstimates.map((estimate: Estimate) => (
            <Card key={estimate.id} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {estimate.quotationNo}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(estimate.status)}`}>
                      {estimate.status}
                    </span>
                    {estimate.sentToWhatsApp && (
                      <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Sent to WhatsApp
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Customer Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Name:</span> {estimate.customerName}</div>
                      <div><span className="text-gray-600">Phone:</span> {estimate.customerPhone}</div>
                      {estimate.customerEmail && (
                        <div><span className="text-gray-600">Email:</span> {estimate.customerEmail}</div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {new Date(estimate.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Product Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Product:</span> {estimate.productName}</div>
                      <div><span className="text-gray-600">Category:</span> {estimate.category}</div>
                      <div><span className="text-gray-600">Purity:</span> {estimate.purity}</div>
                      <div><span className="text-gray-600">Net Weight:</span> {estimate.netWeight}g</div>
                      <div><span className="text-gray-600">Product Code:</span> {estimate.productCode}</div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <Calculator className="h-4 w-4 mr-2" />
                      Pricing Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Metal Value:</span> ₹{parseFloat(estimate.metalValue).toLocaleString('en-IN')}</div>
                      <div><span className="text-gray-600">Making Charges:</span> ₹{parseFloat(estimate.makingCharges).toLocaleString('en-IN')} ({estimate.makingChargesPercentage}%)</div>
                      <div><span className="text-gray-600">Wastage:</span> ₹{parseFloat(estimate.wastageCharges).toLocaleString('en-IN')} ({estimate.wastagePercentage}%)</div>
                      <div><span className="text-gray-600">Hallmarking:</span> ₹{parseFloat(estimate.hallmarkingCharges).toLocaleString('en-IN')}</div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-600">Total Amount:</span>
                        <div className="text-xl font-bold text-yellow-600">
                          ₹{parseFloat(estimate.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-gray-600">
                        Valid Until: {new Date(estimate.validUntil).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      // Store estimate data in localStorage for editing
                      localStorage.setItem('editEstimate', JSON.stringify(estimate));
                      setLocation('/admin/estimates');
                    }}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Estimate
                  </Button>
                  <Button
                    onClick={() => sendToWhatsAppMutation.mutate(estimate.id)}
                    disabled={sendToWhatsAppMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {sendToWhatsAppMutation.isPending
                      ? "Sending..."
                      : estimate.sentToWhatsApp
                      ? "Send Again to WhatsApp"
                      : "Send to WhatsApp"
                    }
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