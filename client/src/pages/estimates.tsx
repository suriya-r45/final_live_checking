import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstimateForm } from "@/components/admin/estimate-form";
import { EstimatesList } from "@/components/admin/estimates-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Plus, List, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function EstimatesPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [location, setLocation] = useLocation();
  
  // Handle URL tab parameter
  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get('tab');
    if (tabParam === 'list' || tabParam === 'create') {
      setActiveTab(tabParam);
    }
  }, [location]);

  return (
    <div className="min-h-screen luxury-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin')}
            className="mb-4 border-rose-800 text-rose-800 hover:bg-rose-100 w-full sm:w-auto text-sm px-3 py-2"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-luxury-black mb-2">Customer Estimates</h1>
            <p className="text-medium-grey">Create and manage jewelry estimates for your customers</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-rose-100 gap-1 p-1">
            <TabsTrigger value="list" className="flex items-center justify-center space-x-1 md:space-x-2 data-[state=active]:bg-rose-800 data-[state=active]:text-rose-100 text-rose-700 px-2 py-2 text-xs md:text-sm rounded-md">
              <List className="h-3 w-3 md:h-4 md:w-4" />
              <span>View Estimates</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center justify-center space-x-1 md:space-x-2 data-[state=active]:bg-rose-800 data-[state=active]:text-rose-100 text-rose-700 px-2 py-2 text-xs md:text-sm rounded-md">
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span>Create Estimate</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <EstimatesList />
          </TabsContent>

          <TabsContent value="create">
            <EstimateForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}