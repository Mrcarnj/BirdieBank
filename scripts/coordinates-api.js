// Full Golf Coordinates Data Storage Script
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Supabase connection info
const SUPABASE_URL = 'https://cnroeynbskwfiijqqema.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucm9leW5ic2t3ZmlpanFxZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA4MjUsImV4cCI6MjA1NjExNjgyNX0.hJBvgieypi9Rx3VjL54NO0Tk2fPaRO0oYxUoAaNYiN4';

// Golf API key and endpoint
const GOLF_API_KEY = 'f3d60d0d-46ae-4439-864a-ef27b5ff9576';
const COORDINATES_ENDPOINT = 'https://www.golfapi.io/api/v2.3/coordinates/012141520658891108829';

// Setup Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Main function
async function saveCoordinatesData() {
  try {
    console.log('Starting coordinates data collection...');
    
    // Get the course ID from Supabase
    const { data: courseData } = await supabase
      .from('courses')
      .select('id')
      .eq('api_course_id', '012141520658891108829')
      .single();
    
    if (!courseData) {
      console.error('Course not found in database. Please save course data first.');
      return;
    }
    
    const courseId = courseData.id;
    console.log(`Found course ID in database: ${courseId}`);
    
    // Fetch coordinates data from API
    const coordinatesData = await fetchData(COORDINATES_ENDPOINT);
    console.log(`Retrieved ${coordinatesData.numCoordinates} coordinates for course ID: ${coordinatesData.courseID}`);
    
    // Map of POI numbers to feature types according to documentation
    const poiTypeMap = {
      1: 'green',
      2: 'green_bunker',
      3: 'fairway_bunker',
      4: 'water',
      5: 'trees',
      6: '100_marker',
      7: '150_marker',
      8: '200_marker',
      9: 'dogleg',
      10: 'road',
      11: 'front_tee',
      12: 'back_tee'
    };
    
    // Map of location values 
    const locationMap = {
      1: 'front',
      2: 'middle',
      3: 'back'
    };
    
    // Map of side fairway values
    const sideFairwayMap = {
      1: 'left',
      2: 'center',
      3: 'right'
    };
    
    // Process each coordinate
    let savedCount = 0;
    
    for (const coord of coordinatesData.coordinates) {
      const data = {
        course_id: courseId,
        hole_number: coord.hole,
        poi: coord.poi,
        poi_type: poiTypeMap[coord.poi] || 'unknown',
        location: coord.location,
        location_description: locationMap[coord.location] || 'unknown',
        side_fairway: coord.sideFW,
        side_fairway_description: sideFairwayMap[coord.sideFW] || 'unknown',
        geo_lat: coord.latitude,
        geo_lng: coord.longitude
      };
      
      await saveCoordinatePoint(data);
      savedCount++;
      
      // Log progress every 20 points
      if (savedCount % 20 === 0) {
        console.log(`Saved ${savedCount} coordinate points...`);
      }
    }
    
    console.log(`Successfully saved all ${savedCount} coordinate points.`);
  } catch (error) {
    console.error('Error in save coordinates data:', error);
  }
}

// Fetch data from API
async function fetchData(endpoint) {
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: endpoint,
      headers: { 
        'Authorization': `Bearer ${GOLF_API_KEY}`
      }
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// Function to save a single coordinate point
async function saveCoordinatePoint(data) {
  try {
    // Check if the point already exists (by hole, poi, location, and coords)
    const { data: existingPoints } = await supabase
      .from('course_coordinate_points')  // Your new table name
      .select('id')
      .eq('course_id', data.course_id)
      .eq('hole_number', data.hole_number)
      .eq('poi', data.poi)
      .eq('location', data.location)
      .eq('geo_lat', data.geo_lat)
      .eq('geo_lng', data.geo_lng);
    
    if (existingPoints && existingPoints.length > 0) {
      // Update existing point
      await supabase
        .from('course_coordinate_points')
        .update(data)
        .eq('id', existingPoints[0].id);
    } else {
      // Insert new point
      await supabase
        .from('course_coordinate_points')
        .insert(data);
    }
  } catch (error) {
    console.error('Error saving coordinate point:', error);
  }
}

// Run the script
saveCoordinatesData()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err));