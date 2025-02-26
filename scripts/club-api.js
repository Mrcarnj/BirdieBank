// Simplified script to save club and course data to Supabase
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Supabase connection info
const SUPABASE_URL = 'https://cnroeynbskwfiijqqema.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucm9leW5ic2t3ZmlpanFxZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA4MjUsImV4cCI6MjA1NjExNjgyNX0.hJBvgieypi9Rx3VjL54NO0Tk2fPaRO0oYxUoAaNYiN4';

// Golf API key and endpoint
const GOLF_API_KEY = 'f3d60d0d-46ae-4439-864a-ef27b5ff9576';
const CLUB_ENDPOINT = 'https://www.golfapi.io/api/v2.3/clubs/141520610397251566';

// Setup Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Main function
async function saveGolfData() {
  try {
    console.log('Fetching club data...');
    
    // Fetch the club data
    const clubData = await fetchClubData();
    console.log(`Retrieved club data for: ${clubData.clubName}`);
    
    // Save club to database
    const clubId = await saveClubToDatabase(clubData);
    console.log(`Saved club with ID: ${clubId}`);
    
    // Save courses to database
    if (clubData.courses && clubData.courses.length > 0) {
      console.log(`Saving ${clubData.courses.length} courses...`);
      
      for (const course of clubData.courses) {
        await saveCourseToDatabase(course, clubId);
      }
      
      console.log('Courses saved successfully');
    }
    
    console.log('Data saved successfully!');
  } catch (error) {
    console.error('Error saving golf data:', error);
  }
}

// Fetch club data from API
async function fetchClubData() {
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: CLUB_ENDPOINT,
      headers: { 
        'Authorization': `Bearer ${GOLF_API_KEY}`
      }
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching club data:`, error.message);
    throw error;
  }
}

// Save club data to Supabase
async function saveClubToDatabase(clubData) {
  // Map API response to clubs table schema
  const data = {
    api_club_id: clubData.clubID,
    name: clubData.clubName,
    phone: clubData.telephone,
    website_url: clubData.website,
    address: clubData.address,
    city: clubData.city,
    state: clubData.state,
    postal_code: clubData.postalCode,
    country: clubData.country,
    geo_lat: parseFloat(clubData.latitude),
    geo_lng: parseFloat(clubData.longitude)
  };
  
  try {
    // Check if club already exists
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('api_club_id', data.api_club_id)
      .single();
    
    if (existingClub) {
      // Update existing club
      console.log('Club exists, updating record...');
      await supabase
        .from('clubs')
        .update(data)
        .eq('id', existingClub.id);
        
      return existingClub.id;
    } else {
      // Insert new club
      console.log('Creating new club record...');
      const { data: newClub, error } = await supabase
        .from('clubs')
        .insert(data)
        .select('id')
        .single();
        
      if (error) throw error;
      return newClub.id;
    }
  } catch (error) {
    console.error('Error saving club data:', error);
    throw error;
  }
}

// Save course data to Supabase
async function saveCourseToDatabase(courseData, clubId) {
  // Map API response to courses table schema (only basic fields)
  const data = {
    api_course_id: courseData.courseID,
    club_id: clubId,
    name: courseData.courseName,
    hole_count: courseData.numHoles || 18
  };
  
  try {
    // Check if course already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('api_course_id', data.api_course_id)
      .single();
    
    if (existingCourse) {
      // Update existing course
      console.log(`Updating course: ${data.name}`);
      await supabase
        .from('courses')
        .update(data)
        .eq('id', existingCourse.id);
        
      return existingCourse.id;
    } else {
      // Insert new course
      console.log(`Creating new course: ${data.name}`);
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert(data)
        .select('id')
        .single();
        
      if (error) throw error;
      return newCourse.id;
    }
  } catch (error) {
    console.error(`Error saving course data for ${courseData.courseName}:`, error);
    return null;
  }
}

// Run the script
saveGolfData()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err));