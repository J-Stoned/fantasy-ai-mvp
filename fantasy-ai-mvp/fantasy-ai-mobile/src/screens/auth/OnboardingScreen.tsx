import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  ProgressBar,
  Chip,
  RadioButton,
  Checkbox,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  content?: React.ReactNode;
}

const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableVoiceCommands, setEnableVoiceCommands] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const sports = [
    { id: 'nfl', name: 'NFL', icon: 'football' },
    { id: 'nba', name: 'NBA', icon: 'basketball' },
    { id: 'mlb', name: 'MLB', icon: 'baseball' },
    { id: 'nhl', name: 'NHL', icon: 'hockey-puck' },
    { id: 'soccer', name: 'Soccer', icon: 'soccer' },
    { id: 'golf', name: 'Golf', icon: 'golf' },
  ];

  const platforms = [
    { id: 'yahoo', name: 'Yahoo Fantasy' },
    { id: 'espn', name: 'ESPN Fantasy' },
    { id: 'sleeper', name: 'Sleeper' },
    { id: 'cbs', name: 'CBS Sports' },
    { id: 'draftkings', name: 'DraftKings' },
    { id: 'fanduel', name: 'FanDuel' },
  ];

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Fantasy.AI',
      description: 'Your AI-powered assistant for dominating fantasy sports',
      icon: 'brain',
    },
    {
      title: 'Choose Your Sports',
      description: 'Select the sports you play or follow',
      icon: 'trophy',
      content: (
        <View style={styles.sportsGrid}>
          {sports.map(sport => (
            <Chip
              key={sport.id}
              selected={selectedSports.includes(sport.id)}
              onPress={() => {
                if (selectedSports.includes(sport.id)) {
                  setSelectedSports(selectedSports.filter(s => s !== sport.id));
                } else {
                  setSelectedSports([...selectedSports, sport.id]);
                }
              }}
              icon={sport.icon}
              style={styles.sportChip}
              selectedColor={theme.colors.primary}
            >
              {sport.name}
            </Chip>
          ))}
        </View>
      ),
    },
    {
      title: 'Connect Your Platforms',
      description: 'Link your fantasy sports accounts for seamless integration',
      icon: 'link-variant',
      content: (
        <View style={styles.platformsList}>
          {platforms.map(platform => (
            <Surface key={platform.id} style={styles.platformItem} elevation={1}>
              <Checkbox.Item
                label={platform.name}
                status={selectedPlatforms.includes(platform.id) ? 'checked' : 'unchecked'}
                onPress={() => {
                  if (selectedPlatforms.includes(platform.id)) {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                  } else {
                    setSelectedPlatforms([...selectedPlatforms, platform.id]);
                  }
                }}
              />
            </Surface>
          ))}
        </View>
      ),
    },
    {
      title: 'Your Experience Level',
      description: 'Help us personalize your experience',
      icon: 'chart-line',
      content: (
        <RadioButton.Group
          onValueChange={setExperienceLevel}
          value={experienceLevel}
        >
          <Surface style={styles.radioItem} elevation={1}>
            <RadioButton.Item label="Beginner - New to fantasy sports" value="beginner" />
          </Surface>
          <Surface style={styles.radioItem} elevation={1}>
            <RadioButton.Item label="Intermediate - Play occasionally" value="intermediate" />
          </Surface>
          <Surface style={styles.radioItem} elevation={1}>
            <RadioButton.Item label="Expert - Multiple leagues veteran" value="expert" />
          </Surface>
        </RadioButton.Group>
      ),
    },
    {
      title: 'Enable AI Features',
      description: 'Get the most out of Fantasy.AI',
      icon: 'robot',
      content: (
        <View>
          <Surface style={styles.featureItem} elevation={1}>
            <Checkbox.Item
              label="Push Notifications"
              labelVariant="titleMedium"
              status={enableNotifications ? 'checked' : 'unchecked'}
              onPress={() => setEnableNotifications(!enableNotifications)}
            />
            <Text variant="bodySmall" style={styles.featureDescription}>
              Get real-time alerts for injuries, lineup changes, and AI recommendations
            </Text>
          </Surface>
          <Surface style={styles.featureItem} elevation={1}>
            <Checkbox.Item
              label="Voice Commands"
              labelVariant="titleMedium"
              status={enableVoiceCommands ? 'checked' : 'unchecked'}
              onPress={() => setEnableVoiceCommands(!enableVoiceCommands)}
            />
            <Text variant="bodySmall" style={styles.featureDescription}>
              Use "Hey Fantasy" to get instant insights and manage your teams hands-free
            </Text>
          </Surface>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      scrollViewRef.current?.scrollTo({
        x: (currentStep + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigation.navigate('Home' as never);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentStep - 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Home' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <ProgressBar
          progress={(currentStep + 1) / steps.length}
          style={styles.progressBar}
        />
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
        >
          Skip
        </Button>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {steps.map((step, index) => (
          <Animated.View
            key={index}
            style={[
              styles.stepContainer,
              {
                opacity: currentStep === index ? fadeAnim : 1,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Icon name={step.icon} size={80} color={theme.colors.primary} />
            </View>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              {step.title}
            </Text>
            <Text variant="bodyLarge" style={styles.stepDescription}>
              {step.description}
            </Text>
            {step.content && (
              <View style={styles.contentContainer}>
                {step.content}
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          disabled={currentStep === 0}
          style={styles.backButton}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          contentStyle={styles.buttonContent}
        >
          {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  skipButton: {
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  stepDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    flex: 1,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 20,
  },
  sportChip: {
    margin: 5,
  },
  platformsList: {
    width: '100%',
    paddingTop: 20,
  },
  platformItem: {
    marginBottom: 10,
    borderRadius: 8,
  },
  radioItem: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  featureItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
  },
  featureDescription: {
    paddingLeft: 55,
    paddingRight: 15,
    opacity: 0.7,
    marginTop: -5,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen;