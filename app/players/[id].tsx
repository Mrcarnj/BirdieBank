import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import { COLORS } from '../../constants/theme';
import { RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const players = useSelector((state: RootState) => state.player.players);
  
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (players.length > 0 && id) {
      const foundPlayer = players.find(p => p.id === id);
      setPlayer(foundPlayer || null);
    }
    setLoading(false);
  }, [id, players]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading player details...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Player not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {player.profileImageUrl ? (
            <Image source={{ uri: player.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {player.isGuest && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest</Text>
            </View>
          )}
        </View>
        <Text style={styles.playerName}>{player.name}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Handicap Index</Text>
          <Text style={styles.detailValue}>
            {player.handicapIndex !== undefined && player.handicapIndex !== null 
              ? player.handicapIndex.toFixed(1) 
              : 'Not set'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Player Type</Text>
          <Text style={styles.detailValue}>
            {player.isGuest ? 'Guest Player' : 'Regular Player'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          title="Edit Player" 
          onPress={() => router.push(`/players/edit/${player.id}` as any)} 
          style={styles.actionButton}
        />
        <Button 
          title="Back to Players" 
          onPress={() => router.back()} 
          style={[styles.actionButton, styles.secondaryButton]}
          textStyle={styles.secondaryButtonText}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...createFontStyle('medium', 16),
    color: COLORS.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    ...createFontStyle('bold', 18),
    color: COLORS.error,
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...createFontStyle('bold', 36),
    color: COLORS.background,
  },
  guestBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  guestBadgeText: {
    ...createFontStyle('bold', 12),
    color: COLORS.background,
  },
  playerName: {
    ...createFontStyle('bold', 24),
    color: COLORS.secondary,
  },
  detailsContainer: {
    padding: 20,
  },
  detailItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
    paddingBottom: 8,
  },
  detailLabel: {
    ...createFontStyle('medium', 14),
    color: COLORS.secondary,
    marginBottom: 4,
  },
  detailValue: {
    ...createFontStyle('bold', 16),
    color: COLORS.secondary,
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
}); 