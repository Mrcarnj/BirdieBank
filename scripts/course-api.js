// Golf course data storage script - Course data only
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Supabase connection info
const SUPABASE_URL = 'https://cnroeynbskwfiijqqema.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucm9leW5ic2t3ZmlpanFxZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA4MjUsImV4cCI6MjA1NjExNjgyNX0.hJBvgieypi9Rx3VjL54NO0Tk2fPaRO0oYxUoAaNYiN4';

// Golf API key and endpoint
const GOLF_API_KEY = 'f3d60d0d-46ae-4439-864a-ef27b5ff9576';
const COURSE_ENDPOINT = 'https://www.golfapi.io/api/v2.3/courses/012141520658891108829';

// Setup Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Main function
async function saveGolfCourseData() {
  try {
    console.log('Fetching course data...');
    
    // Fetch the course data
    const courseData = await fetchData(COURSE_ENDPOINT);
    console.log(`Retrieved course data for: ${courseData.courseName}`);
    
    // First, ensure club exists or create it from course data
    const clubId = await ensureClubExists(courseData);
    
    // Save course data
    const courseId = await saveCourseToDatabase(courseData, clubId);
    console.log(`Saved course with ID: ${courseId}`);
    
    // Process holes
    const holeIds = await createHoles(courseId, courseData);
    
    // Process tee sets
    if (courseData.tees && courseData.tees.length > 0) {
      await processTeeData(courseId, courseData, holeIds);
    }
    
    console.log('Course data saved successfully!');
  } catch (error) {
    console.error('Error saving course data:', error);
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
    throw error;
  }
}

// Ensure club exists in database
async function ensureClubExists(courseData) {
  // Extract club info from course data
  const clubData = {
    api_club_id: courseData.clubID,
    name: courseData.clubName,
    phone: courseData.telephone,
    website_url: courseData.website,
    address: courseData.address,
    city: courseData.city,
    state: courseData.state,
    postal_code: courseData.postalCode,
    country: courseData.country,
    geo_lat: parseFloat(courseData.latitude),
    geo_lng: parseFloat(courseData.longitude)
  };
  
  try {
    // Check if club already exists
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('api_club_id', clubData.api_club_id)
      .single();
    
    if (existingClub) {
      // Update existing club
      console.log('Club exists, updating record...');
      await supabase
        .from('clubs')
        .update(clubData)
        .eq('id', existingClub.id);
        
      return existingClub.id;
    } else {
      // Insert new club
      console.log('Creating new club record...');
      const { data: newClub, error } = await supabase
        .from('clubs')
        .insert(clubData)
        .select('id')
        .single();
        
      if (error) throw error;
      return newClub.id;
    }
  } catch (error) {
    console.error('Error ensuring club exists:', error);
    throw error;
  }
}

// Save course data to Supabase
async function saveCourseToDatabase(courseData, clubId) {
  // Map API response to courses table schema
  const data = {
    api_course_id: courseData.courseID,
    club_id: clubId,
    name: courseData.courseName,
    hole_count: parseInt(courseData.numHoles) || 18
    // We'll get course_rating and slope_rating from tee data
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
    console.error(`Error saving course data:`, error);
    throw error;
  }
}

// Create all 18 holes for the course
async function createHoles(courseId, courseData) {
  const holeIds = [];
  
  for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
    try {
      const index = holeNumber - 1;
      
      // Get par and handicap from course data
      const par = courseData.parsMen && index < courseData.parsMen.length ? courseData.parsMen[index] : null;
      const handicap = courseData.indexesMen && index < courseData.indexesMen.length ? courseData.indexesMen[index] : null;
      
      const holeData = {
        course_id: courseId,
        hole_number: holeNumber,
        par: par,
        handicap: handicap
      };
      
      // Check if hole already exists
      const { data: existingHoles } = await supabase
        .from('holes')
        .select('id')
        .eq('course_id', courseId)
        .eq('hole_number', holeNumber);
      
      let holeId;
      
      if (existingHoles && existingHoles.length > 0) {
        // Update existing hole
        await supabase
          .from('holes')
          .update(holeData)
          .eq('id', existingHoles[0].id);
          
        holeId = existingHoles[0].id;
      } else {
        // Insert new hole
        const { data: newHole, error } = await supabase
          .from('holes')
          .insert(holeData)
          .select('id')
          .single();
          
        if (error) throw error;
        holeId = newHole.id;
      }
      
      holeIds.push(holeId);
    } catch (error) {
      console.error(`Error creating hole ${holeNumber}:`, error);
      holeIds.push(null);
    }
  }
  
  return holeIds;
}

// Process tee data and related information
async function processTeeData(courseId, courseData, holeIds) {
  try {
    console.log(`Processing ${courseData.tees.length} tee sets...`);
    
    // Update course rating and slope from first tee set
    if (courseData.tees.length > 0) {
      const firstTee = courseData.tees[0];
      await updateCourseRatings(courseId, firstTee);
    }
    
    // Process each tee set
    for (const teeSet of courseData.tees) {
      // Save tee set
      const teeSetId = await saveTeesToDatabase(teeSet, courseId);
      
      // Save hole-specific tee data for each hole
      for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
        const holeId = holeIds[holeNumber - 1];
        
        if (holeId) {
          await saveHoleTeeData(holeId, teeSetId, teeSet, holeNumber);
        }
      }
    }
    
    console.log('Tee data processing completed');
  } catch (error) {
    console.error('Error processing tee data:', error);
  }
}

// Update course ratings
async function updateCourseRatings(courseId, teeSet) {
  try {
    const data = {
      course_rating: parseFloat(teeSet.courseRatingMen) || null,
      slope_rating: parseInt(teeSet.slopeMen) || null
    };
    
    await supabase
      .from('courses')
      .update(data)
      .eq('id', courseId);
  } catch (error) {
    console.error('Error updating course ratings:', error);
  }
}

// Save tee set to database
async function saveTeesToDatabase(teeSet, courseId) {
  try {
    // Calculate total, front nine, and back nine yardages
    const frontNineYardage = calculateFrontNineYardage(teeSet);
    const backNineYardage = calculateBackNineYardage(teeSet);
    const totalYardage = frontNineYardage + backNineYardage;
    
    // Determine gender from the ratings
    let gender = 'unisex';
    if (teeSet.courseRatingMen && !teeSet.courseRatingWomen) {
      gender = 'men';
    } else if (!teeSet.courseRatingMen && teeSet.courseRatingWomen) {
      gender = 'women';
    }
    
    const teeData = {
      course_id: courseId,
      name: teeSet.teeName,
      color: teeSet.teeColor,
      gender: gender,
      par: null, // This would come from course level par data
      course_rating: parseFloat(teeSet.courseRatingMen) || parseFloat(teeSet.courseRatingWomen) || null,
      slope_rating: parseInt(teeSet.slopeMen) || parseInt(teeSet.slopeWomen) || null,
      total_yardage: totalYardage,
      front_nine_yardage: frontNineYardage,
      back_nine_yardage: backNineYardage
    };
    
    // Check if tee set already exists
    const { data: existingTeeSets } = await supabase
      .from('tee_sets')
      .select('id')
      .eq('course_id', courseId)
      .eq('name', teeData.name);
    
    if (existingTeeSets && existingTeeSets.length > 0) {
      // Update existing tee set
      await supabase
        .from('tee_sets')
        .update(teeData)
        .eq('id', existingTeeSets[0].id);
        
      return existingTeeSets[0].id;
    } else {
      // Insert new tee set
      const { data: newTeeSet, error } = await supabase
        .from('tee_sets')
        .insert(teeData)
        .select('id')
        .single();
        
      if (error) throw error;
      return newTeeSet.id;
    }
  } catch (error) {
    console.error(`Error saving tee set ${teeSet.teeName}:`, error);
    throw error;
  }
}

// Calculate front nine yardage
function calculateFrontNineYardage(teeSet) {
  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    const yardage = parseInt(teeSet[`length${i}`]) || 0;
    sum += yardage;
  }
  return sum;
}

// Calculate back nine yardage
function calculateBackNineYardage(teeSet) {
  let sum = 0;
  for (let i = 10; i <= 18; i++) {
    const yardage = parseInt(teeSet[`length${i}`]) || 0;
    sum += yardage;
  }
  return sum;
}

// Save hole tee data
async function saveHoleTeeData(holeId, teeSetId, teeSet, holeNumber) {
  try {
    // Get yardage for this hole
    const yardage = parseInt(teeSet[`length${holeNumber}`]) || 0;
    
    const data = {
      hole_id: holeId,
      tee_set_id: teeSetId,
      yardage: yardage,
      par: null, // Individual hole par for this tee set (if available)
      handicap: null // Individual hole handicap for this tee set (if available)
    };
    
    // Check if hole tee data already exists
    const { data: existingData } = await supabase
      .from('hole_tee_data')
      .select('id')
      .eq('hole_id', holeId)
      .eq('tee_set_id', teeSetId);
    
    if (existingData && existingData.length > 0) {
      await supabase
        .from('hole_tee_data')
        .update(data)
        .eq('id', existingData[0].id);
    } else {
      await supabase
        .from('hole_tee_data')
        .insert(data);
    }
  } catch (error) {
    console.error(`Error saving hole tee data for hole ${holeNumber}:`, error);
  }
}

// Run the script
saveGolfCourseData()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err));