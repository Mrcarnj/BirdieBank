import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import { COLORS, SIZES } from '../../constants/theme';
import Card from '../../components/Card';
import { fetchPlayers } from '../../store/slices/playerSlice';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

export default function PlayersScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { players, isLoading } = useSelector((state: RootState) => state.player);
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchPlayers(user.id));
    }
  }, [dispatch, user]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(fetchPlayers(user.id));
    setRefreshing(false);
  };

  const renderPlayerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playerItem}
      onPress={() => router.push(`/players/${item.id}` as any)}
    >
      <Card style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.playerName}>{item.name}</Text>
              {item.isGuest && (
                <Text style={styles.guestBadge}>Guest</Text>
              )}
            </View>
          </View>
          <FontAwesome5 name="chevron-right" size={16} color={COLORS.primary} />
        </View>
        
        {item.handicapIndex !== undefined && (
          <View style={styles.handicapContainer}>
            <Text style={styles.handicapLabel}>Handicap Index</Text>
            <Text style={styles.handicapValue}>{item.handicapIndex}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Players",
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/players/add' as any)}
            >
              <Ionicons name="add" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayerItem}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="users" size={60} color={COLORS.secondary} />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                Add players to track their scores and stats
              </Text>
              <TouchableOpacity
                style={styles.addPlayerButton}
                onPress={() => router.push('/players/add' as any)}
              >
                <Text style={styles.addPlayerButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addButton: {
    marginRight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.secondary,
    ...createFontStyle('medium', 14),
  },
  listContent: {
    padding: 16,
  },
  playerItem: {
    marginBottom: 16,
  },
  playerCard: {
    padding: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...createFontStyle('bold', 16),
    color: COLORS.secondary,
  },
  playerName: {
    ...createFontStyle('bold', 16),
    color: COLORS.textPrimary,
  },
  guestBadge: {
    ...createFontStyle('medium', 12),
    color: COLORS.textSecondary,
  },
  handicapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  handicapLabel: {
    ...createFontStyle('regular', 14),
    color: COLORS.textSecondary,
  },
  handicapValue: {
    ...createFontStyle('semiBold', 14),
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  emptyText: {
    ...createFontStyle('bold', 18),
    color: COLORS.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    ...createFontStyle('regular', 14),
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addPlayerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addPlayerButtonText: {
    ...createFontStyle('semiBold', 14),
    color: COLORS.secondary,
  },
}); 