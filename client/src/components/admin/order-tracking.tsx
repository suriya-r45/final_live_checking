import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Truck, Package, MapPin, Calendar, Eye, Edit, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderStatus: string;
  paymentStatus: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
}

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  status: string;
  carrier: string;
  estimatedDays: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientCountry: string;
  packageWeight: string;
  packageValue: string;
  shippingCost: string;
  currency: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingEvents?: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800', 
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const SHIPMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PICKED_UP: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED_DELIVERY: 'bg-orange-100 text-orange-800',
  RETURNED: 'bg-red-100 text-red-800'
};

export default function OrderTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    estimatedDeliveryDate: '',
    actualDeliveryDate: '',
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    }
  });

  // Fetch shipments
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['/api/shipments'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shipments');
      return response.json();
    }
  });

  // Update shipment status mutation
  const updateShipmentMutation = useMutation({
    mutationFn: (data: { id: string; updateData: any }) =>
      apiRequest('PUT', `/api/shipments/${data.id}/status`, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setShowUpdateDialog(false);
      toast({
        title: "Shipment Updated",
        description: "Shipment status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shipment status.",
        variant: "destructive"
      });
    }
  });

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get shipments for an order
  const getOrderShipments = (orderId: string) => {
    return shipments.filter((shipment: Shipment) => shipment.orderId === orderId);
  };

  const handleUpdateShipment = () => {
    if (!selectedShipment) return;

    const updatePayload: any = {
      status: updateData.status || selectedShipment.status
    };

    if (updateData.estimatedDeliveryDate) {
      updatePayload.estimatedDeliveryDate = updateData.estimatedDeliveryDate;
    }
    if (updateData.actualDeliveryDate) {
      updatePayload.actualDeliveryDate = updateData.actualDeliveryDate;
    }
    if (updateData.notes) {
      updatePayload.notes = updateData.notes;
    }

    updateShipmentMutation.mutate({
      id: selectedShipment.id,
      updateData: updatePayload
    });
  };

  if (ordersLoading || shipmentsLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading orders and shipments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="order-tracking">
      {/* Search and Filter Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Order & Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by order number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500" data-testid="message-no-orders">
              No orders found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: Order) => {
                const orderShipments = getOrderShipments(order.id);
                
                return (
                  <Card key={order.id} className="border-l-4 border-l-rose-500" data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Information */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-rose-600" />
                              <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                              <Badge className={ORDER_STATUS_COLORS[order.orderStatus as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                                {order.orderStatus}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Customer:</strong> {order.customerName}</p>
                              <p><strong>Email:</strong> {order.customerEmail}</p>
                              <p><strong>Phone:</strong> {order.customerPhone}</p>
                            </div>
                            <div>
                              <p><strong>Total:</strong> {order.currency === 'INR' ? '₹' : 'BD'} {parseFloat(order.total).toLocaleString()}</p>
                              <p><strong>Payment:</strong> 
                                <Badge className={order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 ml-2' : 'bg-yellow-100 text-yellow-800 ml-2'}>
                                  {order.paymentStatus}
                                </Badge>
                              </p>
                              <p><strong>Items:</strong> {order.items?.length || 0} items</p>
                            </div>
                          </div>
                        </div>

                        {/* Shipments */}
                        <div className="border-l border-gray-200 pl-6">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Shipments ({orderShipments.length})
                          </h4>
                          
                          {orderShipments.length === 0 ? (
                            <p className="text-sm text-gray-500">No shipments created yet</p>
                          ) : (
                            <div className="space-y-3">
                              {orderShipments.map((shipment: Shipment) => (
                                <div key={shipment.id} className="bg-gray-50 rounded-lg p-3" data-testid={`shipment-${shipment.id}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <code className="text-sm font-mono bg-white px-2 py-1 rounded">{shipment.trackingNumber}</code>
                                    <Badge className={SHIPMENT_STATUS_COLORS[shipment.status as keyof typeof SHIPMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                                      {shipment.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Carrier:</strong> {shipment.carrier}</p>
                                    <p><strong>Destination:</strong> {shipment.recipientCity}, {shipment.recipientCountry}</p>
                                    {shipment.estimatedDeliveryDate && (
                                      <p><strong>Est. Delivery:</strong> {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedShipment(shipment)}
                                      data-testid={`button-view-shipment-${shipment.id}`}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedShipment(shipment);
                                        setUpdateData({
                                          status: shipment.status,
                                          estimatedDeliveryDate: shipment.estimatedDeliveryDate || '',
                                          actualDeliveryDate: shipment.actualDeliveryDate || '',
                                          notes: shipment.notes || ''
                                        });
                                        setShowUpdateDialog(true);
                                      }}
                                      data-testid={`button-update-shipment-${shipment.id}`}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Update
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipment Details Dialog */}
      {selectedShipment && (
        <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Details: {selectedShipment.trackingNumber}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${SHIPMENT_STATUS_COLORS[selectedShipment.status as keyof typeof SHIPMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                      {selectedShipment.status}
                    </Badge>
                  </p>
                  <p><strong>Carrier:</strong> {selectedShipment.carrier}</p>
                  <p><strong>Est. Days:</strong> {selectedShipment.estimatedDays} days</p>
                  <p><strong>Weight:</strong> {selectedShipment.packageWeight} kg</p>
                  <p><strong>Value:</strong> {selectedShipment.currency === 'INR' ? '₹' : 'BD'} {parseFloat(selectedShipment.packageValue).toLocaleString()}</p>
                  <p><strong>Shipping Cost:</strong> {selectedShipment.currency === 'INR' ? '₹' : 'BD'} {parseFloat(selectedShipment.shippingCost).toLocaleString()}</p>
                </div>
                <div>
                  <p><strong>Recipient:</strong> {selectedShipment.recipientName}</p>
                  <p><strong>Phone:</strong> {selectedShipment.recipientPhone}</p>
                  <p><strong>Address:</strong> {selectedShipment.recipientAddress}</p>
                  <p><strong>City:</strong> {selectedShipment.recipientCity}</p>
                  <p><strong>State:</strong> {selectedShipment.recipientState}</p>
                  <p><strong>Country:</strong> {selectedShipment.recipientCountry}</p>
                </div>
              </div>

              {selectedShipment.notes && (
                <div>
                  <strong className="text-sm">Notes:</strong>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedShipment.notes}</p>
                </div>
              )}

              {selectedShipment.trackingEvents && selectedShipment.trackingEvents.length > 0 && (
                <div>
                  <strong className="text-sm">Tracking Events:</strong>
                  <div className="mt-2 space-y-2">
                    {selectedShipment.trackingEvents.map((event, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{event.status || event.description}</span>
                          <span className="text-gray-500">{event.date ? new Date(event.date).toLocaleString() : 'No date'}</span>
                        </div>
                        {event.location && <p className="text-gray-600 mt-1">📍 {event.location}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <p><strong>Created:</strong> {new Date(selectedShipment.createdAt).toLocaleString()}</p>
                <p><strong>Updated:</strong> {new Date(selectedShipment.updatedAt).toLocaleString()}</p>
                {selectedShipment.estimatedDeliveryDate && (
                  <p><strong>Est. Delivery:</strong> {new Date(selectedShipment.estimatedDeliveryDate).toLocaleString()}</p>
                )}
                {selectedShipment.actualDeliveryDate && (
                  <p><strong>Delivered:</strong> {new Date(selectedShipment.actualDeliveryDate).toLocaleString()}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Shipment Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={updateData.status} onValueChange={(value) => setUpdateData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="FAILED_DELIVERY">Failed Delivery</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Estimated Delivery Date</label>
              <Input
                type="datetime-local"
                value={updateData.estimatedDeliveryDate}
                onChange={(e) => setUpdateData(prev => ({...prev, estimatedDeliveryDate: e.target.value}))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Actual Delivery Date</label>
              <Input
                type="datetime-local"
                value={updateData.actualDeliveryDate}
                onChange={(e) => setUpdateData(prev => ({...prev, actualDeliveryDate: e.target.value}))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={updateData.notes}
                onChange={(e) => setUpdateData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Add any notes about the shipment..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShipment} disabled={updateShipmentMutation.isPending}>
              {updateShipmentMutation.isPending ? 'Updating...' : 'Update Shipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}