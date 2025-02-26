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
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { Colors, Spacing, FontSize } from '../../constants/Theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { fetchPlayers, selectAllPlayers, selectPlayersLoading, deletePlayer } from '../../store/slices/playersSlice';
import { AppDispatch, RootState } from '../../store/store';

export default function PlayersScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const players = useSelector(selectAllPlayers);
  const isLoading = useSelector(selectPlayersLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState(players);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchPlayers());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchQuery, players]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPlayers());
    setRefreshing(false);
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${playerName}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => dispatch(deletePlayer(playerId)),
          style: "destructive"
        }
      ]
    );
  };

  const renderPlayerItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.playerItem}
        onPress={() => router.push(`/players/${item.id}`)}
      >
        <Card style={styles.playerCard}>
          <View style={styles.playerContent}>
            <View style={styles.avatarContainer}>
              {item.profileImageUrl ? (
                <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {item.isGuest && (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestBadgeText}>Guest</Text>
                </View>
              )}
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.name}</Text>
              {item.handicapIndex !== undefined && item.handicapIndex !== null && (
                <Text style={styles.handicap}>
                  Handicap: <Text style={styles.handicapValue}>{item.handicapIndex.toFixed(1)}</Text>
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeletePlayer(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {filteredPlayers.length} {filteredPlayers.length === 1 ? 'Player' : 'Players'}
      </Text>
      <View style={styles.listHeaderDivider} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Golf Buddies</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players by name"
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
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      ) : (
        <>
          {filteredPlayers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.length > 0 
                  ? 'Try a different search term'
                  : 'Add your golf buddies to get started'}
              </Text>
              <Button 
                title="Add New Player" 
                onPress={() => router.push('/players/add')} 
                style={styles.addButton}
              />
            </View>
          ) : (
            <FlatList
              data={filteredPlayers}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderHeader}
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
        onPress={() => router.push('/players/add')}
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
  playerItem: {
    marginBottom: Spacing.medium,
  },
  playerCard: {
    padding: Spacing.medium,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.medium,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: FontSize.large,
    fontWeight: 'bold',
  },
  guestBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  guestBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xsmall,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: FontSize.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  handicap: {
    fontSize: FontSize.small,
    color: Colors.textLight,
  },
  handicapValue: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  deleteButton: {
    padding: Spacing.small,
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