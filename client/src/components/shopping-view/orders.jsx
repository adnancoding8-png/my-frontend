import { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import ShoppingOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersByUserId,
  getOrderDetails,
  resetOrderDetails,
  clearError,
} from "@/store/shop/order-slice";
import { Badge } from "../ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";
import ErrorAlert from "../common/error-alert";
import "../../styles/order-highlighting.css";

function ShoppingOrders({ highlightOrderId }) {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const highlightedRowRef = useRef(null);
  const dialogContentRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orderList, orderDetails, error } = useSelector((state) => state.shopOrder);

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetails(getId));
  }

  useEffect(() => {
    dispatch(getAllOrdersByUserId(user?.id));
  }, [dispatch]);

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  // Auto-scroll to highlighted order
  useEffect(() => {
    if (highlightOrderId && highlightedRowRef.current) {
      setTimeout(() => {
        try {
          highlightedRowRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } catch (error) {
          // Silently handle scroll errors if element is not found
          console.debug('Scroll to element failed:', error);
        }
      }, 500); // Delay to ensure component is rendered
    }
  }, [highlightOrderId, orderList]);

  const handleCloseDialog = () => {
    setOpenDetailsDialog(false);
    dispatch(resetOrderDetails());
  };

  const handleScrollUp = () => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollBy({
        top: -200,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollDown = () => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollBy({
        top: 200,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {error && (
            <ErrorAlert 
              error={error}
              onDismiss={() => dispatch(clearError())}
              onRetry={() => {
                dispatch(getAllOrdersByUserId(user?.id));
              }}
              className="mb-4"
            />
          )}

          {orderList && orderList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Order Price</TableHead>
                  <TableHead>
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderList
                  .sort((a, b) => {
                    // Prioritize highlighted orders first, then by date
                    const aIsHighlighted = highlightOrderId && a._id === highlightOrderId;
                    const bIsHighlighted = highlightOrderId && b._id === highlightOrderId;
                    
                    if (aIsHighlighted && !bIsHighlighted) return -1;
                    if (!aIsHighlighted && bIsHighlighted) return 1;
                    
                    // Then sort by date (newest first)
                    return new Date(b.orderDate) - new Date(a.orderDate);
                  })
                  .map((orderItem) => {
                    const isHighlighted = highlightOrderId && orderItem?._id === highlightOrderId;
                    return (
                      <TableRow 
                        key={orderItem?._id}
                        ref={isHighlighted ? highlightedRowRef : null}
                        className={isHighlighted ? "order-highlighted" : ""}
                      >
                        <TableCell className={isHighlighted ? "font-semibold text-green-800" : ""}>
                          {orderItem?._id}
                          {isHighlighted && (
                            <Badge variant="outline" className="ml-2 border-green-500 text-green-700">
                              New Order
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{orderItem?.orderDate.split("T")[0]}</TableCell>
                        <TableCell>
                          <Badge
                            className={`py-1 px-3 ${
                              orderItem?.orderStatus === "confirmed"
                                ? "bg-green-500"
                                : orderItem?.orderStatus === "rejected"
                                ? "bg-red-600"
                                : "bg-black"
                            }`}
                          >
                            {orderItem?.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>PKR {orderItem?.totalAmount}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              handleFetchOrderDetails(orderItem?._id)
                            }
                            variant={isHighlighted ? "default" : "outline"}
                            className={isHighlighted ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No orders found. Start shopping to create your first order!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Dialog outside the loop */}
      <Dialog open={openDetailsDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Order Details</DialogTitle>
          <DialogDescription className="sr-only">View your order details including items, shipping information, and order status.</DialogDescription>
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-xl font-semibold">Order Details</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScrollUp}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleScrollDown}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Down
              </Button>
            </div>
          </div>
          <div ref={dialogContentRef} className="overflow-y-auto flex-1">
            {orderDetails && <ShoppingOrderDetailsView orderDetails={orderDetails} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ShoppingOrders;
