import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "@/services/api-client";
import { getErrorMessage } from "@/utils/error-handler";

const initialState = {
  approvalURL: null,
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
  error: null,
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/api/shop/orders/create",
        orderData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        error: error,
      });
    }
  }
);

export const createUnifiedOrder = createAsyncThunk(
  "/order/createUnifiedOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/api/shop/orders/unified",
        orderData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        error: error,
      });
    }
  }
);

export const capturePayment = createAsyncThunk(
  "/order/capturePayment",
  async ({ paymentId, payerId, orderId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/api/shop/orders/capture",
        {
          paymentId,
          payerId,
          orderId,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        error: error,
      });
    }
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/shop/orders/list/${userId}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        error: error,
      });
    }
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/shop/orders/details/${id}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        error: error,
      });
    }
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvalURL = action.payload.approvalURL;
        state.orderId = action.payload.orderId;
        state.error = null;
        sessionStorage.setItem(
          "currentOrderId",
          JSON.stringify(action.payload.orderId)
        );
      })
      .addCase(createNewOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.approvalURL = null;
        state.orderId = null;
        state.error = action.payload?.message || "Failed to create order";
      })
      .addCase(createUnifiedOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUnifiedOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderId = action.payload.orderId || action.payload._id;
        state.error = null;
      })
      .addCase(createUnifiedOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.orderId = null;
        state.error = action.payload?.message || "Failed to create order";
      })
      .addCase(capturePayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(capturePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(capturePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to capture payment";
      })
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
        state.error = null;
      })
      .addCase(getAllOrdersByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.orderList = [];
        state.error = action.payload?.message || "Failed to fetch orders";
      })
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getOrderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.orderDetails = null;
        state.error = action.payload?.message || "Failed to fetch order details";
      });
  },
});

export const { resetOrderDetails, clearError } = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;
