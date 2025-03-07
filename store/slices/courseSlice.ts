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
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tees?: Tee[]; // Legacy property
  tee_sets?: TeeSet[]; // Property from database
  holes: Hole[];
  hole_count?: number; // Number of holes (9, 18, 27, 36)
  imageUrl?: string;
  clubs?: {
    city: string;
    state: string;
  };
  club_id?: string | {
    city?: string;
    state?: string;
  };
  clubData?: any; // Club data from database
}

interface CourseState {
  courses: Course[];
  nearbyCourses: Course[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  needsHoleData: boolean;
}

const initialState: CourseState = {
  courses: [],
  nearbyCourses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,
  needsHoleData: false,
};

export const fetchCourses = createAsyncThunk(
  'course/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch courses from Supabase
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;
      
      if (coursesData && coursesData.length > 0) {
        // Fetch club data for each course
        const coursesWithClubData = await Promise.all(
          coursesData.map(async (course) => {
            let clubData = null;
            
            // Get club data
            if (course.club_id) {
              const { data: clubResult, error: clubError } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', course.club_id)
                .single();
              
              if (!clubError && clubResult) {
                clubData = clubResult;
              }
            }
            
            // Get tee sets for this course
            const { data: teeSets, error: teeSetsError } = await supabase
              .from('tee_sets')
              .select('*')
              .eq('course_id', course.id)
              .order('total_yardage', { ascending: false });
            
            if (teeSetsError) {
              console.error(`Error fetching tee sets for course ${course.id}:`, teeSetsError);
              return { ...course, clubData, tee_sets: [] };
            }
            
            // Get holes data for this course
            const { data: holes, error: holesError } = await supabase
              .from('holes')
              .select('*')
              .eq('course_id', course.id)
              .order('hole_number', { ascending: true });
            
            if (holesError) {
              console.error(`Error fetching holes for course ${course.id}:`, holesError);
              return { 
                ...course, 
                clubData,
                tee_sets: teeSets || [],
                holes: []
              };
            }
            
            // Get hole tee data for yardages
            const { data: holeTeeData, error: holeTeeError } = await supabase
              .from('hole_tee_data')
              .select('*')
              .in('hole_id', holes ? holes.map(h => h.id) : []);
            
            if (holeTeeError) {
              console.error(`Error fetching hole tee data for course ${course.id}:`, holeTeeError);
            }
            
            // Process holes to match the expected format
            const processedHoles = holes ? holes.map(hole => {
              // Create yardage record for each tee
              const yardageRecord: Record<string, number> = {};
              
              if (holeTeeData) {
                holeTeeData
                  .filter(htd => htd.hole_id === hole.id)
                  .forEach(htd => {
                    yardageRecord[htd.tee_set_id] = htd.yardage;
                  });
              }
              
              return {
                number: hole.hole_number,
                par: hole.par,
                handicap: hole.handicap,
                yardage: yardageRecord
              };
            }) : [];
            
            return { 
              ...course, 
              clubData,
              tee_sets: teeSets || [],
              holes: processedHoles,
              hole_count: processedHoles.length || course.hole_count
            };
          })
        );
        
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
          course.location?.latitude || 0,
          course.location?.longitude || 0
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
      
      // Get hole tee data for yardages
      const { data: holeTeeData, error: holeTeeError } = await supabase
        .from('hole_tee_data')
        .select('*')
        .in('hole_id', holes ? holes.map(h => h.id) : []);
      
      if (holeTeeError) {
        console.error(`Error fetching hole tee data for course ${courseId}:`, holeTeeError);
      }
      
      // Process holes to match the expected format
      const processedHoles = holes ? holes.map(hole => {
        // Create yardage record for each tee
        const yardageRecord: Record<string, number> = {};
        
        if (holeTeeData) {
          holeTeeData
            .filter(htd => htd.hole_id === hole.id)
            .forEach(htd => {
              yardageRecord[htd.tee_set_id] = htd.yardage;
            });
        }
        
        return {
          number: hole.hole_number,
          par: hole.par,
          handicap: hole.handicap,
          yardage: yardageRecord
        };
      }) : [];
      
      // Combine all the data
      return {
        id: courseData.id,
        name: courseData.name,
        club_id: courseData.club_id,
        clubData,
        tee_sets: teeSets || [],
        holes: processedHoles,
        hole_count: processedHoles.length || courseData.hole_count,
        imageUrl: courseData.image_url,
        location: courseData.geo_lat && courseData.geo_lng ? {
          latitude: parseFloat(courseData.geo_lat),
          longitude: parseFloat(courseData.geo_lng),
          address: clubData?.address
        } : undefined
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
      const course = action.payload;
      
      // If the course doesn't have holes data, fetch it
      if (!course.holes || course.holes.length === 0) {
        console.log(`Course ${course.name} has no holes data, will fetch it`);
        // We can't directly dispatch an async thunk from here,
        // so we'll set a flag to indicate that hole data needs to be fetched
        state.selectedCourse = course;
        state.needsHoleData = true;
      } else {
        state.selectedCourse = course;
        state.needsHoleData = false;
      }
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
      state.needsHoleData = false;
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