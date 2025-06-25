import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  Divider,
  List,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  IconButton,
  Badge,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { User, UserPreferences } from '../types';
import { colors, spacing, typography, shadows } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.getCurrentUser(),
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Partial<UserPreferences>) => 
      api.updateUserPreferences(newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setShowPreferencesModal(false);
    },
  });

  React.useEffect(() => {
    if (user) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const getSubscriptionColor = (subscription: User['subscription']) => {
    const subColors = {
      free: colors.textSecondary,
      pro: colors.primary,
      elite: colors.secondary,
    };
    return subColors[subscription] || colors.textSecondary;
  };

  const renderStatCard = (label: string, value: string | number, icon: string, color: string) => (
    <Card style={[styles.statCard, shadows.sm]}>
      <Card.Content style={styles.statContent}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );

  const renderAchievement = (achievement: User['achievements'][0]) => (
    <TouchableOpacity
      key={achievement.id}
      style={styles.achievementItem}
      onPress={() => {/* Show achievement details */}}
    >
      <View style={[
        styles.achievementIcon,
        achievement.unlockedAt && styles.unlockedAchievement
      ]}>
        <Icon
          name={achievement.icon}
          size={28}
          color={achievement.unlockedAt ? colors.warning : colors.textDisabled}
        />
      </View>
      <Text
        style={[
          styles.achievementName,
          !achievement.unlockedAt && styles.lockedText
        ]}
        numberOfLines={1}
      >
        {achievement.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPreferencesModal = () => (
    <Portal>
      <Modal
        visible={showPreferencesModal}
        onDismiss={() => setShowPreferencesModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>Preferences</Text>

          {/* Voice Persona */}
          <View style={styles.preferenceSection}>
            <Text style={styles.preferenceLabel}>Voice Assistant Persona</Text>
            <RadioButton.Group
              onValueChange={(value) => setPreferences(prev => prev ? {...prev, voicePersona: value as any} : null)}
              value={preferences?.voicePersona || 'coach'}
            >
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setPreferences(prev => prev ? {...prev, voicePersona: 'expert'} : null)}
              >
                <RadioButton value="expert" color={colors.primary} />
                <View style={styles.radioInfo}>
                  <Text style={styles.radioLabel}>Expert Analyst</Text>
                  <Text style={styles.radioDescription}>Professional, data-driven insights</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setPreferences(prev => prev ? {...prev, voicePersona: 'coach'} : null)}
              >
                <RadioButton value="coach" color={colors.primary} />
                <View style={styles.radioInfo}>
                  <Text style={styles.radioLabel}>Fantasy Coach</Text>
                  <Text style={styles.radioDescription}>Motivational, strategic guidance</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setPreferences(prev => prev ? {...prev, voicePersona: 'analyst'} : null)}
              >
                <RadioButton value="analyst" color={colors.primary} />
                <View style={styles.radioInfo}>
                  <Text style={styles.radioLabel}>Stats Analyst</Text>
                  <Text style={styles.radioDescription}>Numbers-focused, analytical</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setPreferences(prev => prev ? {...prev, voicePersona: 'friend'} : null)}
              >
                <RadioButton value="friend" color={colors.primary} />
                <View style={styles.radioInfo}>
                  <Text style={styles.radioLabel}>Friendly Buddy</Text>
                  <Text style={styles.radioDescription}>Casual, conversational style</Text>
                </View>
              </TouchableOpacity>
            </RadioButton.Group>
          </View>

          {/* Notifications */}
          <View style={styles.preferenceSection}>
            <Text style={styles.preferenceLabel}>Notifications</Text>
            <View style={styles.notificationSettings}>
              {Object.entries(preferences?.notifications || {}).map(([key, value]) => (
                <View key={key} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} Updates
                  </Text>
                  <Switch
                    value={value}
                    onValueChange={(newValue) => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [key]: newValue
                        }
                      } : null)
                    }
                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                    thumbColor={value ? colors.text : colors.textSecondary}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowPreferencesModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (preferences) {
                  updatePreferencesMutation.mutate(preferences);
                }
              }}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              loading={updatePreferencesMutation.isLoading}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
          <Avatar.Text
            size={80}
            label={user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Chip
            mode="flat"
            style={[
              styles.subscriptionChip,
              { backgroundColor: getSubscriptionColor(user.subscription) }
            ]}
            textStyle={styles.subscriptionText}
          >
            {user.subscription.toUpperCase()} MEMBER
          </Chip>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Season Performance</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Wins', user.stats.totalWins, 'trophy', colors.warning)}
            {renderStatCard('Win Rate', `${Math.round((user.stats.totalWins / (user.stats.totalWins + user.stats.totalLosses)) * 100)}%`, 'percent', colors.tertiary)}
            {renderStatCard('Championships', user.stats.championships, 'crown', colors.secondary)}
            {renderStatCard('Best Finish', `#${user.stats.bestFinish}`, 'podium', colors.primary)}
            {renderStatCard('Total Trades', user.stats.totalTrades, 'swap-horizontal', colors.info)}
            {renderStatCard('AI Success', `${user.stats.successfulPredictions}`, 'brain', colors.neonPurple)}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Badge size={20} style={styles.achievementBadge}>
              {user.achievements.filter(a => a.unlockedAt).length}/{user.achievements.length}
            </Badge>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementsRow}>
              {user.achievements.map(renderAchievement)}
            </View>
          </ScrollView>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card style={[styles.settingsCard, shadows.sm]}>
            <List.Item
              title="Preferences"
              description="Voice persona, notifications"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowPreferencesModal(true)}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Connected Leagues"
              description="Yahoo, ESPN, Sleeper"
              left={(props) => <List.Icon {...props} icon="link" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ConnectedAccounts')}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Subscription"
              description={`${user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} plan`}
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Subscription')}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Privacy & Security"
              description="Manage your data"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Privacy')}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="API Test (Dev)"
              description="Test backend connection"
              left={(props) => <List.Icon {...props} icon="api" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('TestApi' as never)}
              style={styles.listItem}
            />
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Card style={[styles.supportCard, shadows.sm]}>
            <Card.Content>
              <View style={styles.supportHeader}>
                <Icon name="help-circle" size={24} color={colors.info} />
                <Text style={styles.supportTitle}>Need Help?</Text>
              </View>
              <Text style={styles.supportText}>
                Get support, report issues, or share feedback
              </Text>
              <View style={styles.supportActions}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => navigation.navigate('Support')}
                  style={styles.supportButton}
                >
                  Contact Support
                </Button>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => navigation.navigate('FAQ')}
                  style={styles.supportButton}
                >
                  FAQ
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            mode="contained"
            onPress={() => {/* Handle sign out */}}
            style={styles.signOutButton}
            buttonColor={colors.error}
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>

      {renderPreferencesModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body1,
    color: colors.text,
    opacity: 0.8,
    marginBottom: spacing.md,
  },
  subscriptionChip: {
    paddingHorizontal: spacing.md,
  },
  subscriptionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  achievementBadge: {
    backgroundColor: colors.primary,
  },
  achievementsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  achievementItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  unlockedAchievement: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  achievementName: {
    ...typography.caption,
    color: colors.text,
    width: 60,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.textDisabled,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  listItem: {
    paddingVertical: spacing.xs,
  },
  divider: {
    backgroundColor: colors.divider,
  },
  supportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  supportTitle: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  supportText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  supportActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  supportButton: {
    flex: 1,
  },
  signOutSection: {
    padding: spacing.lg,
  },
  signOutButton: {
    borderRadius: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h4,
    color: colors.error,
    marginTop: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  preferenceSection: {
    marginBottom: spacing.lg,
  },
  preferenceLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radioInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  radioLabel: {
    ...typography.body1,
    color: colors.text,
  },
  radioDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notificationSettings: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.body1,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});