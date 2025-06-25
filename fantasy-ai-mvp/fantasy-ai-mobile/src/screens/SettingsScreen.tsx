import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  List,
  Switch,
  Button,
  Divider,
  Avatar,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SettingSection {
  title: string;
  icon: string;
  items: SettingItem[];
}

interface SettingItem {
  title: string;
  description?: string;
  type: 'toggle' | 'link' | 'action' | 'info';
  value?: boolean | string;
  action?: () => void;
}

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [injuryAlerts, setInjuryAlerts] = useState(true);
  const [tradeAlerts, setTradeAlerts] = useState(false);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoLineup, setAutoLineup] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subscription: 'Pro',
    avatar: 'JD',
  };

  const settingSections: SettingSection[] = [
    {
      title: 'Notifications',
      icon: 'bell',
      items: [
        {
          title: 'Push Notifications',
          description: 'Get alerts for important updates',
          type: 'toggle',
          value: pushNotifications,
          action: () => setPushNotifications(!pushNotifications),
        },
        {
          title: 'Injury Alerts',
          description: 'Notify when your players are injured',
          type: 'toggle',
          value: injuryAlerts,
          action: () => setInjuryAlerts(!injuryAlerts),
        },
        {
          title: 'Trade Alerts',
          description: 'Get notified of trade offers',
          type: 'toggle',
          value: tradeAlerts,
          action: () => setTradeAlerts(!tradeAlerts),
        },
        {
          title: 'News Updates',
          description: 'Breaking news about your players',
          type: 'toggle',
          value: newsAlerts,
          action: () => setNewsAlerts(!newsAlerts),
        },
      ],
    },
    {
      title: 'AI Assistant',
      icon: 'robot',
      items: [
        {
          title: 'Voice Commands',
          description: 'Enable "Hey Fantasy" voice assistant',
          type: 'toggle',
          value: voiceCommands,
          action: () => setVoiceCommands(!voiceCommands),
        },
        {
          title: 'Auto-Set Lineups',
          description: 'Let AI automatically optimize your lineups',
          type: 'toggle',
          value: autoLineup,
          action: () => setAutoLineup(!autoLineup),
        },
        {
          title: 'AI Preferences',
          description: 'Customize AI recommendations',
          type: 'link',
          action: () => navigation.navigate('AIPreferences' as never),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: 'shield',
      items: [
        {
          title: 'Biometric Authentication',
          description: 'Use Face ID or fingerprint to login',
          type: 'toggle',
          value: biometricAuth,
          action: () => setBiometricAuth(!biometricAuth),
        },
        {
          title: 'Privacy Settings',
          description: 'Control your data and privacy',
          type: 'link',
          action: () => setShowPrivacyDialog(true),
        },
        {
          title: 'Connected Accounts',
          description: 'Manage linked fantasy platforms',
          type: 'link',
          action: () => navigation.navigate('ConnectedAccounts' as never),
        },
      ],
    },
    {
      title: 'Appearance',
      icon: 'palette',
      items: [
        {
          title: 'Dark Theme',
          description: 'Use dark mode interface',
          type: 'toggle',
          value: darkTheme,
          action: () => setDarkTheme(!darkTheme),
        },
        {
          title: 'App Icon',
          description: 'Choose app icon style',
          type: 'link',
          action: () => navigation.navigate('AppIcon' as never),
        },
      ],
    },
    {
      title: 'About',
      icon: 'information',
      items: [
        {
          title: 'Version',
          description: '1.0.0 (Build 100)',
          type: 'info',
        },
        {
          title: 'Terms of Service',
          type: 'link',
          action: () => navigation.navigate('Terms' as never),
        },
        {
          title: 'Privacy Policy',
          type: 'link',
          action: () => navigation.navigate('Privacy' as never),
        },
        {
          title: 'Contact Support',
          type: 'link',
          action: () => navigation.navigate('Support' as never),
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout
            navigation.navigate('Login' as never);
          },
        },
      ],
    );
  };

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <List.Item
          title={item.title}
          description={item.description}
          right={() => (
            <Switch
              value={item.value as boolean}
              onValueChange={item.action}
            />
          )}
        />
      );
    }

    if (item.type === 'info') {
      return (
        <List.Item
          title={item.title}
          description={item.description}
          right={() => (
            <Text variant="bodyMedium" style={styles.infoText}>
              {item.description}
            </Text>
          )}
        />
      );
    }

    return (
      <List.Item
        title={item.title}
        description={item.description}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={item.action}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Settings
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView>
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.profileContent}>
            <Avatar.Text size={60} label={user.avatar} />
            <View style={styles.profileInfo}>
              <Text variant="titleMedium">{user.name}</Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {user.email}
              </Text>
              <Chip icon="crown" compact style={styles.subscriptionChip}>
                {user.subscription} Member
              </Chip>
            </View>
          </View>
          <View style={styles.profileActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAccountDialog(true)}
              style={styles.profileButton}
            >
              Edit Profile
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Subscription' as never)}
              style={styles.profileButton}
            >
              Upgrade
            </Button>
          </View>
        </Surface>

        {settingSections.map((section, index) => (
          <Surface key={index} style={styles.section} elevation={1}>
            <View style={styles.sectionHeader}>
              <Icon name={section.icon} size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {section.title}
              </Text>
            </View>
            <Divider style={styles.divider} />
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                {renderSettingItem(item)}
                {itemIndex < section.items.length - 1 && (
                  <Divider style={styles.itemDivider} />
                )}
              </View>
            ))}
          </Surface>
        ))}

        <Button
          mode="text"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={theme.colors.error}
        >
          Logout
        </Button>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Made with ❤️ by Fantasy.AI Team
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showAccountDialog} onDismiss={() => setShowAccountDialog(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={user.name}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Email"
              value={user.email}
              mode="outlined"
              style={styles.dialogInput}
              keyboardType="email-address"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAccountDialog(false)}>Cancel</Button>
            <Button onPress={() => setShowAccountDialog(false)}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showPrivacyDialog} onDismiss={() => setShowPrivacyDialog(false)}>
          <Dialog.Title>Privacy Settings</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={() => {}} value="friends">
              <RadioButton.Item label="Public Profile" value="public" />
              <RadioButton.Item label="Friends Only" value="friends" />
              <RadioButton.Item label="Private" value="private" />
            </RadioButton.Group>
            <Divider style={styles.dialogDivider} />
            <List.Item
              title="Share Performance Data"
              right={() => <Switch value={false} onValueChange={() => {}} />}
            />
            <List.Item
              title="Show in Leaderboards"
              right={() => <Switch value={true} onValueChange={() => {}} />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPrivacyDialog(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  profileCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileEmail: {
    opacity: 0.7,
    marginTop: 2,
  },
  subscriptionChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
  },
  profileButton: {
    flex: 1,
  },
  section: {
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  divider: {
    marginHorizontal: 15,
  },
  itemDivider: {
    marginLeft: 15,
  },
  infoText: {
    opacity: 0.6,
  },
  logoutButton: {
    margin: 15,
    marginTop: 5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    opacity: 0.5,
  },
  dialogInput: {
    marginBottom: 15,
  },
  dialogDivider: {
    marginVertical: 15,
  },
});

export default SettingsScreen;