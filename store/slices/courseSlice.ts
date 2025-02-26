import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';

export interface Tee {
  id: string;
  name: string;
  color: string;
  rating: number;
  slope: number;
}

export interface Hole {
  number: number;
  par: number;
  yardage: Record<string, number>; // teeId -> yardage
  handicap: number;
}

export interface Course {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tees: Tee[];
  holes: Hole[];
  imageUrl?: string;
}

interface CourseState {
  courses: Course[];
  nearbyCourses: Course[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  nearbyCourses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,
};

export const fetchCourses = createAsyncThunk(
  'course/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;
      return data as Course[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNearbyCourses = createAsyncThunk(
  'course/fetchNearbyCourses',
  async (_, { rejectWithValue }) => {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch courses from Supabase
      // In a real app, you would use PostGIS or a similar service to query by distance
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;

      // Filter courses by proximity (simplified version)
      // In a real app, this would be done on the server side
      const nearbyCourses = (data as Course[]).filter(course => {
        const distance = calculateDistance(
          latitude,
          longitude,
          course.location.latitude,
          course.location.longitude
        );
        return distance <= 50; // Within 50km
      });

      return nearbyCourses;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    selectCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourse = action.payload;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Nearby Courses
      .addCase(fetchNearbyCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.isLoading = false;
        state.nearbyCourses = action.payload;
      })
      .addCase(fetchNearbyCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectCourse, clearSelectedCourse } = courseSlice.actions;
export default courseSlice.reducer; 