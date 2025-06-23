import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';

export default function LeaguesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { leagues, activeLeague, setActiveLeague } = useStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Leagues</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {leagues.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
              No leagues yet. Import or create your first league!
            </Text>
          </View>
        ) : (
          leagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[
                styles.leagueCard,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: activeLeague?.id === league.id ? theme.colors.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveLeague(league)}
            >
              <Text style={[styles.leagueName, { color: theme.colors.text }]}>
                {league.name}
              </Text>
              <Text style={[styles.leagueInfo, { color: theme.colors.textSecondary }]}>
                {league.platform} • {league.teams} teams • Week {league.currentWeek}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  leagueCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  leagueInfo: {
    fontSize: 14,
  },
});