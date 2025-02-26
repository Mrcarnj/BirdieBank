import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { COLORS } from '../../constants/theme';
import { RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';

interface Hole {
  number: number;
  par: number;
  score?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

interface Round {
  id: string;
  date: string;
  courseName: string;
  courseId: string;
  teeName?: string;
  totalScore: number;
  totalPar: number;
  holes: Hole[];
  status: 'completed' | 'in-progress';
}

export default function RoundDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the round details from your API or Redux store
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      // Mock data - replace with actual data fetching
      const mockHoles = Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
        score: Math.floor(Math.random() * 3) + 3 + (i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0),
        putts: Math.floor(Math.random() * 3) + 1,
        fairwayHit: Math.random() > 0.3,
        greenInRegulation: Math.random() > 0.4,
      }));
      
      const totalPar = mockHoles.reduce((sum, hole) => sum + hole.par, 0);
      const totalScore = mockHoles.reduce((sum, hole) => sum + (hole.score || 0), 0);
      
      setRound({
        id: id as string,
        date: new Date().toISOString(),
        courseName: 'Sample Golf Course',
        courseId: '123',
        teeName: 'Blue',
        totalScore,
        totalPar,
        holes: mockHoles,
        status: 'completed',
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Round Details' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading round details...</Text>
      </View>
    );
  }

  if (!round) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Round Not Found' }} />
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.secondary} />
        <Text style={styles.errorText}>Round not found</Text>
        <Text style={styles.errorSubtext}>The round you're looking for doesn't exist or has been removed.</Text>
      </View>
    );
  }

  const scoreRelativeToPar = round.totalScore - round.totalPar;
  const scoreDisplay = scoreRelativeToPar === 0 
    ? 'E' 
    : scoreRelativeToPar > 0 
      ? `+${scoreRelativeToPar}` 
      : scoreRelativeToPar.toString();

  const frontNine = round.holes.slice(0, 9);
  const backNine = round.holes.slice(9, 18);
  
  const frontNinePar = frontNine.reduce((sum, hole) => sum + hole.par, 0);
  const backNinePar = backNine.reduce((sum, hole) => sum + hole.par, 0);
  
  const frontNineScore = frontNine.reduce((sum, hole) => sum + (hole.score || 0), 0);
  const backNineScore = backNine.reduce((sum, hole) => sum + (hole.score || 0), 0);

  const renderHoleRow = (hole: Hole) => {
    const scoreDiff = (hole.score || 0) - hole.par;
    let scoreStyle = styles.parScore;
    let scoreLabel = '';
    
    if (scoreDiff < -1) {
      scoreStyle = styles.eagleScore;
      scoreLabel = 'Eagle+';
    } else if (scoreDiff === -1) {
      scoreStyle = styles.birdieScore;
      scoreLabel = 'Birdie';
    } else if (scoreDiff === 0) {
      scoreStyle = styles.parScore;
      scoreLabel = 'Par';
    } else if (scoreDiff === 1) {
      scoreStyle = styles.bogeyScore;
      scoreLabel = 'Bogey';
    } else if (scoreDiff > 1) {
      scoreStyle = styles.doubleBogeyScore;
      scoreLabel = 'Bogey+';
    }

    return (
      <View key={hole.number} style={styles.holeRow}>
        <View style={styles.holeNumberContainer}>
          <Text style={styles.holeNumber}>{hole.number}</Text>
        </View>
        <Text style={styles.holePar}>Par {hole.par}</Text>
        <View style={[styles.scoreContainer, scoreStyle]}>
          <Text style={styles.score}>{hole.score}</Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Putts</Text>
            <Text style={styles.statValue}>{hole.putts || '-'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>FIR</Text>
            <Ionicons 
              name={hole.fairwayHit ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={hole.fairwayHit ? COLORS.primary : COLORS.secondary} 
            />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>GIR</Text>
            <Ionicons 
              name={hole.greenInRegulation ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={hole.greenInRegulation ? COLORS.primary : COLORS.secondary} 
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Round Details' }} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.courseName}>{round.courseName}</Text>
          <Text style={styles.roundDate}>
            {new Date(round.date).toLocaleDateString()} • {round.teeName} Tees
          </Text>
          
          <View style={styles.scoreOverview}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Total</Text>
              <Text style={styles.scoreCardValue}>{round.totalScore}</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Par</Text>
              <Text style={styles.scoreCardValue}>{round.totalPar}</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>To Par</Text>
              <Text style={[
                styles.scoreCardValue, 
                scoreRelativeToPar < 0 ? styles.underParText : 
                scoreRelativeToPar > 0 ? styles.overParText : 
                styles.evenParText
              ]}>
                {scoreDisplay}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Front Nine</Text>
          <View style={styles.nineHolesSummary}>
            <Text style={styles.nineHolesLabel}>Par: {frontNinePar}</Text>
            <Text style={styles.nineHolesLabel}>Score: {frontNineScore}</Text>
            <Text style={[
              styles.nineHolesLabel,
              frontNineScore < frontNinePar ? styles.underParText : 
              frontNineScore > frontNinePar ? styles.overParText : 
              styles.evenParText
            ]}>
              {frontNineScore - frontNinePar === 0 
                ? 'Even' 
                : frontNineScore - frontNinePar > 0 
                  ? `+${frontNineScore - frontNinePar}` 
                  : (frontNineScore - frontNinePar).toString()}
            </Text>
          </View>
          <View style={styles.holesContainer}>
            {frontNine.map(renderHoleRow)}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Back Nine</Text>
          <View style={styles.nineHolesSummary}>
            <Text style={styles.nineHolesLabel}>Par: {backNinePar}</Text>
            <Text style={styles.nineHolesLabel}>Score: {backNineScore}</Text>
            <Text style={[
              styles.nineHolesLabel,
              backNineScore < backNinePar ? styles.underParText : 
              backNineScore > backNinePar ? styles.overParText : 
              styles.evenParText
            ]}>
              {backNineScore - backNinePar === 0 
                ? 'Even' 
                : backNineScore - backNinePar > 0 
                  ? `+${backNineScore - backNinePar}` 
                  : (backNineScore - backNinePar).toString()}
            </Text>
          </View>
          <View style={styles.holesContainer}>
            {backNine.map(renderHoleRow)}
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="View Course" 
            onPress={() => {
              router.push(`/courses/${round.courseId}` as any);
            }} 
            variant="secondary"
            style={styles.button}
          />
        </View>
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
    padding: 24,
  },
  errorText: {
    ...createFontStyle('bold', 18),
    color: COLORS.secondary,
    marginTop: 16,
  },
  errorSubtext: {
    ...createFontStyle('regular', 14),
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  courseName: {
    ...createFontStyle('bold', 20),
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roundDate: {
    ...createFontStyle('regular', 14),
    color: '#FFFFFF',
    marginBottom: 16,
  },
  scoreOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  scoreCardLabel: {
    ...createFontStyle('medium', 12),
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scoreCardValue: {
    ...createFontStyle('bold', 20),
    color: '#FFFFFF',
  },
  underParText: {
    color: '#4CAF50',
  },
  overParText: {
    color: '#F44336',
  },
  evenParText: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...createFontStyle('bold', 18),
    color: COLORS.secondary,
    marginBottom: 12,
  },
  nineHolesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  nineHolesLabel: {
    ...createFontStyle('medium', 14),
    color: COLORS.secondary,
  },
  holesContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  holeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  holeNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  holeNumber: {
    ...createFontStyle('bold', 14),
    color: '#FFFFFF',
  },
  holePar: {
    ...createFontStyle('medium', 14),
    color: COLORS.secondary,
    width: 50,
  },
  scoreContainer: {
    width: 70,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  score: {
    ...createFontStyle('bold', 18),
    color: '#FFFFFF',
  },
  scoreLabel: {
    ...createFontStyle('regular', 10),
    color: '#FFFFFF',
  },
  eagleScore: {
    backgroundColor: '#4CAF50',
  },
  birdieScore: {
    backgroundColor: '#8BC34A',
  },
  parScore: {
    backgroundColor: '#9E9E9E',
  },
  bogeyScore: {
    backgroundColor: '#FF9800',
  },
  doubleBogeyScore: {
    backgroundColor: '#F44336',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...createFontStyle('regular', 10),
    color: COLORS.secondary,
    marginBottom: 4,
  },
  statValue: {
    ...createFontStyle('bold', 14),
    color: COLORS.secondary,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
}); 