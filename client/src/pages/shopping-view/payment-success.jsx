import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Package, User, Phone, MapPin, DollarSign } from "lucide-react";

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = location.state?.isGuest;
  const customerInfo = location.state?.customerInfo;
  const items = location.state?.items || [];
  const orderId = location.state?.orderId;
  const guestName = customerInfo?.fullName;

  // Redirect guest to account page after 8 seconds
  useEffect(() => {
    if (isGuest && guestName) {
      const timer = setTimeout(() => {
        navigate(`/shop/account?tab=guest-lookup&customerName=${encodeURIComponent(guestName)}`);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isGuest, guestName, navigate]);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Success Message */}
      <Card className="p-10 text-center">
        <CardHeader className="p-0">
          <CardTitle className="text-4xl text-green-600 mb-4">Order Placed Successfully!</CardTitle>
        </CardHeader>
        <p className="text-gray-600 mb-4">
          Thank you for your purchase. {isGuest ? "We'll contact you on WhatsApp to confirm your order details shortly." : "You can track your order status in your account."}
        </p>
      </Card>

      {/* Guest Order Details */}
      {isGuest && customerInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Name:</span>
                <span>{customerInfo.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{customerInfo.phoneNumber}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="font-medium">Address:</span>
                  <div className="text-sm text-gray-600">
                    {customerInfo.shippingAddress}, {customerInfo.city}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Order ID:</span>
                <span className="text-sm font-mono">{orderId?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Order Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className="bg-green-500">Confirmed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">PKR {(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">PKR {item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-green-600">PKR {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!isGuest ? (
          <Button onClick={() => navigate("/shop/account")}>
            View Orders
          </Button>
        ) : (
          <Button onClick={() => navigate(`/shop/account?tab=guest-lookup&customerName=${encodeURIComponent(guestName || '')}`)}>
            View Your Account Now
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/shop/home")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
