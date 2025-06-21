/**
 * VoicePersonaSelector - Voice Personality Selection Component
 * 
 * Allows users to choose from different voice personas:
 * - Sports Commentator (energetic, dramatic)
 * - Fantasy Expert (analytical, professional)
 * - Fantasy Buddy (casual, friendly)
 * - Custom cloned voices
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { VoicePersona } from '../services/ElevenLabsService';
import VoiceService from '../services/VoiceService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';

const { width } = Dimensions.get('window');

interface VoicePersonaSelectorProps {
  visible: boolean;
  onClose: () => void;
  onPersonaSelected: (persona: VoicePersona) => void;
  currentPersonaId?: string;
}

const VoicePersonaSelector: React.FC<VoicePersonaSelectorProps> = ({
  visible,
  onClose,
  onPersonaSelected,
  currentPersonaId
}) => {
  const [personas, setPersonas] = useState<VoicePersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      loadPersonas();
      startAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    fadeAnim.value = withTiming(1, { duration: 300 });
    slideAnim.value = withSpring(0, { damping: 15 });
  };

  const loadPersonas = () => {
    const availablePersonas = VoiceService.getAvailablePersonas();
    setPersonas(availablePersonas);
    
    const current = availablePersonas.find(p => p.id === currentPersonaId);
    if (current) {
      setSelectedPersona(current);
    }
  };

  const handlePersonaSelect = async (persona: VoicePersona) => {
    try {
      setSelectedPersona(persona);
      HapticService.impact('light');
      
      // Play sample audio for the persona
      await playPersonaSample(persona);
    } catch (error) {
      console.error('Error selecting persona:', error);
    }
  };

  const playPersonaSample = async (persona: VoicePersona) => {
    if (isPlaying) return;

    setIsPlaying(persona.id);
    HapticService.impact('medium');

    try {
      const sampleText = getSampleTextForPersona(persona);
      const success = await VoiceService.speak(sampleText, {
        persona: persona.id,
        emotion: persona.personality === 'commentator' ? 'excited' : 'calm'
      });

      if (!success) {
        Alert.alert('Error', 'Failed to play voice sample');
      }
    } catch (error) {
      console.error('Error playing persona sample:', error);
      Alert.alert('Error', 'Failed to play voice sample');
    } finally {
      setTimeout(() => setIsPlaying(null), 3000); // Reset after 3 seconds
    }
  };

  const handleConfirmSelection = async () => {
    if (!selectedPersona) return;

    try {
      const success = await VoiceService.setVoicePersona(selectedPersona.id);
      if (success) {
        onPersonaSelected(selectedPersona);
        HapticService.success();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to set voice persona');
      }
    } catch (error) {
      console.error('Error setting persona:', error);
      Alert.alert('Error', 'Failed to set voice persona');
    }
  };

  const getSampleTextForPersona = (persona: VoicePersona): string => {
    switch (persona.personality) {
      case 'commentator':
        return "Touchdown! Your fantasy team is looking unstoppable this week! Time to dominate the league!";
      case 'expert':
        return "Based on the matchup analysis and weather conditions, I recommend starting your running back this week.";
      case 'casual':
        return "Hey there! Your lineup looks solid. Just a heads up about that injury report we should check.";
      default:
        return "Hello! This is how I'll sound as your fantasy assistant. Ready to win some games?";
    }
  };

  const getPersonaIcon = (personality: VoicePersona['personality']): string => {
    switch (personality) {
      case 'commentator':
        return 'sports';
      case 'expert':
        return 'school';
      case 'casual':
        return 'person';
      default:
        return 'record-voice-over';
    }
  };

  const getPersonaColor = (personality: VoicePersona['personality']): string => {
    switch (personality) {
      case 'commentator':
        return '#FF6B6B';
      case 'expert':
        return '#4ECDC4';
      case 'casual':
        return '#95E1D3';
      default:
        return '#9C27B0';
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }));

  const renderPersonaCard = (persona: VoicePersona) => {
    const isSelected = selectedPersona?.id === persona.id;
    const isCurrentlyPlaying = isPlaying === persona.id;
    const personaColor = getPersonaColor(persona.personality);

    return (
      <TouchableOpacity
        key={persona.id}
        style={[
          styles.personaCard,
          isSelected && styles.selectedCard,
          { borderColor: isSelected ? personaColor : 'transparent' }
        ]}
        onPress={() => handlePersonaSelect(persona)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isSelected
              ? [personaColor, `${personaColor}80`]
              : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
          }
          style={styles.personaGradient}
        >
          <View style={styles.personaHeader}>
            <View style={[styles.personaIcon, { backgroundColor: personaColor }]}>
              <Icon
                name={getPersonaIcon(persona.personality)}
                size={24}
                color="white"
              />
            </View>
            
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => playPersonaSample(persona)}
              disabled={!!isPlaying}
            >
              <Icon
                name={isCurrentlyPlaying ? 'stop' : 'play-arrow'}
                size={20}
                color={personaColor}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.personaName}>{persona.name}</Text>
          <Text style={styles.personaDescription}>{persona.description}</Text>

          <View style={styles.personaStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Style</Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statFill,
                    {
                      backgroundColor: personaColor,
                      width: `${persona.style.style * 100}%`
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stability</Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statFill,
                    {
                      backgroundColor: personaColor,
                      width: `${persona.style.stability * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Icon name="check-circle" size={16} color={personaColor} />
              <Text style={[styles.selectedText, { color: personaColor }]}>
                Selected
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient colors={AppTheme.gradients.primary} style={styles.modalGradient}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🎭 Choose Your Voice</Text>
              <Text style={styles.headerSubtitle}>
                Select a voice persona for your Fantasy.AI assistant
              </Text>
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, animatedContainerStyle]}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {personas.map(renderPersonaCard)}

              {/* Custom Voice Section */}
              <View style={styles.customSection}>
                <Text style={styles.customTitle}>Want Your Own Voice?</Text>
                <Text style={styles.customDescription}>
                  Upload voice samples to create a personalized voice clone
                </Text>
                
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => {
                    Alert.alert(
                      'Voice Cloning',
                      'Voice cloning feature coming soon! This will allow you to create a custom voice using your own audio samples.',
                      [{ text: 'Got it', style: 'default' }]
                    );
                  }}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.customButtonGradient}
                  >
                    <Icon name="mic" size={20} color="white" />
                    <Text style={styles.customButtonText}>Create Custom Voice</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedPersona && styles.disabledButton]}
              onPress={handleConfirmSelection}
              disabled={!selectedPersona}
            >
              <LinearGradient
                colors={
                  selectedPersona
                    ? [AppTheme.colors.primary, AppTheme.colors.secondary]
                    : ['#666', '#666']
                }
                style={styles.confirmButtonGradient}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.confirmButtonText}>
                  Use This Voice
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  personaCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
  },
  personaGradient: {
    padding: 20,
  },
  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  personaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  personaStats: {
    marginBottom: 12,
  },
  statItem: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  statBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  customSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  customTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  customDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  customButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  customButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  customButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});

export default VoicePersonaSelector;