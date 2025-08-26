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
  console.log('🔥 EstimatesList - Component rendering');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // Simple return to test component rendering  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="border-2 border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Estimates List - Component Working!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            The EstimatesList component is now rendering successfully.
          </p>
          <div className="space-y-3">
            <div className="p-3 border rounded bg-white">
              <h4 className="font-semibold">Sample Estimate #1</h4>
              <p className="text-sm text-gray-600">Customer: Priya Sharma</p>
              <p className="text-sm text-gray-600">Product: Gold Diamond Ring</p>
              <p className="text-sm font-medium">Amount: ₹92,649</p>
            </div>
            <div className="p-3 border rounded bg-white">
              <h4 className="font-semibold">Sample Estimate #2</h4>
              <p className="text-sm text-gray-600">Customer: Arjun Patel</p>
              <p className="text-sm text-gray-600">Product: Gold Chain Necklace</p>
              <p className="text-sm font-medium">Amount: ₹2,59,764</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}