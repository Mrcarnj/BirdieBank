import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { Course, Hole } from '../../store/slices/courseSlice';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import { HoleScore, Round } from '../../store/slices/roundSlice';
import { getMatchPlayStrokesReceived } from '../../utils/handicapUtils';

interface NassauScorecardProps {
  round: Round;
  players: PlayerWithTee[];
  scores: HoleScore[];
  course: Course;
  courseHandicaps: Record<string, number>;
}

export const NassauScorecard: React.FC<NassauScorecardProps> = ({
  round,
  players,
  scores,
  course,
  courseHandicaps,
}) => {
  const { colors } = useTheme();

  // Create arrays for front 9, back 9, and all 18 holes
  const front9 = Array.from({ length: 9 }, (_, i) => i + 1);
  const back9 = Array.from({ length: 9 }, (_, i) => i + 10);
  const allHoles = [...front9, ...back9];

  // Helper function to format player name (first name + last initial)
  const formatPlayerName = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstName} ${lastInitial}.`;
  };

  // Helper function to get hole data
  const getHoleData = (holeNumber: number): Hole | undefined => {
    return course?.holes?.find(hole => hole.number === holeNumber);
  };

  // Helper function to get player score for a hole
  const getPlayerScore = (playerId: string, holeNumber: number): number | undefined => {
    const score = scores.find(
      s => s.playerId === playerId && s.holeNumber === holeNumber
    );
    return score?.strokes;
  };

  // Helper function to calculate match play net score for a hole (for comparison only)
  const getMatchPlayNetScore = (playerId: string, holeNumber: number): number | undefined => {
    const grossScore = getPlayerScore(playerId, holeNumber);
    if (grossScore === undefined) return undefined;

    const hole = getHoleData(holeNumber);
    if (!hole || !hole.handicap) return grossScore;

    const playerHandicap = courseHandicaps[playerId] || 0;
    const opponentId = players[0].id === playerId ? players[1].id : players[0].id;
    const opponentHandicap = courseHandicaps[opponentId] || 0;

    const strokesReceived = getMatchPlayStrokesReceived(playerHandicap, opponentHandicap, hole.handicap);
    return grossScore - strokesReceived;
  };

  // Helper function to determine match status for a hole
  const getHoleStatus = (holeNumber: number): 'win' | 'loss' | 'halved' | undefined => {
    if (players.length !== 2) return undefined;

    const player1NetScore = getMatchPlayNetScore(players[0].id, holeNumber);
    const player2NetScore = getMatchPlayNetScore(players[1].id, holeNumber);

    if (player1NetScore === undefined || player2NetScore === undefined) return undefined;

    if (player1NetScore < player2NetScore) return 'win';
    if (player2NetScore < player1NetScore) return 'loss';
    return 'halved';
  };

  // Helper function to get match play strokes received for a hole
  const getMatchPlayStrokes = (playerId: string, holeNumber: number): number => {
    const hole = getHoleData(holeNumber);
    if (!hole || !hole.handicap) return 0;

    const playerHandicap = courseHandicaps[playerId] || 0;
    const opponentId = players[0].id === playerId ? players[1].id : players[0].id;
    const opponentHandicap = courseHandicaps[opponentId] || 0;

    return getMatchPlayStrokesReceived(playerHandicap, opponentHandicap, hole.handicap);
  };

  // Helper function to determine style based on match status
  const getMatchStatusStyle = (status: 'win' | 'loss' | 'halved' | undefined): ViewStyle => {
    if (!status) return {};

    switch (status) {
      case 'win':
        return { backgroundColor: '#4CAF50' }; // Green for win
      case 'loss':
        return { backgroundColor: '#FF0000' }; // Red for loss
      case 'halved':
        return { backgroundColor: '#FFD700' }; // Yellow for halved
      default:
        return {};
    }
  };

  // Helper function to determine text style based on match status
  const getMatchStatusTextStyle = (status: 'win' | 'loss' | 'halved' | undefined): TextStyle => {
    if (!status) return { color: colors.textPrimary };

    switch (status) {
      case 'win':
      case 'loss':
        return { color: '#FFFFFF' };
      case 'halved':
        return { color: '#000000' };
      default:
        return { color: colors.textPrimary };
    }
  };

  // Helper function to get match status text for a segment
  const getSegmentStatusText = (startHole: number, endHole: number, isTotal: boolean = false): string => {
    // Check if this segment has scores
    const hasScores = players.every(player => {
      for (let i = startHole; i <= endHole; i++) {
        const score = getPlayerScore(player.id, i);
        if (score === undefined) return false;
      }
      return true;
    });

    if (!hasScores) return '';

    // Calculate segment status
    let segmentStatus = 0;
    for (let i = startHole; i <= endHole; i++) {
      const status = getHoleStatus(i);
      if (status === 'win') segmentStatus++;
      if (status === 'loss') segmentStatus--;
    }

    // For total column, show overall status
    if (isTotal) {
      if (segmentStatus === 0) return 'AS';
      const absStatus = Math.abs(segmentStatus);
      return segmentStatus > 0 ? `${absStatus}↑` : `${absStatus}↓`;
    }

    // For front/back segments
    if (segmentStatus === 0) return 'AS';
    const absStatus = Math.abs(segmentStatus);
    return segmentStatus > 0 ? `${absStatus}↑` : `${absStatus}↓`;
  };

  // Helper function to render match status row
  const renderMatchStatusRow = (isBack9: boolean = false) => (
    <View style={styles.row}>
      <View style={styles.playerCell}>
        <Text style={[styles.playerName, { color: colors.textPrimary }]}>
          Match
        </Text>
      </View>

      {(isBack9 ? back9 : front9).map(holeNumber => {
        const status = getHoleStatus(holeNumber);
        if (!status) {
          return (
            <View 
              key={`match-${holeNumber}`} 
              style={styles.scoreCell}
            >
              <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
                {''}
              </Text>
            </View>
          );
        }

        return (
          <View 
            key={`match-${holeNumber}`} 
            style={[
              styles.scoreCell,
              getMatchStatusStyle(status)
            ]}
          >
            <Text style={[
              styles.scoreText,
              getMatchStatusTextStyle(status)
            ]}>
              {status === 'win' ? 'W' : status === 'loss' ? 'L' : 'H'}
            </Text>
          </View>
        );
      })}

      {/* Out/In total */}
      <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
        {(() => {
          const segmentStatus = getSegmentStatusText(
            isBack9 ? 10 : 1,
            isBack9 ? 18 : 9
          );
          if (!segmentStatus) return <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>{''}</Text>;

          const matchStatus = segmentStatus === 'AS' ? 0 : 
            segmentStatus.includes('↑') ? parseInt(segmentStatus) : -parseInt(segmentStatus);

          let statusStyle = {};
          if (matchStatus > 0) {
            statusStyle = { backgroundColor: '#4CAF50' }; // Green for up
          } else if (matchStatus < 0) {
            statusStyle = { backgroundColor: '#FF0000' }; // Red for down
          } else if (segmentStatus === 'AS') {
            statusStyle = { backgroundColor: '#FFD700' }; // Yellow for AS
          }

          return (
            <View style={[styles.totalStatusCell, statusStyle]}>
              <Text style={[
                styles.totalScoreText,
                { color: segmentStatus === 'AS' ? '#000000' : '#FFFFFF' }
              ]}>
                {segmentStatus}
              </Text>
            </View>
          );
        })()}
      </View>

      {/* Only show Tot column for back 9 row */}
      {isBack9 && (
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          {(() => {
            const overallStatus = getSegmentStatusText(1, 18, true);
            if (!overallStatus) return <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>{''}</Text>;

            const matchStatus = overallStatus === 'AS' ? 0 : 
              overallStatus.includes('↑') ? parseInt(overallStatus) : -parseInt(overallStatus);

            let statusStyle = {};
            if (matchStatus > 0) {
              statusStyle = { backgroundColor: '#4CAF50' }; // Green for up
            } else if (matchStatus < 0) {
              statusStyle = { backgroundColor: '#FF0000' }; // Red for down
            } else if (overallStatus === 'AS') {
              statusStyle = { backgroundColor: '#FFD700' }; // Yellow for AS
            }

            return (
              <View style={[styles.totalStatusCell, statusStyle]}>
                <Text style={[
                  styles.totalScoreText,
                  { color: overallStatus === 'AS' ? '#000000' : '#FFFFFF' }
                ]}>
                  {overallStatus}
                </Text>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );

  // Helper function to get score style based on relation to par
  const getScoreStyle = (score: number | undefined, par: number): ViewStyle => {
    if (score === undefined) return {};
    
    const scoreToPar = score - par;
    
    if (scoreToPar <= -2) return { backgroundColor: '#FFD700', borderRadius: 15 }; // Eagle or better: Yellow circle
    if (scoreToPar === -1) return { backgroundColor: '#FF0000', borderRadius: 15 }; // Birdie: Red circle
    if (scoreToPar === 0) return {}; // Par: No styling
    if (scoreToPar === 1) return { backgroundColor: '#000000' }; // Bogey: Black square
    if (scoreToPar >= 2) return { backgroundColor: '#0000FF' }; // Double bogey or worse: Blue square
    
    return {};
  };

  // Helper function to get score text style based on relation to par
  const getScoreTextStyle = (score: number | undefined, par: number): TextStyle => {
    if (score === undefined) return { color: colors.textPrimary };
    
    const scoreToPar = score - par;
    
    // Set text color to white for red, black and blue backgrounds
    if (scoreToPar === -1 || scoreToPar === 1 || scoreToPar >= 2) {
      return { color: '#FFFFFF' };
    }
    
    // Eagle or better (yellow background) gets black text
    if (scoreToPar <= -2) {
      return { color: '#000000' };
    }
    
    return { color: colors.textPrimary };
  };

  // Helper function to get stroke dot style based on score relative to par
  const getStrokeDotStyle = (score: number | undefined, par: number): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 6,
      height: 6,
      borderRadius: 3,
      borderWidth: 1,
    };

    if (score === undefined) {
      return {
        ...baseStyle,
        backgroundColor: '#000000',
        borderColor: 'white',
      };
    }
    
    const scoreToPar = score - par;
    const isBogey = scoreToPar === 1; // Bogey gets white dot
    
    return {
      ...baseStyle,
      backgroundColor: isBogey ? '#FFFFFF' : '#000000',
      borderColor: isBogey ? 'black' : 'white',
    };
  };

  return (
    <View style={[styles.scorecardSection, { backgroundColor: colors.card, borderWidth: 1, borderColor: 'black' }]}>
      {/* Hole numbers row */}
      <View style={styles.row}>
        <View style={styles.holeHeader}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Hole</Text>
        </View>
        {front9.map(holeNumber => (
          <View key={`hole-${holeNumber}`} style={[styles.holeCell, { backgroundColor: colors.primary }]}>
            <Text style={[styles.headerText, { color: colors.textLight }]}>{holeNumber}</Text>
          </View>
        ))}
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Out</Text>
        </View>
      </View>

      {/* Par row */}
      <View style={styles.row}>
        <View style={styles.holeHeader}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Par</Text>
        </View>
        {front9.map(holeNumber => {
          const hole = getHoleData(holeNumber);
          return (
            <View key={`par-${holeNumber}`} style={styles.holeCell}>
              <Text style={[styles.parText, { color: colors.textSecondary }]}>
                {hole?.par || '-'}
              </Text>
            </View>
          );
        })}
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.parText, { color: colors.textSecondary }]}>
            {front9.reduce((sum, holeNumber) => {
              const hole = getHoleData(holeNumber);
              return sum + (hole?.par || 0);
            }, 0)}
          </Text>
        </View>
      </View>

      {/* Player 1 scores */}
      <View style={styles.row}>
        <View style={styles.playerCell}>
          <Text style={[styles.playerName, { color: colors.textPrimary }]}>
            {formatPlayerName(players[0].name)}
          </Text>
        </View>

        {front9.map(holeNumber => {
          const grossScore = getPlayerScore(players[0].id, holeNumber);
          const hole = getHoleData(holeNumber);
          const par = hole?.par || 0;
          const strokesReceived = getMatchPlayStrokes(players[0].id, holeNumber);

          return (
            <View 
              key={`score-${players[0].id}-${holeNumber}`} 
              style={[
                styles.scoreCell,
                getScoreStyle(grossScore, par)
              ]}
            >
              <Text style={[
                styles.scoreText,
                getScoreTextStyle(grossScore, par)
              ]}>
                {grossScore !== undefined ? grossScore : '-'}
              </Text>
              {strokesReceived > 0 && (
                <View style={getStrokeDotStyle(grossScore, par)} />
              )}
            </View>
          );
        })}

        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {front9.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[0].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
      </View>

      {/* Match status row for front 9 */}
      {renderMatchStatusRow()}

      {/* Player 2 scores */}
      <View style={styles.row}>
        <View style={styles.playerCell}>
          <Text style={[styles.playerName, { color: colors.textPrimary }]}>
            {formatPlayerName(players[1].name)}
          </Text>
        </View>

        {front9.map(holeNumber => {
          const grossScore = getPlayerScore(players[1].id, holeNumber);
          const hole = getHoleData(holeNumber);
          const par = hole?.par || 0;
          const strokesReceived = getMatchPlayStrokes(players[1].id, holeNumber);

          return (
            <View 
              key={`score-${players[1].id}-${holeNumber}`} 
              style={[
                styles.scoreCell,
                getScoreStyle(grossScore, par)
              ]}
            >
              <Text style={[
                styles.scoreText,
                getScoreTextStyle(grossScore, par)
              ]}>
                {grossScore !== undefined ? grossScore : '-'}
              </Text>
              {strokesReceived > 0 && (
                <View style={getStrokeDotStyle(grossScore, par)} />
              )}
            </View>
          );
        })}

        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {front9.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[1].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
      </View>

      {/* Back 9 Section */}
      <View style={styles.row}>
        <View style={styles.holeHeader}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Hole</Text>
        </View>
        {back9.map(holeNumber => (
          <View key={`hole-${holeNumber}`} style={[styles.holeCell, { backgroundColor: colors.primary }]}>
            <Text style={[styles.headerText, { color: colors.textLight }]}>{holeNumber}</Text>
          </View>
        ))}
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>In</Text>
        </View>
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Tot</Text>
        </View>
      </View>

      {/* Par row */}
      <View style={styles.row}>
        <View style={styles.holeHeader}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Par</Text>
        </View>
        {back9.map(holeNumber => {
          const hole = getHoleData(holeNumber);
          return (
            <View key={`par-${holeNumber}`} style={styles.holeCell}>
              <Text style={[styles.parText, { color: colors.textSecondary }]}>
                {hole?.par || '-'}
              </Text>
            </View>
          );
        })}
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.parText, { color: colors.textSecondary }]}>
            {back9.reduce((sum, holeNumber) => {
              const hole = getHoleData(holeNumber);
              return sum + (hole?.par || 0);
            }, 0)}
          </Text>
        </View>
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.parText, { color: colors.textSecondary }]}>
            {allHoles.reduce((sum, holeNumber) => {
              const hole = getHoleData(holeNumber);
              return sum + (hole?.par || 0);
            }, 0)}
          </Text>
        </View>
      </View>

      {/* Player 1 scores */}
      <View style={styles.row}>
        <View style={styles.playerCell}>
          <Text style={[styles.playerName, { color: colors.textPrimary }]}>
            {formatPlayerName(players[0].name)}
          </Text>
        </View>

        {back9.map(holeNumber => {
          const grossScore = getPlayerScore(players[0].id, holeNumber);
          const hole = getHoleData(holeNumber);
          const par = hole?.par || 0;
          const strokesReceived = getMatchPlayStrokes(players[0].id, holeNumber);

          return (
            <View 
              key={`score-${players[0].id}-${holeNumber}`} 
              style={[
                styles.scoreCell,
                getScoreStyle(grossScore, par)
              ]}
            >
              <Text style={[
                styles.scoreText,
                getScoreTextStyle(grossScore, par)
              ]}>
                {grossScore !== undefined ? grossScore : '-'}
              </Text>
              {strokesReceived > 0 && (
                <View style={getStrokeDotStyle(grossScore, par)} />
              )}
            </View>
          );
        })}

        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {back9.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[0].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {allHoles.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[0].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
      </View>

      {/* Match status row for back 9 */}
      {renderMatchStatusRow(true)}

      {/* Player 2 scores */}
      <View style={styles.row}>
        <View style={styles.playerCell}>
          <Text style={[styles.playerName, { color: colors.textPrimary }]}>
            {formatPlayerName(players[1].name)}
          </Text>
        </View>

        {back9.map(holeNumber => {
          const grossScore = getPlayerScore(players[1].id, holeNumber);
          const hole = getHoleData(holeNumber);
          const par = hole?.par || 0;
          const strokesReceived = getMatchPlayStrokes(players[1].id, holeNumber);

          return (
            <View 
              key={`score-${players[1].id}-${holeNumber}`} 
              style={[
                styles.scoreCell,
                getScoreStyle(grossScore, par)
              ]}
            >
              <Text style={[
                styles.scoreText,
                getScoreTextStyle(grossScore, par)
              ]}>
                {grossScore !== undefined ? grossScore : '-'}
              </Text>
              {strokesReceived > 0 && (
                <View style={getStrokeDotStyle(grossScore, par)} />
              )}
            </View>
          );
        })}

        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {back9.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[1].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
        <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
            {allHoles.reduce((sum, holeNumber) => {
              const score = getPlayerScore(players[1].id, holeNumber);
              return sum + (score || 0);
            }, 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scorecardSection: {
    marginBottom: SIZES.base,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  holeHeader: {
    width: 44,
    padding: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  playerCell: {
    width: 44,
    padding: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  holeCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  scoreCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  totalCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  playerName: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
  },
  parText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  totalScoreText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  totalStatusCell: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 