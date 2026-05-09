import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/services/api-client";
import { getErrorMessage } from "@/utils/error-handler";

const initialState = {
  isLoading: false,
  reviews: [],
  error: null,
};

export const addReview = createAsyncThunk(
  "/order/addReview",
  async (formdata, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/api/shop/review/add",
        formdata
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

export const getReviews = createAsyncThunk(
  "/order/getReviews",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/shop/review/${id}`
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

const reviewSlice = createSlice({
  name: "reviewSlice",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to add review";
      })
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.data;
        state.error = null;
      })
      .addCase(getReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.reviews = [];
        state.error = action.payload?.message || "Failed to fetch reviews";
      });
  },
});

export const { clearError } = reviewSlice.actions;

export default reviewSlice.reducer;
