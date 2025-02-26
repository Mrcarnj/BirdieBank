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
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';

import { Colors, Spacing, FontSize } from '../../constants/Theme';
import Card from '../../components/Card';
import { fetchRounds, selectAllRounds, selectRoundsLoading, deleteRound } from '../../store/slices/roundsSlice';
import { AppDispatch, RootState } from '../../store/store';

export default function HistoryScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const rounds = useSelector(selectAllRounds);
  const isLoading = useSelector(selectRoundsLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'completed', 'in-progress'

  useEffect(() => {
    if (user) {
      dispatch(fetchRounds());
    }
  }, [dispatch, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRounds());
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
          onPress: () => dispatch(deleteRound(roundId)),
          style: "destructive"
        }
      ]
    );
  };

  const getFilteredRounds = () => {
    switch (filterType) {
      case 'completed':
        return rounds.filter(round => round.isCompleted);
      case 'in-progress':
        return rounds.filter(round => !round.isCompleted);
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
        onPress={() => router.push(`/rounds/${item.id}`)}
      >
        <Card style={styles.roundCard}>
          <View style={styles.roundHeader}>
            <View style={styles.roundInfo}>
              <Text style={styles.courseName}>{item.course?.name || 'Unknown Course'}</Text>
              <Text style={styles.roundDate}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textLight} /> {formattedDate} • {formattedTime}
              </Text>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: item.isCompleted ? Colors.success + '20' : Colors.warning + '20',
              borderColor: item.isCompleted ? Colors.success : Colors.warning,
            }]}>
              <Text style={[styles.statusText, { 
                color: item.isCompleted ? Colors.success : Colors.warning 
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
                      color: scoreRelativeToPar > 0 ? Colors.error : 
                             scoreRelativeToPar < 0 ? Colors.success : 
                             Colors.text 
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
              onPress={() => router.push(`/rounds/${item.id}`)}
            >
              <Ionicons name="eye-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            {!item.isCompleted && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/round')}
              >
                <Ionicons name="play-outline" size={18} color={Colors.success} />
                <Text style={[styles.actionText, { color: Colors.success }]}>Continue</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteRound(item.id, item.course?.name || 'Unknown Course', formattedDate)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading rounds...</Text>
        </View>
      ) : (
        <>
          {filteredRounds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="golf-outline" size={60} color={Colors.textLight} />
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
                  colors={[Colors.primary]}
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
  filterContainer: {
    flexDirection: 'row',
    marginTop: Spacing.small,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.medium,
    borderRadius: 20,
    marginRight: Spacing.small,
    backgroundColor: Colors.lightGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.small,
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
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
  },
  listContent: {
    padding: Spacing.medium,
  },
  listHeader: {
    marginBottom: Spacing.medium,
  },
  listHeaderText: {
    fontSize: FontSize.medium,
    color: Colors.textLight,
    marginBottom: Spacing.small / 2,
  },
  listHeaderDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  roundItem: {
    marginBottom: Spacing.medium,
  },
  roundCard: {
    padding: Spacing.medium,
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
    fontSize: FontSize.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  roundDate: {
    fontSize: FontSize.small,
    color: Colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: FontSize.xsmall,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.medium,
  },
  roundDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.medium,
  },
  detailItem: {
    width: '50%',
    marginBottom: Spacing.small,
  },
  detailLabel: {
    fontSize: FontSize.small,
    color: Colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.medium,
    color: Colors.text,
    fontWeight: '500',
  },
  parScore: {
    fontSize: FontSize.small,
  },
  roundActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
}); 