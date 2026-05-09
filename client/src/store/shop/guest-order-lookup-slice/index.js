import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "@/services/api-client";

const initialState = {
  isLoading: false,
  orders: [],
  error: null,
  searchPerformed: false,
  lastSearchName: "",
};

// Search for guest orders by name
export const searchGuestOrders = createAsyncThunk(
  "guestOrderLookup/searchGuestOrders",
  async (guestName, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/shop/orders/guest/${encodeURIComponent(guestName)}`
      );
      return {
        orders: response.data.data || [],
        searchName: guestName
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || {
        success: false,
        message: "Failed to search for guest orders"
      });
    }
  }
);

const guestOrderLookupSlice = createSlice({
  name: "guestOrderLookup",
  initialState,
  reducers: {
    // Clear search results
    clearSearchResults: (state) => {
      state.orders = [];
      state.error = null;
      state.searchPerformed = false;
      state.lastSearchName = "";
    },
    
    // Set error message
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset search state
    resetSearch: (state) => {
      state.isLoading = false;
      state.orders = [];
      state.error = null;
      state.searchPerformed = false;
      state.lastSearchName = "";
    }
  },
  extraReducers: (builder) => {
    builder
      // Search guest orders
      .addCase(searchGuestOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.searchPerformed = false;
      })
      .addCase(searchGuestOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.lastSearchName = action.payload.searchName;
        state.searchPerformed = true;
        state.error = null;
      })
      .addCase(searchGuestOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.orders = [];
        state.searchPerformed = true;
        state.error = action.payload?.message || "Failed to search for guest orders";
      });
  },
});

export const {
  clearSearchResults,
  setError,
  clearError,
  resetSearch
} = guestOrderLookupSlice.actions;

export default guestOrderLookupSlice.reducer;