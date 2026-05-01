import React, { useRef, useState } from 'react';
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
  useWindowDimensions,
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
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:3000';

function getThemeVisual(themeId) {
  const visuals = {
    adventure: { icon: '🧭', border: '#9d4edd', tint: '#f8f0ff' },
    emotional: { icon: '🤎', border: '#b08968', tint: '#f8efe8' },
    educational: { icon: '📚', border: '#5c7cfa', tint: '#eef2ff' },
  };

  return visuals[themeId] || visuals.adventure;
}

function getThemeOptionDetails(option) {
  const details = {
    'Treasure hunt': { icon: '🗺️', description: 'Finding hidden gems in mysterious places' },
    'Space mission': { icon: '🚀', description: 'Rocketing to the moon and beyond' },
    'Jungle journey': { icon: '🌴', description: 'Swing through vines and meet wild friends' },
    'Overcoming fear': { icon: '🛡️', description: 'Being brave when things feel scary' },
    'Making friends': { icon: '🤝', description: 'Finding connection and kindness' },
    'Dealing with mistakes': { icon: '🧩', description: 'Learning and growing from small mistakes' },
    Numbers: { icon: '🔢', description: 'Counting, patterns, and number fun' },
    Nature: { icon: '🌿', description: 'Exploring plants, animals, and the outdoors' },
    'Science basics': { icon: '🔬', description: 'Simple science ideas and curious discoveries' },
  };

  return details[option] || { icon: '✨', description: 'A magical story path' };
}

export default function StoryBuddyApp() {
  const scrollViewRef = useRef(null);
  const storySectionYRef = useRef(0);
  const pendingStoryScrollRef = useRef(false);
  const { width } = useWindowDimensions();
  const [selectedAge, setSelectedAge] = useState('5-7');
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [customCharacter, setCustomCharacter] = useState('');
  const [selectedCharacterCategory, setSelectedCharacterCategory] = useState(CHARACTER_CATEGORIES[0].id);
  const [selectedMoral, setSelectedMoral] = useState(MORAL_OPTIONS_BY_AGE['5-7'][0]);
  const [customMoral, setCustomMoral] = useState('');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState(THEME_CATEGORIES[0].id);
  const [selectedThemeOption, setSelectedThemeOption] = useState(THEME_CATEGORIES[0].options[0]);
  const [selectedTone, setSelectedTone] = useState('bedtime');
  const [apiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [storyTitle, setStoryTitle] = useState('');
  const [story, setStory] = useState('');
  const [moral, setMoral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResultSection, setShowResultSection] = useState(false);
  const [activePage, setActivePage] = useState('create');

  const visibleCharacters =
    CHARACTER_CATEGORIES.find((category) => category.id === selectedCharacterCategory)?.byAge[
      selectedAge
    ] || [];
  const visibleMoralOptions = MORAL_OPTIONS_BY_AGE[selectedAge];
  const isDesktop = width >= 960;
  const isCompactMobile = width < 420;
  const contentWidth = Math.min(width - 20, 980);
  const canCreateMagic =
    selectedAge &&
    (selectedCharacters.length > 0 || customCharacter.trim().length > 0) &&
    (selectedMoral || customMoral.trim()) &&
    selectedThemeCategory &&
    selectedThemeOption &&
    selectedTone;

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

  const scrollToStorySection = () => {
    const runScroll = () => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(storySectionYRef.current - 12, 0),
        animated: true,
      });
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runScroll);
    } else {
      setTimeout(runScroll, 0);
    }
  };

  const requestStorySectionScroll = () => {
    pendingStoryScrollRef.current = true;

    setTimeout(() => {
      if (pendingStoryScrollRef.current && storySectionYRef.current > 0) {
        pendingStoryScrollRef.current = false;
        scrollToStorySection();
      }
    }, 80);
  };

  const handleStorySectionLayout = (event) => {
    storySectionYRef.current = event.nativeEvent.layout.y;

    if (pendingStoryScrollRef.current) {
      pendingStoryScrollRef.current = false;
      scrollToStorySection();
    }
  };

  const handleGenerateStory = async () => {
    if (!canCreateMagic || isLoading) {
      return;
    }

    setShowResultSection(true);
    requestStorySectionScroll();
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

    if (!apiBaseUrl.trim()) {
      Alert.alert('API URL needed', 'Please enter the Story API base URL.');
      return;
    }

    setShowResultSection(true);
    requestStorySectionScroll();

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

  const navItems = [
    { id: 'home', label: 'HOME', icon: '🏠', isPrimary: false },
    { id: 'create', label: 'CREATE', icon: '➕', isPrimary: true },
    { id: 'stories', label: 'STORIES', icon: '📖', isPrimary: false },
    { id: 'parents', label: 'PARENTS', icon: '👪', isPrimary: false },
  ];

  const handleNavPress = (itemId) => {
    setActivePage(itemId);
  };

  const renderComingSoon = () => (
    <View style={styles.comingSoonShell}>
      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonBadge}>Coming soon</Text>
        <Text style={styles.comingSoonTitle}>
          {activePage === 'home'
            ? 'Home'
            : activePage === 'stories'
              ? 'Stories'
              : 'Parents'}
        </Text>
        <Text style={styles.comingSoonText}>
          This section is on the way. For now, head back to Create to build a new story magic.
        </Text>
        <Pressable
          style={styles.comingSoonButton}
          onPress={() => setActivePage('create')}
          accessibilityRole="button"
          accessibilityLabel="Back to create page"
        >
          <Text style={styles.comingSoonButtonText}>Back to Create</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <View style={styles.topBarBrandWrap}>
          <Text style={styles.topBarSparkle}>✦</Text>
          <Text style={styles.topBarBrand}>Magic Lab</Text>
        </View>
        <View style={styles.topBarAvatar}>
          <Text style={styles.topBarAvatarText}>🧒</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          {
            alignItems: 'center',
            paddingHorizontal: isCompactMobile ? 6 : 10,
            paddingBottom: isCompactMobile ? 128 : 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageShell, { width: contentWidth }]}>
        {activePage === 'create' ? (
          <>
        <View style={styles.heroIntro}>
          <View style={styles.heroIntroHeader}>
            <View>
              <Text style={[styles.title, isCompactMobile && styles.titleCompact]}>Creation Station</Text>
              <Text style={[styles.description, isCompactMobile && styles.descriptionCompact]}>
                Let&apos;s mix some magic into your story!
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepBadge, { backgroundColor: '#ffc93c' }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
              Who is the story for?
            </Text>
          </View>
          <View style={[styles.tiles, isDesktop && styles.tilesDesktop]}>
            {AGE_GROUPS.map((group) => {
              const selected = group.id === selectedAge;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => handleAgeSelect(group.id)}
                  style={[
                    styles.tile,
                    isDesktop && styles.tileDesktop,
                    selected && styles.tileSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select age group ${group.label}`}
                  accessibilityState={{ selected }}
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
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepBadge, { backgroundColor: '#5a8cff' }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
              Choose your Hero
            </Text>
          </View>
          <View style={styles.heroCategoryRow}>
            {CHARACTER_CATEGORIES.map((option) => {
              const isSelected = selectedCharacterCategory === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setSelectedCharacterCategory(option.id);
                  }}
                  style={[
                    styles.heroCategoryChip,
                    isSelected && styles.heroCategoryChipSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Character category ${option.label}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.heroCategoryChipText,
                      isSelected && styles.heroCategoryChipTextSelected,
                    ]}
                  >
                    {option.emoji} {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.heroCardGrid}>
            {visibleCharacters.map((characterOption) => {
              const isSelected = selectedCharacters.includes(characterOption);
              const parts = characterOption.split(' ');
              const maybeEmoji = parts[parts.length - 1];
              const hasEmoji = maybeEmoji && maybeEmoji.length <= 4;
              const label = hasEmoji ? parts.slice(0, -1).join(' ') : characterOption;
              const avatar = hasEmoji ? maybeEmoji : CHARACTER_CATEGORIES.find(
                (category) => category.id === selectedCharacterCategory
              )?.emoji;

              return (
                <Pressable
                  key={characterOption}
                  onPress={() => toggleCharacter(characterOption)}
                  style={[
                    styles.heroCard,
                    isCompactMobile && styles.heroCardCompact,
                    isSelected && styles.heroCardSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Character ${characterOption}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.heroAvatarCircle,
                      isCompactMobile && styles.heroAvatarCircleCompact,
                      isSelected && styles.heroAvatarCircleSelected,
                    ]}
                  >
                    <Text style={[styles.heroAvatarEmoji, isCompactMobile && styles.heroAvatarEmojiCompact]}>
                      {avatar}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.heroCardLabel,
                      isCompactMobile && styles.heroCardLabelCompact,
                      isSelected && styles.heroCardLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.customCharacterCard}>
            <Text style={styles.customCharacterLabel}>Or create your own character...</Text>
            <View style={styles.customCharacterInputRow}>
              <TextInput
                value={customCharacter}
                onChangeText={setCustomCharacter}
                placeholder="e.g. A flying purple penguin with a tuxedo"
                placeholderTextColor="#b6b1a8"
                style={styles.customCharacterInput}
              />
              <Pressable style={styles.customCharacterAddButton} accessibilityRole="button">
                <Text style={styles.customCharacterAddButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepBadge, { backgroundColor: '#38c976' }]}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
              What&apos;s the Moral?
            </Text>
          </View>
          <View style={styles.chipRow}>
            {visibleMoralOptions.map((option) => {
              const isSelected = selectedMoral === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setSelectedMoral(option)}
                  style={[styles.chip, isCompactMobile && styles.chipCompact, isSelected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Moral ${option}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isCompactMobile && styles.chipTextCompact,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
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
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepBadge, { backgroundColor: '#cf8cff' }]}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
              What&apos;s the Theme?
            </Text>
          </View>
          <View style={[styles.themeSplit, isDesktop && styles.themeSplitDesktop]}>
            <View style={[styles.themeColumn, isDesktop && styles.themeColumnDesktop]}>
              <Text style={styles.themeColumnLabel}>MAIN CATEGORY</Text>
              <View style={styles.themeMainList}>
                {THEME_CATEGORIES.map((category) => {
                  const isSelected = selectedThemeCategory === category.id;
                  const visual = getThemeVisual(category.id);

                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => handleSelectThemeCategory(category.id)}
                      style={[
                        styles.themeMainItem,
                        isCompactMobile && styles.themeMainItemCompact,
                        isSelected && {
                          borderColor: visual.border,
                          backgroundColor: '#ffffff',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Theme category ${category.label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.themeMainIcon,
                          isCompactMobile && styles.themeMainIconCompact,
                          isSelected && { color: visual.border },
                        ]}
                      >
                        {visual.icon}
                      </Text>
                      <Text
                        style={[
                          styles.themeMainText,
                          isCompactMobile && styles.themeMainTextCompact,
                          isSelected && { color: visual.border },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.themeColumn, isDesktop && styles.themeColumnDesktop]}>
              <Text style={styles.themeColumnLabel}>PICK AN ADVENTURE</Text>
              <View style={styles.themeAdventureList}>
                {(
                  THEME_CATEGORIES.find((category) => category.id === selectedThemeCategory)?.options || []
                ).map((option) => {
                  const isSelected = selectedThemeOption === option;
                  const visual = getThemeVisual(selectedThemeCategory);
                  const details = getThemeOptionDetails(option);

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setSelectedThemeOption(option)}
                      style={[
                        styles.themeAdventureCard,
                        isCompactMobile && styles.themeAdventureCardCompact,
                        isSelected && {
                          borderColor: visual.border,
                          backgroundColor: visual.tint,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Theme option ${option}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.themeAdventureIconWrap,
                          isCompactMobile && styles.themeAdventureIconWrapCompact,
                          { backgroundColor: visual.tint },
                        ]}
                      >
                        <Text
                          style={[styles.themeAdventureIcon, isCompactMobile && styles.themeAdventureIconCompact]}
                        >
                          {details.icon}
                        </Text>
                      </View>
                      <View style={styles.themeAdventureTextWrap}>
                        <Text
                          style={[
                            styles.themeAdventureTitle,
                            isCompactMobile && styles.themeAdventureTitleCompact,
                          ]}
                        >
                          {option}
                        </Text>
                        <Text
                          style={[
                            styles.themeAdventureSubtitle,
                            isCompactMobile && styles.themeAdventureSubtitleCompact,
                          ]}
                        >
                          {details.description}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={[styles.themeSelectedRibbon, { backgroundColor: visual.border }]}>
                          <Text style={styles.themeSelectedRibbonText}>SELECTED</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepBadge, { backgroundColor: '#ffb15e' }]}>
              <Text style={styles.stepBadgeText}>5</Text>
            </View>
            <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
              What&apos;s the Vibe?
            </Text>
          </View>
          <View style={styles.chipRow}>
            {TONE_OPTIONS.map((option) => {
              const isSelected = selectedTone === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedTone(option.id)}
                  style={[styles.chip, isCompactMobile && styles.chipCompact, isSelected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Tone ${option.label}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isCompactMobile && styles.chipTextCompact,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {option.label} {option.emoji}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.actionStack, isCompactMobile && styles.actionStackCompact]}>
        <Pressable
          style={[
            styles.secondaryActionButton,
            styles.surpriseButton,
            isCompactMobile && styles.surpriseButtonCompact,
          ]}
          onPress={handleSurpriseMe}
          accessibilityRole="button"
          accessibilityLabel="Surprise me with random story selections"
        >
          <Text style={styles.secondaryActionButtonText}>Surprise Me</Text>
        </Pressable>

        <Text style={styles.actionHelperText}>
          Can&apos;t decide? We&apos;ll pick random magic for steps 2 through 5!
        </Text>

        <Pressable
          style={[
            styles.primaryButton,
            isCompactMobile && styles.primaryButtonCompact,
            !canCreateMagic && styles.primaryButtonDisabled,
            isLoading && styles.primaryButtonLoading,
          ]}
          onPress={handleGenerateStory}
          accessibilityRole="button"
          accessibilityLabel="Create magic story"
          accessibilityState={{ disabled: !canCreateMagic || isLoading }}
          disabled={!canCreateMagic || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#5c4200" />
          ) : (
            <Text style={[styles.primaryButtonText, isCompactMobile && styles.primaryButtonTextCompact]}>
              Create Magic  ✦
            </Text>
          )}
        </Pressable>
        </View>

        {showResultSection ? (
          <View
            style={styles.storyCard}
            onLayout={handleStorySectionLayout}
            accessible
            accessibilityLabel="Generated story section"
          >
            <View style={styles.storyHeader}>
              <View>
                <Text style={styles.storySectionEyebrow}>Your Story</Text>
                <Text style={[styles.sectionTitle, isCompactMobile && styles.sectionTitleCompact]}>
                  Story
                </Text>
              </View>
              <Text style={styles.storyTag}>{selectedAge} years</Text>
            </View>

            {isLoading ? (
              <View style={styles.storyLoadingState}>
                <ActivityIndicator color="#ffb400" />
                <Text style={styles.storyLoadingText}>Creating a magical story...</Text>
              </View>
            ) : (
              <>
                {storyTitle ? <Text style={styles.storyTitle}>{storyTitle}</Text> : null}

                <Text style={[styles.storyText, isCompactMobile && styles.storyTextCompact]}>
                  {story ||
                    'Your generated story will appear here. Pick an age range, select characters, choose a moral, theme category, and tone, then tap Create Magic or Surprise Me.'}
                </Text>

                {moral ? (
                  <View style={styles.moralCard}>
                    <Text style={styles.moralLabel}>Moral</Text>
                    <Text style={styles.moralText}>{moral}</Text>
                  </View>
                ) : null}

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              </>
            )}
          </View>
        ) : null}

        {showResultSection ? (
          <Pressable
            style={[styles.secondaryButton, !story && styles.secondaryButtonDisabled]}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            accessibilityLabel="Play story audio"
            accessibilityState={{ disabled: !story }}
          >
            <Text style={[styles.secondaryButtonText, isCompactMobile && styles.secondaryButtonTextCompact]}>
              Play Audio
            </Text>
          </Pressable>
        ) : null}
          </>
        ) : (
          renderComingSoon()
        )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          isCompactMobile && styles.bottomNavCompact,
          isDesktop && styles.bottomNavDesktop,
        ]}
      >
        {navItems.map((item) => {
          const isActive = activePage === item.id;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.bottomNavItemWrap,
                isCompactMobile && styles.bottomNavItemWrapCompact,
                item.isPrimary && styles.bottomNavPrimaryWrap,
              ]}
              onPress={() => handleNavPress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
            >
              {item.isPrimary ? (
                <View style={[styles.bottomNavCenter, isCompactMobile && styles.bottomNavCenterCompact, isActive && styles.bottomNavCenterActive]}>
                  <Text style={[styles.bottomNavCenterIcon, isCompactMobile && styles.bottomNavCenterIconCompact]}>
                    {item.icon}
                  </Text>
                  <Text style={[styles.bottomNavCenterText, isCompactMobile && styles.bottomNavCenterTextCompact]}>
                    {item.label}
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.bottomNavItem,
                      isCompactMobile && styles.bottomNavItemCompact,
                      isActive && styles.bottomNavItemActive,
                    ]}
                  >
                    {item.icon}
                  </Text>
                  <Text
                    style={[
                      styles.bottomNavItemLabel,
                      isCompactMobile && styles.bottomNavItemLabelCompact,
                      isActive && styles.bottomNavItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f5f9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fffaf1',
    borderBottomWidth: 1,
    borderBottomColor: '#f1d58d',
  },
  topBarBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarSparkle: {
    fontSize: 17,
    color: '#f39a00',
    fontWeight: '900',
  },
  topBarBrand: {
    fontSize: 17.5,
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#f28c00',
    letterSpacing: 0.2,
  },
  topBarAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffca28',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topBarAvatarText: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 18,
  },
  pageShell: {
    gap: 18,
  },
  heroIntro: {
    width: '100%',
    gap: 10,
  },
  heroIntroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: '#8a6800',
    flexShrink: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6f7280',
    marginTop: 6,
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 27,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroCategoryChip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#d7dce7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  heroCategoryChipSelected: {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
    shadowColor: '#1565c0',
    shadowOpacity: 0.22,
  },
  heroCategoryChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2f3545',
  },
  heroCategoryChipTextSelected: {
    color: '#ffffff',
  },
  heroCategoryChipCompact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  heroCategoryChipTextCompact: {
    fontSize: 13,
  },
  heroCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroCard: {
    width: Platform.OS === 'web' ? '18.5%' : '31%',
    minWidth: 96,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: '#eef1f6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroCardSelected: {
    borderColor: '#1565c0',
    shadowColor: '#1565c0',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f6f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarCircleSelected: {
    backgroundColor: '#e9f2ff',
  },
  heroAvatarEmoji: {
    fontSize: 32,
  },
  heroCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3a4051',
    textAlign: 'center',
  },
  heroCardLabelSelected: {
    color: '#1565c0',
  },
  heroCardCompact: {
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
  },
  heroAvatarCircleCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  heroAvatarEmojiCompact: {
    fontSize: 28,
  },
  heroCardLabelCompact: {
    fontSize: 12,
  },
  customCharacterCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#d0d4dc',
    borderRadius: 28,
    backgroundColor: '#fbfbf9',
    padding: 16,
    gap: 12,
  },
  customCharacterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9a7a10',
  },
  customCharacterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customCharacterInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#283042',
    minHeight: 54,
  },
  customCharacterAddButton: {
    backgroundColor: '#1565c0',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCharacterAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#242424',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d22',
  },
  themeSplit: {
    gap: 14,
  },
  themeSplitDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  themeColumn: {
    gap: 10,
  },
  themeColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  themeColumnLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8c6c42',
  },
  themeMainList: {
    gap: 10,
  },
  themeMainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5d5f1',
    backgroundColor: '#eaebed',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#d8c7e8',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
  themeMainIcon: {
    fontSize: 18,
    color: '#8a6b45',
  },
  themeMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a6b45',
  },
  themeColumnLabelCompact: {
    fontSize: 11,
  },
  themeMainItemCompact: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  themeMainIconCompact: {
    fontSize: 16,
  },
  themeMainTextCompact: {
    fontSize: 14,
  },
  themeAdventureList: {
    gap: 10,
  },
  themeAdventureCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e8d7f3',
    backgroundColor: '#ffffff',
    padding: 14,
    paddingRight: 92,
    minHeight: 86,
    shadowColor: '#e3d9ef',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
  themeAdventureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeAdventureIcon: {
    fontSize: 22,
  },
  themeAdventureTextWrap: {
    flex: 1,
    gap: 3,
  },
  themeAdventureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#232433',
  },
  themeAdventureSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7a7385',
  },
  themeAdventureCardCompact: {
    padding: 12,
    paddingRight: 76,
    minHeight: 78,
  },
  themeAdventureIconWrapCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  themeAdventureIconCompact: {
    fontSize: 20,
  },
  themeAdventureTitleCompact: {
    fontSize: 15,
  },
  themeAdventureSubtitleCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  themeSelectedRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  themeSelectedRibbonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffd98f',
    paddingHorizontal: 15,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#2563d8',
    borderColor: '#2563d8',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f4b63',
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  chipTextCompact: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  tiles: {
    gap: 12,
  },
  tilesDesktop: {
    flexDirection: 'row',
  },
  tile: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#eef0f4',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDesktop: {
    flex: 1,
    minWidth: 0,
  },
  tileSelected: {
    backgroundColor: '#fff8ea',
    borderColor: '#ffbf1f',
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
    fontSize: 25,
    fontWeight: '800',
    color: '#1f2431',
    marginBottom: 6,
  },
  tileLabelSelected: {
    color: '#1f2431',
  },
  tileSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: '#7a7f8f',
  },
  tileSubtitleSelected: {
    color: '#7a7f8f',
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
    minHeight: 52,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#6b7186',
  },
  helperTextCompact: {
    fontSize: 10,
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: '#ffcb3c',
    borderRadius: 36,
    minHeight: 88,
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b98b00',
    shadowOpacity: 0.38,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryButtonText: {
    color: '#765800',
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryButtonCompact: {
    minHeight: 76,
    maxWidth: 290,
    borderRadius: 30,
  },
  primaryButtonTextCompact: {
    fontSize: 19,
    lineHeight: 22,
  },
  primaryButtonDisabled: {
    backgroundColor: '#e9e2c3',
    shadowOpacity: 0.1,
  },
  primaryButtonLoading: {
    opacity: 0.9,
  },
  secondaryActionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bfd7f3',
  },
  secondaryActionButtonText: {
    color: '#276cc7',
    fontSize: 14,
    fontWeight: '700',
  },
  surpriseButton: {
    minWidth: 150,
  },
  surpriseButtonCompact: {
    minWidth: 132,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  actionStack: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  actionStackCompact: {
    gap: 8,
  },
  actionHelperText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    color: '#7a7187',
    maxWidth: 220,
  },
  actionHelperTextCompact: {
    maxWidth: 210,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#eceff4',
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
  storySectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#9aa3b5',
    marginBottom: 2,
  },
  storyLoadingState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  storyLoadingText: {
    fontSize: 14,
    color: '#4b5873',
    fontWeight: '600',
  },
  storyText: {
    fontSize: 16,
    lineHeight: 27,
    color: '#4b5873',
  },
  storyTextCompact: {
    fontSize: 15,
    lineHeight: 24,
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
  secondaryButtonTextCompact: {
    fontSize: 15,
  },
  comingSoonShell: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  comingSoonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#edf0f4',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#cfd5e1',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  comingSoonBadge: {
    backgroundColor: '#eef4ff',
    color: '#3568d4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  comingSoonTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: '#1f2431',
    textAlign: 'center',
  },
  comingSoonTitleCompact: {
    fontSize: 23,
    lineHeight: 27,
  },
  comingSoonText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#61697b',
    textAlign: 'center',
    maxWidth: 420,
  },
  comingSoonButton: {
    marginTop: 4,
    backgroundColor: '#ffbf1f',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  comingSoonButtonText: {
    color: '#5f4300',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#98a2b3',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bottomNavCompact: {
    left: 8,
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 26,
  },
  bottomNavDesktop: {
    left: '50%',
    right: 'auto',
    width: 620,
    marginLeft: -310,
  },
  bottomNavItemWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 54,
  },
  bottomNavItemWrapCompact: {
    gap: 2,
    minHeight: 48,
  },
  bottomNavPrimaryWrap: {
    flex: 1.15,
  },
  bottomNavItem: {
    fontSize: 18,
    color: '#9ca3af',
    minWidth: 24,
    textAlign: 'center',
  },
  bottomNavItemCompact: {
    fontSize: 16,
  },
  bottomNavItemActive: {
    color: '#6f7ea8',
  },
  bottomNavItemLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#9ca3af',
  },
  bottomNavItemLabelCompact: {
    fontSize: 8,
  },
  bottomNavItemLabelActive: {
    color: '#7482a3',
  },
  bottomNavCenter: {
    backgroundColor: '#ffbf1f',
    minWidth: 74,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: -24,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#b98600',
    shadowOpacity: 0.32,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  bottomNavCenterCompact: {
    minWidth: 68,
    height: 52,
    borderRadius: 20,
    marginTop: -22,
    paddingHorizontal: 10,
  },
  bottomNavCenterActive: {
    backgroundColor: '#ffbf1f',
  },
  bottomNavCenterIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  bottomNavCenterIconCompact: {
    fontSize: 11,
  },
  bottomNavCenterText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  bottomNavCenterTextCompact: {
    fontSize: 8,
  },
});
