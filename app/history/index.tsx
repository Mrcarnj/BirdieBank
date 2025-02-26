import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';

import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Card from '../../components/Card';
import { fetchPastRounds as fetchRounds, updateRound, completeRound } from '../../store/slices/roundSlice';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...createFontStyle('bold', 18),
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...createFontStyle('regular', 12),
    color: COLORS.textPrimary,
  },
  filterTextActive: {
    color: COLORS.textLight,
    ...createFontStyle('bold', 12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textPrimary,
    ...createFontStyle('medium', 14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    ...createFontStyle('bold', 18),
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    ...createFontStyle('regular', 14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderText: {
    ...createFontStyle('regular', 14),
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  listHeaderDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  roundItem: {
    marginBottom: 16,
  },
  roundCard: {
    padding: 16,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roundInfo: {
    flex: 1,
  },
  courseName: {
    ...createFontStyle('bold', 14),
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roundDate: {
    ...createFontStyle('regular', 12),
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    ...createFontStyle('bold', 10),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  roundDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    ...createFontStyle('regular', 12),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...createFontStyle('medium', 14),
    color: COLORS.textPrimary,
  },
  parScore: {
    ...createFontStyle('regular', 12),
  },
  roundActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    ...createFontStyle('regular', 12),
    color: COLORS.primary,
  },
});

export default function HistoryScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const rounds = useSelector((state: RootState) => state.round.pastRounds);
  const isLoading = useSelector((state: RootState) => state.round.isLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'completed', 'in-progress'

  useEffect(() => {
    if (user) {
      dispatch(fetchRounds(user.id));
    }
  }, [dispatch, user]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(fetchRounds(user.id));
    setRefreshing(false);
  };

  const handleDeleteRound = (roundId: string, courseName: string, date: string) => {
    Alert.alert(
      "Delete Round",
      `Are you sure you want to delete your round at ${courseName} on ${date}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            // Since there's no deleteRound function, you could mark it as deleted or implement your own logic
            console.log(`Delete round ${roundId}`);
          },
          style: "destructive"
        }
      ]
    );
  };

  const getFilteredRounds = () => {
    if (!rounds) return [];
    
    switch (filterType) {
      case 'completed':
        return rounds.filter((round) => round.isCompleted);
      case 'in-progress':
        return rounds.filter((round) => !round.isCompleted);
      default:
        return rounds;
    }
  };

  const filteredRounds = getFilteredRounds();

  const renderRoundItem = ({ item }: { item: any }) => {
    const date = new Date(item.date);
    const formattedDate = format(date, 'MMM d, yyyy');
    const formattedTime = format(date, 'h:mm a');

    // Calculate total score for the user
    const userScore = item.scores?.reduce((total: number, score: any) => {
      if (score.playerId === user?.id) {
        return total + score.strokes;
      }
      return total;
    }, 0);

    // Get course par if available
    const coursePar = item.course?.holes?.reduce((total: number, hole: any) => {
      return total + hole.par;
    }, 0);

    // Calculate score relative to par
    let scoreRelativeToPar = null;
    if (userScore && coursePar) {
      scoreRelativeToPar = userScore - coursePar;
    }

    return (
      <TouchableOpacity 
        style={styles.roundItem}
        onPress={() => router.push(`/rounds/${item.id}` as any)}
      >
        <Card style={styles.roundCard}>
          <View style={styles.roundHeader}>
            <View style={styles.roundInfo}>
              <Text style={styles.courseName}>{item.course?.name || 'Unknown Course'}</Text>
              <Text style={styles.roundDate}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} /> {formattedDate} • {formattedTime}
              </Text>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: item.isCompleted ? COLORS.success + '20' : COLORS.warning + '20',
              borderColor: item.isCompleted ? COLORS.success : COLORS.warning,
            }]}>
              <Text style={[styles.statusText, { 
                color: item.isCompleted ? COLORS.success : COLORS.warning 
              }]}>
                {item.isCompleted ? 'Completed' : 'In Progress'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.roundDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Holes</Text>
              <Text style={styles.detailValue}>
                {item.holeSelection === 'front9' ? 'Front 9' : 
                 item.holeSelection === 'back9' ? 'Back 9' : 
                 item.holeSelection === 'full18' ? 'Full 18' : 
                 `Custom (${item.customStartHole || 'N/A'})`}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>{item.players?.length || 0}</Text>
            </View>

            {userScore && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Your Score</Text>
                <Text style={styles.detailValue}>
                  {userScore}
                  {scoreRelativeToPar !== null && (
                    <Text style={[styles.parScore, { 
                      color: scoreRelativeToPar > 0 ? COLORS.error : 
                             scoreRelativeToPar < 0 ? COLORS.success : 
                             COLORS.secondary 
                    }]}>
                      {' '}({scoreRelativeToPar > 0 ? '+' : ''}{scoreRelativeToPar})
                    </Text>
                  )}
                </Text>
              </View>
            )}

            {item.games && item.games.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Games</Text>
                <Text style={styles.detailValue}>{item.games.map((game: any) => game.type).join(', ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.roundActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/rounds/${item.id}` as any)}
            >
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            {!item.isCompleted && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/rounds' as any)}
              >
                <Ionicons name="play-outline" size={18} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Continue</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteRound(item.id, item.course?.name || 'Unknown Course', formattedDate)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Round History",
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Round History</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilterType('completed')}
          >
            <Text style={[styles.filterText, filterType === 'completed' && styles.filterTextActive]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'in-progress' && styles.filterButtonActive]}
            onPress={() => setFilterType('in-progress')}
          >
            <Text style={[styles.filterText, filterType === 'in-progress' && styles.filterTextActive]}>In Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading rounds...</Text>
        </View>
      ) : (
        <>
          {filteredRounds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="golf-outline" size={60} color={COLORS.secondary} />
              <Text style={styles.emptyText}>No rounds found</Text>
              <Text style={styles.emptySubtext}>
                {filterType !== 'all' 
                  ? `No ${filterType === 'completed' ? 'completed' : 'in-progress'} rounds found`
                  : 'Start a new round to track your golf scores'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRounds}
              renderItem={renderRoundItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                />
              }
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderText}>
                    {filteredRounds.length} {filteredRounds.length === 1 ? 'Round' : 'Rounds'}
                  </Text>
                  <View style={styles.listHeaderDivider} />
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
} 