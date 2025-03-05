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

export interface TeeSet {
  id: string;
  course_id: string;
  name: string;
  color: string;
  gender?: string;
  par?: number;
  course_rating?: number;
  slope_rating?: number;
  total_yardage?: number;
  front_nine_yardage?: number;
  back_nine_yardage?: number;
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
  clubs?: {
    city: string;
    state: string;
  };
  club_id?: string | {
    city?: string;
    state?: string;
    [key: string]: any;
  };
  clubData?: {
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
    website_url?: string;
    [key: string]: any;
  } | null;
  tee_sets?: TeeSet[];
  hole_count?: number;
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
      console.log('Fetching courses...');
      
      // First get all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*');
      
      if (coursesError) throw coursesError;
      
      // If we have courses, fetch the club data for each course
      if (coursesData && coursesData.length > 0) {
        console.log(`Found ${coursesData.length} courses, fetching club data...`);
        
        // Create an array of promises to fetch club data for each course
        const coursesWithClubData = await Promise.all(
          coursesData.map(async (course) => {
            if (!course.club_id) {
              return { ...course, clubData: null };
            }
            
            const { data: clubData, error: clubError } = await supabase
              .from('clubs')
              .select('city, state')
              .eq('id', course.club_id)
              .single();
            
            if (clubError) {
              console.error(`Error fetching club data for course ${course.id}:`, clubError);
              return { ...course, clubData: null };
            }
            
            return { ...course, clubData };
          })
        );
        
        console.log('First course with club data:', JSON.stringify(coursesWithClubData[0], null, 2));
        return coursesWithClubData;
      }
      
      return coursesData;
    } catch (error: any) {
      console.error('Error in fetchCourses:', error.message);
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

export const fetchCourseById = createAsyncThunk(
  'course/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      console.log(`Fetching course with ID: ${courseId}`);
      
      // Get the course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      
      if (!courseData) {
        throw new Error(`Course with ID ${courseId} not found`);
      }
      
      // Get the club data
      let clubData = null;
      if (courseData.club_id) {
        const { data: club, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', courseData.club_id)
          .single();
        
        if (!clubError && club) {
          clubData = club;
        }
      }
      
      // Get the tee sets data
      const { data: teeSets, error: teeSetsError } = await supabase
        .from('tee_sets')
        .select('*')
        .eq('course_id', courseId)
        .order('total_yardage', { ascending: false });
      
      if (teeSetsError) {
        console.error(`Error fetching tee sets for course ${courseId}:`, teeSetsError);
      }
      
      // Get the holes data
      const { data: holes, error: holesError } = await supabase
        .from('holes')
        .select('*')
        .eq('course_id', courseId)
        .order('hole_number', { ascending: true });
      
      if (holesError) {
        console.error(`Error fetching holes for course ${courseId}:`, holesError);
      }
      
      // Combine all the data
      return {
        ...courseData,
        clubData,
        tee_sets: teeSets || [],
        holes: holes || []
      };
    } catch (error: any) {
      console.error(`Error fetching course with ID ${courseId}:`, error.message);
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
      })
      // Fetch Course By ID
      .addCase(fetchCourseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action: PayloadAction<Course>) => {
        state.isLoading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectCourse, clearSelectedCourse } = courseSlice.actions;
export default courseSlice.reducer; 