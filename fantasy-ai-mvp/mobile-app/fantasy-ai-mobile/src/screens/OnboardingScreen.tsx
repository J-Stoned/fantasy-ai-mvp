import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import Lottie from 'lottie-react-native';

import { VoiceService } from '../services/VoiceService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  animation?: string;
  features: string[];
  permission?: string;
  action?: () => Promise<boolean>;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);
  const scaleAnim = useSharedValue(0.8);
  const progressAnim = useSharedValue(0);
  const featureAnims = useRef(Array.from({ length: 5 }, () => useSharedValue(0))).current;

  const { setVoiceEnabled, setBiometricEnabled, setNotificationsEnabled } = useAppStore();

  useEffect(() => {
    startIntroAnimations();
  }, []);

  useEffect(() => {
    animateStepChange();
  }, [currentStep]);

  const startIntroAnimations = () => {
    fadeAnim.value = withTiming(1, { duration: 1000 });
    slideAnim.value = withSpring(0, { damping: 20 });
    scaleAnim.value = withSpring(1, { damping: 15 });
  };

  const animateStepChange = () => {
    progressAnim.value = withTiming(currentStep / (onboardingSteps.length - 1), { duration: 500 });
    
    // Animate features with stagger
    featureAnims.forEach((anim, index) => {
      anim.value = 0;
      anim.value = withDelay(
        index * 100,
        withSpring(1, { damping: 20 })
      );
    });
  };

  const handleNextStep = async () => {
    const step = onboardingSteps[currentStep];
    
    if (step.action) {
      setIsLoading(true);
      HapticService.impact('medium');
      
      try {
        const success = await step.action();
        if (success && step.permission) {
          setPermissionsGranted(prev => ({ ...prev, [step.permission!]: true }));
        }
      } catch (error) {
        console.error('Onboarding step error:', error);
        Alert.alert('Error', 'Failed to complete this step. You can continue and enable this later in settings.');
      } finally {
        setIsLoading(false);
      }
    }

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      HapticService.impact('light');
    } else {
      handleComplete();
    }
  };

  const handleSkipStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      HapticService.impact('light');
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    HapticService.success();
    onComplete();
  };

  const requestVoicePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Voice Permission',
            message: 'Fantasy.AI needs microphone access for voice commands',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await VoiceService.initialize();
          setVoiceEnabled(true);
          return true;
        }
      } else {
        // iOS permission handling
        await VoiceService.initialize();
        setVoiceEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Voice permission error:', error);
      return false;
    }
  };

  const requestBiometricPermission = async (): Promise<boolean> => {
    try {
      const success = await BiometricService.requestPermissions();
      if (success) {
        setBiometricEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Biometric permission error:', error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const success = await NotificationService.requestPermissions();
      if (success) {
        setNotificationsEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ]
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`
  }));

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
      </View>
      <Text style={styles.progressText}>
        {currentStep + 1} of {onboardingSteps.length}
      </Text>
    </View>
  );

  const renderFeatureItem = (feature: string, index: number) => {
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: featureAnims[index]?.value || 0,
      transform: [
        { translateX: interpolate(featureAnims[index]?.value || 0, [0, 1], [-50, 0]) },
        { scale: featureAnims[index]?.value || 0.8 }
      ]
    }));

    return (
      <Animated.View key={index} style={[styles.featureItem, animatedStyle]}>
        <Icon name="check-circle" size={20} color={AppTheme.colors.primary} />
        <Text style={styles.featureText}>{feature}</Text>
      </Animated.View>
    );
  };

  const renderCurrentStep = () => {
    const step = onboardingSteps[currentStep];
    const isPermissionGranted = step.permission ? permissionsGranted[step.permission] : false;

    return (
      <Animated.View style={[styles.stepContainer, animatedContainerStyle]}>
        {/* Step Icon/Animation */}
        <View style={styles.iconContainer}>
          {step.animation ? (
            <Lottie
              source={require(`../assets/animations/${step.animation}.json`)}
              autoPlay
              loop
              style={styles.animation}
            />
          ) : (
            <LinearGradient
              colors={AppTheme.gradients.primary}
              style={styles.iconCircle}
            >
              <Icon name={step.icon} size={48} color="white" />
            </LinearGradient>
          )}
        </View>

        {/* Step Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {step.features.map((feature, index) => renderFeatureItem(feature, index))}
          </View>

          {/* Permission Status */}
          {step.permission && (
            <View style={styles.permissionStatus}>
              {isPermissionGranted ? (
                <View style={styles.permissionGranted}>
                  <Icon name="check-circle" size={24} color="#4ECDC4" />
                  <Text style={styles.permissionGrantedText}>Permission Granted!</Text>
                </View>
              ) : (
                <View style={styles.permissionPending}>
                  <Icon name="info" size={24} color="#FFA726" />
                  <Text style={styles.permissionPendingText}>Tap "Enable" to grant permission</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderActionButtons = () => {
    const step = onboardingSteps[currentStep];
    const isLastStep = currentStep === onboardingSteps.length - 1;
    const isPermissionGranted = step.permission ? permissionsGranted[step.permission] : false;

    return (
      <View style={styles.actionContainer}>
        {/* Skip Button */}
        {!isLastStep && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipStep}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Main Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isLoading && styles.actionButtonDisabled
          ]}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <LinearGradient
            colors={AppTheme.gradients.primary}
            style={styles.actionButtonGradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Icon name="hourglass-empty" size={20} color="white" />
                <Text style={styles.actionButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.actionButtonText}>
                  {isLastStep 
                    ? 'Get Started!' 
                    : step.action 
                    ? (isPermissionGranted ? 'Continue' : 'Enable')
                    : 'Continue'
                  }
                </Text>
                <Icon 
                  name={isLastStep ? 'rocket-launch' : 'arrow-forward'} 
                  size={20} 
                  color="white" 
                />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎙️ Fantasy.AI</Text>
          <Text style={styles.headerSubtitle}>Your Voice-Powered Fantasy Assistant</Text>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Action Buttons */}
        {renderActionButtons()}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Onboarding steps configuration
const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Fantasy.AI',
    subtitle: 'The Future of Fantasy Sports',
    description: 'Experience the world\'s first voice-powered fantasy platform with AI-driven insights and real-time analysis.',
    icon: 'sports',
    animation: 'welcome',
    features: [
      'Voice-first interface with "Hey Fantasy"',
      'AI-powered player analysis',
      'Real-time multimedia insights',
      'AR live game overlays',
      'Cross-platform league management'
    ]
  },
  {
    id: 'voice',
    title: 'Voice Assistant',
    subtitle: 'Say "Hey Fantasy" to Get Started',
    description: 'Enable voice commands to control your fantasy experience hands-free. Ask questions, set lineups, and get insights.',
    icon: 'mic',
    animation: 'voice',
    permission: 'voice',
    action: async function() { return await this.requestVoicePermission(); },
    features: [
      'Natural voice commands',
      'Hands-free lineup management',
      'Real-time voice responses',
      'Wake word detection',
      'Multi-language support'
    ]
  },
  {
    id: 'biometric',
    title: 'Health Integration',
    subtitle: 'Connect Your Wearables',
    description: 'Link Apple Watch, WHOOP, Fitbit for performance insights that affect your fantasy decisions.',
    icon: 'fitness-center',
    animation: 'health',
    permission: 'biometric',
    action: async function() { return await this.requestBiometricPermission(); },
    features: [
      'Apple Watch integration',
      'WHOOP strain monitoring',
      'Fitbit sleep tracking',
      'Performance correlation',
      'Health-based recommendations'
    ]
  },
  {
    id: 'notifications',
    title: 'Smart Alerts',
    subtitle: 'Never Miss Important Updates',
    description: 'Get instant notifications for injuries, trades, lineup changes, and breaking fantasy news.',
    icon: 'notifications',
    animation: 'notifications',
    permission: 'notifications',
    action: async function() { return await this.requestNotificationPermission(); },
    features: [
      'Injury alerts in real-time',
      'Trade deadline notifications',
      'Lineup optimization reminders',
      'Breaking news updates',
      'Custom alert preferences'
    ]
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    subtitle: 'Ready to Dominate Fantasy Sports',
    description: 'Fantasy.AI is configured and ready to help you win. Start by connecting your leagues or exploring insights.',
    icon: 'celebration',
    animation: 'success',
    features: [
      'Connect Yahoo, ESPN, Sleeper leagues',
      'Explore AI-powered insights',
      'Use AR camera for live analysis',
      'Ask voice questions anytime',
      'Track your performance metrics'
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  animation: {
    width: 120,
    height: 120,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  permissionStatus: {
    width: '100%',
    alignItems: 'center',
  },
  permissionGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionGrantedText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  permissionPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionPendingText: {
    fontSize: 14,
    color: '#FFA726',
    marginLeft: 8,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    maxWidth: 200,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default OnboardingScreen;