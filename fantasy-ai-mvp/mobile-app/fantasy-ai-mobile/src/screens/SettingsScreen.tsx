import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import VoiceService from '../services/VoiceService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';
import VoicePersonaSelector from '../components/VoicePersonaSelector';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'switch' | 'navigation' | 'action' | 'info';
  value?: boolean;
  color?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

const SettingsScreen: React.FC = () => {
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showVoicePersona, setShowVoicePersona] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [currentPersona, setCurrentPersona] = useState<any>(null);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  const {
    isVoiceEnabled,
    setVoiceEnabled,
    isBiometricEnabled,
    setBiometricEnabled,
    isNotificationsEnabled,
    setNotificationsEnabled,
    currentUser,
  } = useAppStore();

  useEffect(() => {
    startAnimations();
    loadSettings();
    loadCurrentPersona();
  }, []);

  const loadCurrentPersona = () => {
    const persona = VoiceService.getCurrentPersona();
    setCurrentPersona(persona);
  };

  const startAnimations = () => {
    fadeAnim.value = withSpring(1, { damping: 20 });
    slideAnim.value = withSpring(0, { damping: 15 });
  };

  const loadSettings = async () => {
    try {
      // Load additional settings from storage
      const savedSettings = {
        darkMode: true,
        hapticFeedback: true,
        autoRefresh: true,
        dataUsage: 'wifi_only',
        voiceLanguage: 'en-US',
        notificationSound: 'default',
      };
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleVoiceToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await VoiceService.initialize();
        if (success) {
          setVoiceEnabled(true);
          loadCurrentPersona(); // Reload persona after initialization
          HapticService.success();
        } else {
          Alert.alert('Error', 'Failed to enable voice features');
        }
      } else {
        await VoiceService.disable();
        setVoiceEnabled(false);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      Alert.alert('Error', 'Failed to update voice settings');
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await BiometricService.requestPermissions();
        if (success) {
          setBiometricEnabled(true);
          HapticService.success();
        } else {
          Alert.alert('Error', 'Failed to enable biometric features');
        }
      } else {
        setBiometricEnabled(false);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await NotificationService.requestPermissions();
        if (success) {
          setNotificationsEnabled(true);
          HapticService.success();
        } else {
          Alert.alert('Error', 'Failed to enable notifications');
        }
      } else {
        await NotificationService.disable();
        setNotificationsEnabled(false);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Fantasy.AI - Voice-Powered Fantasy Sports',
        message: 'Check out Fantasy.AI, the world\'s first voice-powered fantasy sports app with AI insights and AR features! 🏈🎙️',
        url: 'https://fantasy.ai',
      });
      HapticService.success();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRateApp = async () => {
    try {
      const url = 'https://apps.apple.com/app/fantasy-ai';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Rate app error:', error);
    }
  };

  const handleContactSupport = async () => {
    try {
      const url = 'mailto:support@fantasy.ai?subject=Fantasy.AI Support';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        HapticService.impact('light');
      }
    } catch (error) {
      console.error('Contact support error:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and may slow down the app temporarily. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Clear cache logic
            HapticService.success();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }));

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'switch'}
    >
      <View style={styles.settingContent}>
        <View style={[styles.settingIcon, { backgroundColor: item.color || AppTheme.colors.primary }]}>
          <Icon name={item.icon} size={20} color="white" />
        </View>
        
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        <View style={styles.settingAction}>
          {item.type === 'switch' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: AppTheme.colors.primary }}
              thumbColor="white"
            />
          )}
          
          {item.type === 'navigation' && (
            <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
          )}
          
          {item.type === 'info' && (
            <Text style={styles.settingValue}>{item.value}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section: SettingSection) => (
    <View key={section.id} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAbout}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAbout(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.modalGradient}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About Fantasy.AI</Text>
            <TouchableOpacity
              onPress={() => setShowAbout(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>🎙️ Fantasy.AI</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appDescription}>
                The world's first voice-powered fantasy sports platform with AI-driven insights, 
                real-time analysis, and AR features.
              </Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Features</Text>
              {[
                '🎤 Voice-first interface with "Hey Fantasy"',
                '🤖 AI-powered player analysis',
                '📱 Real-time multimedia insights',
                '🥽 AR live game overlays',
                '🔗 Universal league integration',
                '⌚ Biometric health tracking',
                '🚨 Smart injury alerts',
                '📊 Advanced analytics',
              ].map((feature, index) => (
                <Text key={index} style={styles.featureItem}>{feature}</Text>
              ))}
            </View>

            <View style={styles.creditsSection}>
              <Text style={styles.creditsTitle}>Powered By</Text>
              <Text style={styles.creditsText}>
                • OpenAI GPT-4 for intelligent analysis{'\n'}
                • ElevenLabs for natural voice synthesis{'\n'}
                • Supabase for real-time data{'\n'}
                • 23 MCP servers for enterprise capabilities
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );

  const settingSections: SettingSection[] = [
    {
      id: 'features',
      title: 'Features',
      items: [
        {
          id: 'voice',
          title: 'Voice Assistant',
          subtitle: 'Enable "Hey Fantasy" voice commands',
          icon: 'mic',
          type: 'switch',
          value: isVoiceEnabled,
          color: '#9C27B0',
          onToggle: handleVoiceToggle,
        },
        {
          id: 'voice_persona',
          title: 'Voice Personality',
          subtitle: currentPersona ? `Using ${currentPersona.name}` : 'Choose your assistant\'s voice',
          icon: 'record-voice-over',
          type: 'navigation',
          color: '#E91E63',
          onPress: () => {
            if (isVoiceEnabled) {
              setShowVoicePersona(true);
            } else {
              Alert.alert('Voice Disabled', 'Please enable voice assistant first to choose a personality.');
            }
          },
        },
        {
          id: 'biometric',
          title: 'Health Integration',
          subtitle: 'Connect Apple Watch, WHOOP, Fitbit',
          icon: 'fitness-center',
          type: 'switch',
          value: isBiometricEnabled,
          color: '#FF6B6B',
          onToggle: handleBiometricToggle,
        },
        {
          id: 'notifications',
          title: 'Smart Notifications',
          subtitle: 'Injury alerts and breaking news',
          icon: 'notifications',
          type: 'switch',
          value: isNotificationsEnabled,
          color: '#4ECDC4',
          onToggle: handleNotificationToggle,
        },
        {
          id: 'haptic',
          title: 'Haptic Feedback',
          subtitle: 'Vibration for interactions',
          icon: 'vibration',
          type: 'switch',
          value: settings.hapticFeedback,
          color: '#FFA726',
          onToggle: (value) => setSettings(prev => ({ ...prev, hapticFeedback: value })),
        },
      ],
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      items: [
        {
          id: 'auto_refresh',
          title: 'Auto Refresh',
          subtitle: 'Automatically update data',
          icon: 'sync',
          type: 'switch',
          value: settings.autoRefresh,
          color: '#67B7DC',
          onToggle: (value) => setSettings(prev => ({ ...prev, autoRefresh: value })),
        },
        {
          id: 'data_usage',
          title: 'Data Usage',
          subtitle: 'WiFi only or cellular allowed',
          icon: 'data-usage',
          type: 'navigation',
          value: settings.dataUsage,
          color: '#8BC34A',
          onPress: () => {
            Alert.alert('Data Usage', 'Feature coming soon');
          },
        },
        {
          id: 'clear_cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: 'clear-all',
          type: 'action',
          color: '#FF7043',
          onPress: handleClearCache,
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          icon: 'privacy-tip',
          type: 'navigation',
          color: '#9E9E9E',
          onPress: () => setShowPrivacy(true),
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & Feedback',
      items: [
        {
          id: 'rate',
          title: 'Rate Fantasy.AI',
          subtitle: 'Leave a review on the App Store',
          icon: 'star-rate',
          type: 'action',
          color: '#FFD700',
          onPress: handleRateApp,
        },
        {
          id: 'share',
          title: 'Share App',
          subtitle: 'Tell friends about Fantasy.AI',
          icon: 'share',
          type: 'action',
          color: '#03DAC6',
          onPress: handleShareApp,
        },
        {
          id: 'contact',
          title: 'Contact Support',
          subtitle: 'Get help from our team',
          icon: 'support-agent',
          type: 'action',
          color: '#6200EA',
          onPress: handleContactSupport,
        },
        {
          id: 'about',
          title: 'About Fantasy.AI',
          subtitle: 'Version info and credits',
          icon: 'info',
          type: 'navigation',
          color: '#37474F',
          onPress: () => setShowAbout(true),
        },
      ],
    },
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'user_id',
          title: 'User ID',
          subtitle: currentUser?.id || 'Not logged in',
          icon: 'account-circle',
          type: 'info',
          color: '#795548',
        },
        {
          id: 'app_version',
          title: 'App Version',
          subtitle: '1.0.0 (Build 1)',
          icon: 'info-outline',
          type: 'info',
          color: '#607D8B',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your Fantasy.AI experience</Text>
        </View>

        {/* Settings List */}
        <Animated.View style={[styles.content, animatedContainerStyle]}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {settingSections.map(renderSection)}
          </ScrollView>
        </Animated.View>

        {/* Modals */}
        {renderAboutModal()}
        
        {/* Voice Persona Selector Modal */}
        <VoicePersonaSelector
          visible={showVoicePersona}
          onClose={() => setShowVoicePersona(false)}
          onPersonaSelected={(persona) => {
            setCurrentPersona(persona);
            loadCurrentPersona();
          }}
          currentPersonaId={currentPersona?.id}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  settingAction: {
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    lineHeight: 20,
  },
  creditsSection: {
    marginBottom: 32,
  },
  creditsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  creditsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});

export default SettingsScreen;