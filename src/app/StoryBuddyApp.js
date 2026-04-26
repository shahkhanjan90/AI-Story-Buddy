import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  AGE_GROUPS,
  CHARACTER_CATEGORIES,
  getCharacterEntriesForAge,
  getThemeCategoryById,
  MORAL_OPTIONS_BY_AGE,
  TONE_OPTIONS,
  THEME_CATEGORIES,
} from '../config/storyOptions';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://localhost:3000';

export default function StoryBuddyApp() {
  const [selectedAge, setSelectedAge] = useState('5-7');
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [customCharacter, setCustomCharacter] = useState('');
  const [selectedCharacterCategory, setSelectedCharacterCategory] = useState(CHARACTER_CATEGORIES[0].id);
  const [selectedMoral, setSelectedMoral] = useState(MORAL_OPTIONS_BY_AGE['5-7'][0]);
  const [customMoral, setCustomMoral] = useState('');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState(THEME_CATEGORIES[0].id);
  const [selectedThemeOption, setSelectedThemeOption] = useState(THEME_CATEGORIES[0].options[0]);
  const [selectedTone, setSelectedTone] = useState('bedtime');
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [storyTitle, setStoryTitle] = useState('');
  const [story, setStory] = useState('');
  const [moral, setMoral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const visibleCharacters =
    CHARACTER_CATEGORIES.find((category) => category.id === selectedCharacterCategory)?.byAge[
      selectedAge
    ] || [];
  const visibleMoralOptions = MORAL_OPTIONS_BY_AGE[selectedAge];

  const handleAgeSelect = (ageId) => {
    setSelectedAge(ageId);
    setSelectedCharacters([]);
    setSelectedCharacterCategory(CHARACTER_CATEGORIES[0].id);
    setSelectedMoral(MORAL_OPTIONS_BY_AGE[ageId][0]);
  };

  const toggleCharacter = (characterLabel) => {
    setSelectedCharacters((current) =>
      current.includes(characterLabel)
        ? current.filter((item) => item !== characterLabel)
        : [...current, characterLabel]
    );
  };

  const handleSelectThemeCategory = (categoryId) => {
    const category = THEME_CATEGORIES.find((item) => item.id === categoryId);

    setSelectedThemeCategory(categoryId);

    if (category) {
      setSelectedThemeOption(category.options[0]);
    }
  };

  const handleGenerateStory = async () => {
    await generateStory();
  };

  const generateStory = async (overrides = {}) => {
    const customCharacterValue = customCharacter.trim();
    const customMoralValue = customMoral.trim();
    const cleanedApiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
    const characters =
      overrides.characters ||
      [...selectedCharacters, ...(customCharacterValue ? [customCharacterValue] : [])];
    const activeThemeCategory = overrides.themeCategory || selectedThemeCategory;
    const activeTheme = overrides.theme || selectedThemeOption;
    const activeTone = overrides.tone || selectedTone;
    const selectedThemeCategoryLabel = getThemeCategoryById(activeThemeCategory)?.label || 'Adventure';
    const chosenMoral = overrides.moral || customMoralValue || selectedMoral;
    const activeCharacterCategory = overrides.characterCategory || selectedCharacterCategory;

    if (!characters.length) {
      Alert.alert(
        'Characters needed',
        'Select at least one character option or add a custom character before generating a story.'
      );
      return;
    }

    if (!selectedMoral && !customMoralValue) {
      Alert.alert('Moral needed', 'Choose a moral or add a custom moral before generating a story.');
      return;
    }

    if (!cleanedApiBaseUrl) {
      Alert.alert('API URL needed', 'Please enter the Story API base URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${cleanedApiBaseUrl}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: selectedAge,
          characterCategory: activeCharacterCategory,
          characters,
          moral: chosenMoral,
          themeCategory: activeThemeCategory,
          theme: activeTheme,
          tone: activeTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate story.');
      }

      setStoryTitle(data.title || 'Untitled Story');
      setStory(data.story || '');
      setMoral(data.moral || '');
    } catch (error) {
      setStoryTitle('');
      setStory('');
      setMoral('');
      setErrorMessage(
        error.message ||
          'Could not reach the story API. If you are using a real device, replace localhost with your computer IP.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurpriseMe = async () => {
    const availableCharacters = getCharacterEntriesForAge(selectedAge);

    if (availableCharacters.length < 3) {
      Alert.alert('Not enough choices', 'There are not enough predefined characters for this age group.');
      return;
    }

    const shuffledCharacters = [...availableCharacters].sort(() => Math.random() - 0.5);
    const surpriseCharacters = shuffledCharacters.slice(0, 3);
    const ageMorals = MORAL_OPTIONS_BY_AGE[selectedAge];
    const surpriseMoral = ageMorals[Math.floor(Math.random() * ageMorals.length)];
    const surpriseThemeCategory =
      THEME_CATEGORIES[Math.floor(Math.random() * THEME_CATEGORIES.length)];
    const surpriseTheme =
      surpriseThemeCategory.options[
        Math.floor(Math.random() * surpriseThemeCategory.options.length)
      ];
    const surpriseTone = TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)];

    setSelectedCharacters(surpriseCharacters.map((item) => item.character));
    setSelectedCharacterCategory(surpriseCharacters[0].categoryId);
    setCustomCharacter('');
    setSelectedMoral(surpriseMoral);
    setCustomMoral('');
    setSelectedThemeCategory(surpriseThemeCategory.id);
    setSelectedThemeOption(surpriseTheme);
    setSelectedTone(surpriseTone.id);

    await generateStory({
      characterCategory: surpriseCharacters[0].categoryId,
      characters: surpriseCharacters.map((item) => item.character),
      moral: surpriseMoral,
      themeCategory: surpriseThemeCategory.id,
      theme: surpriseTheme,
      tone: surpriseTone.id,
    });
  };

  const handlePlayAudio = () => {
    if (!story) {
      Alert.alert('No story yet', 'Generate a story first, then this button can be wired to audio playback.');
      return;
    }

    Alert.alert(
      'Play audio',
      'Audio playback UI is ready. You can connect this button to TTS or recorded audio next.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.eyebrow}>AI STORY BUDDY</Text>
          </View>
          <Text style={styles.title}>Build a magical story in a few taps.</Text>
          <Text style={styles.description}>
            Choose an age range, pick characters, set a moral and tone, then create a story that
            feels playful and age-appropriate.
          </Text>
          <View style={styles.heroBubbles}>
            <View style={[styles.heroBubble, styles.heroBubblePink]} />
            <View style={[styles.heroBubble, styles.heroBubbleYellow]} />
            <View style={[styles.heroBubble, styles.heroBubbleBlue]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Age</Text>
          <View style={styles.tiles}>
            {AGE_GROUPS.map((group) => {
              const selected = group.id === selectedAge;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => handleAgeSelect(group.id)}
                  style={[styles.tile, selected && styles.tileSelected]}
                >
                  <Text style={[styles.tileNumber, selected && styles.tileNumberSelected]}>
                    {group.id === '2-4' ? '1' : group.id === '5-7' ? '2' : '3'}
                  </Text>
                  <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
                    {group.label}
                  </Text>
                  <Text style={[styles.tileSubtitle, selected && styles.tileSubtitleSelected]}>
                    {group.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Characters</Text>
          <View style={styles.chipRow}>
            {CHARACTER_CATEGORIES.map((option) => {
              const isSelected = selectedCharacterCategory === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setSelectedCharacterCategory(option.id);
                  }}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option.emoji} {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chipRow}>
            {visibleCharacters.map((characterOption) => {
              const isSelected = selectedCharacters.includes(characterOption);

              return (
                <Pressable
                  key={characterOption}
                  onPress={() => toggleCharacter(characterOption)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {characterOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={customCharacter}
            onChangeText={setCustomCharacter}
            placeholder="Add Custom Character"
            placeholderTextColor="#8b8197"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 3: Moral</Text>
          <View style={styles.chipRow}>
            {visibleMoralOptions.map((option) => {
              const isSelected = selectedMoral === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setSelectedMoral(option)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={customMoral}
            onChangeText={setCustomMoral}
            placeholder="Custom Moral"
            placeholderTextColor="#8b8197"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 4: Theme Category</Text>
          <View style={styles.chipRow}>
            {THEME_CATEGORIES.map((category) => {
              const isSelected = selectedThemeCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleSelectThemeCategory(category.id)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chipRow}>
            {(
              THEME_CATEGORIES.find((category) => category.id === selectedThemeCategory)?.options || []
            ).map((option) => {
              const isSelected = selectedThemeOption === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setSelectedThemeOption(option)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 5: Tone</Text>
          <View style={styles.chipRow}>
            {TONE_OPTIONS.map((option) => {
              const isSelected = selectedTone === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedTone(option.id)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option.label} {option.emoji}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story API URL</Text>
          <TextInput
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://localhost:3000"
            placeholderTextColor="#8b8197"
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Use your computer&apos;s IP instead of `localhost` when testing from Expo Go on a phone.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleGenerateStory}>
          {isLoading ? (
            <ActivityIndicator color="#fff8f2" />
          ) : (
            <Text style={styles.primaryButtonText}>Generate Story</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryActionButton} onPress={handleSurpriseMe}>
          <Text style={styles.secondaryActionButtonText}>Surprise Me</Text>
        </Pressable>

        <View style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <Text style={styles.sectionTitle}>Story</Text>
            <Text style={styles.storyTag}>{selectedAge} years</Text>
          </View>

          {storyTitle ? <Text style={styles.storyTitle}>{storyTitle}</Text> : null}

          <Text style={styles.storyText}>
            {story ||
              'Your generated story will appear here. Pick an age range, select characters, choose a moral, theme category, and tone, then tap Generate Story.'}
          </Text>

          {moral ? (
            <View style={styles.moralCard}>
              <Text style={styles.moralLabel}>Moral</Text>
              <Text style={styles.moralText}>{moral}</Text>
            </View>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        <Pressable
          style={[styles.secondaryButton, !story && styles.secondaryButtonDisabled]}
          onPress={handlePlayAudio}
        >
          <Text style={styles.secondaryButtonText}>Play Audio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff4d6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#fffdf7',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ffd98f',
    shadowColor: '#ff9f43',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe566',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#8f4a11',
  },
  title: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '800',
    color: '#24324a',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5f6281',
  },
  heroBubbles: {
    position: 'absolute',
    right: -8,
    top: -4,
    flexDirection: 'row',
    gap: 8,
  },
  heroBubble: {
    width: 18,
    height: 18,
    borderRadius: 999,
    opacity: 0.9,
  },
  heroBubblePink: {
    backgroundColor: '#ff82a9',
  },
  heroBubbleYellow: {
    backgroundColor: '#ffd84d',
  },
  heroBubbleBlue: {
    backgroundColor: '#6dc7ff',
  },
  section: {
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#24324a',
  },
  chip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffd98f',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  chipSelected: {
    backgroundColor: '#5c7cfa',
    borderColor: '#5c7cfa',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f4b63',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  tiles: {
    gap: 12,
  },
  tile: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ffd98f',
    shadowColor: '#ffcf5b',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  tileSelected: {
    backgroundColor: '#6dc7ff',
    borderColor: '#6dc7ff',
  },
  tileNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: '#ffe566',
    color: '#7f4b1f',
    fontWeight: '800',
    marginBottom: 12,
    paddingTop: 7,
  },
  tileNumberSelected: {
    backgroundColor: '#ffffff',
    color: '#3171b7',
  },
  tileLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#24324a',
    marginBottom: 6,
  },
  tileLabelSelected: {
    color: '#1f3a5f',
  },
  tileSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7186',
  },
  tileSubtitleSelected: {
    color: '#26537f',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffd98f',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#24324a',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7186',
  },
  primaryButton: {
    backgroundColor: '#ff7b54',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#ff7b54',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: '#ffe566',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd84d',
  },
  secondaryActionButtonText: {
    color: '#7a4a00',
    fontSize: 16,
    fontWeight: '800',
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#ffd98f',
    gap: 14,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  storyTag: {
    backgroundColor: '#d8f0ff',
    color: '#25639a',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 27,
    color: '#4b5873',
  },
  storyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#24324a',
  },
  moralCard: {
    backgroundColor: '#fff4c2',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  moralLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#b05a00',
  },
  moralText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5d596c',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#b13b2d',
  },
  secondaryButton: {
    backgroundColor: '#7a5cff',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.65,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
