import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';

import { Colors, Spacing, FontSize } from '../../constants/Theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { fetchCourses, selectAllCourses, selectCoursesLoading } from '../../store/slices/coursesSlice';
import { AppDispatch, RootState } from '../../store/store';

export default function CoursesScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const courses = useSelector(selectAllCourses);
  const isLoading = useSelector(selectCoursesLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState(courses);
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchCourses());
      checkLocationPermission();
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.location?.address && course.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCourses());
    if (locationPermission) {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    }
    setRefreshing(false);
  };

  const renderCourseItem = ({ item }: { item: any }) => {
    let distance = null;
    if (userLocation && item.location?.latitude && item.location?.longitude) {
      distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        item.location.latitude,
        item.location.longitude
      );
    }

    return (
      <TouchableOpacity 
        style={styles.courseItem}
        onPress={() => router.push(`/courses/${item.id}`)}
      >
        <Card style={styles.courseCard}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.courseImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="golf" size={40} color={Colors.primary} />
            </View>
          )}
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{item.name}</Text>
            {item.location?.address && (
              <Text style={styles.courseAddress} numberOfLines={1}>
                <Ionicons name="location-outline" size={14} color={Colors.text} /> {item.location.address}
              </Text>
            )}
            {distance !== null && (
              <Text style={styles.courseDistance}>
                <Ionicons name="navigate-outline" size={14} color={Colors.primary} /> {distance.toFixed(1)} km away
              </Text>
            )}
            <View style={styles.teeInfo}>
              <Text style={styles.teeLabel}>Tees:</Text>
              <View style={styles.teeList}>
                {item.tees && item.tees.map((tee: any, index: number) => (
                  <View 
                    key={index} 
                    style={[styles.teeBadge, { backgroundColor: tee.color || Colors.primary }]}
                  >
                    <Text style={styles.teeBadgeText}>{tee.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Golf Courses</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by name or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <>
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="golf-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>Try a different search term or add a new course</Text>
              <Button 
                title="Add New Course" 
                onPress={() => router.push('/courses/add')} 
                style={styles.addButton}
              />
            </View>
          ) : (
            <FlatList
              data={filteredCourses}
              renderItem={renderCourseItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primary]}
                />
              }
            />
          )}
        </>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/courses/add')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.medium,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.small,
  },
  searchIcon: {
    marginRight: Spacing.small,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.medium,
    color: Colors.text,
    fontSize: FontSize.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  emptyText: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.medium,
  },
  emptySubtext: {
    fontSize: FontSize.medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.small,
    marginBottom: Spacing.large,
  },
  addButton: {
    marginTop: Spacing.medium,
  },
  listContent: {
    padding: Spacing.medium,
  },
  courseItem: {
    marginBottom: Spacing.medium,
  },
  courseCard: {
    padding: 0,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    padding: Spacing.medium,
  },
  courseName: {
    fontSize: FontSize.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.small / 2,
  },
  courseAddress: {
    fontSize: FontSize.small,
    color: Colors.textLight,
    marginBottom: Spacing.small / 2,
  },
  courseDistance: {
    fontSize: FontSize.small,
    color: Colors.primary,
    marginBottom: Spacing.small,
  },
  teeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.small / 2,
  },
  teeLabel: {
    fontSize: FontSize.small,
    color: Colors.text,
    marginRight: Spacing.small,
  },
  teeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teeBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.small / 2,
    marginBottom: Spacing.small / 2,
  },
  teeBadgeText: {
    fontSize: FontSize.xsmall,
    color: Colors.white,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.large,
    right: Spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 