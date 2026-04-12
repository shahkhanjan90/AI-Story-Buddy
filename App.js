import React, { useState } from 'react';
import {
  Alert,
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

const AGE_GROUPS = [
  {
    id: '2-4',
    label: '2-4 years',
    subtitle: 'Simple words, cozy adventures',
  },
  {
    id: '5-7',
    label: '5-7 years',
    subtitle: 'Playful journeys with light problem-solving',
  },
  {
    id: '8-10',
    label: '8-10 years',
    subtitle: 'Bigger quests, more imagination',
  },
];

const STORY_TEMPLATES = {
  '2-4': ({ character }) =>
    `${character} found a tiny golden star sleeping in the grass. Together they tiptoed through a bright garden, helping a sleepy bee, a shy bunny, and a giggling cloud. When the moon peeked out, the star glowed warmly and thanked ${character} for being gentle and kind. They both yawned, smiled, and headed home for the coziest bedtime ever.`,
  '5-7': ({ character }) =>
    `One sunny morning, ${character} discovered a rainbow map tucked inside a library book. The map led to a whispering tree that had forgotten its song. ${character} followed sparkling clues, crossed a pebble stream, and asked a cheerful robin for help. With bravery and a little singing, the tree remembered its melody, and the whole forest danced in thanks.`,
  '8-10': ({ character }) =>
    `${character} was not expecting to become the guardian of Moonlight Hill before lunch, but adventure rarely sends a warning. After an old compass flashed silver, ${character} followed its signal into hidden tunnels beneath the town. There, three glowing doors tested courage, kindness, and curiosity. By choosing wisely, ${character} restored the hill's lost lantern and filled the night sky with stories once more.`,
};

export default function App() {
  const [selectedAge, setSelectedAge] = useState('5-7');
  const [character, setCharacter] = useState('');
  const [story, setStory] = useState('');

  const handleGenerateStory = () => {
    const cleanedName = character.trim();

    if (!cleanedName) {
      Alert.alert('Character needed', 'Please enter a character name before generating a story.');
      return;
    }

    const template = STORY_TEMPLATES[selectedAge];
    setStory(template({ character: cleanedName }));
  };

  const handlePlayAudio = () => {
    if (!story) {
      Alert.alert('No story yet', 'Generate a story first, then this button can be wired to audio playback.');
      return;
    }

    Alert.alert('Play audio', 'Audio playback UI is ready. You can connect this button to TTS or recorded audio next.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>AI STORY BUDDY</Text>
          <Text style={styles.title}>Build a magical story in a few taps.</Text>
          <Text style={styles.description}>
            Choose an age range, add a character, and create a story that feels playful and
            age-appropriate.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Age Group</Text>
          <View style={styles.tiles}>
            {AGE_GROUPS.map((group) => {
              const selected = group.id === selectedAge;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => setSelectedAge(group.id)}
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
          <Text style={styles.sectionTitle}>Character</Text>
          <TextInput
            value={character}
            onChangeText={setCharacter}
            placeholder="Enter a character name"
            placeholderTextColor="#8b8197"
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleGenerateStory}>
          <Text style={styles.primaryButtonText}>Generate Story</Text>
        </Pressable>

        <View style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <Text style={styles.sectionTitle}>Story</Text>
            <Text style={styles.storyTag}>{selectedAge} years</Text>
          </View>

          <Text style={styles.storyText}>
            {story ||
              'Your generated story will appear here. Pick an age range, type a character, and tap Generate Story.'}
          </Text>
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
    backgroundColor: '#f6efe7',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#fdf8f1',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#eadcca',
    shadowColor: '#8f7456',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#b06033',
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: '#2f2340',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5f536d',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2f2340',
  },
  tiles: {
    gap: 12,
  },
  tile: {
    backgroundColor: '#fffaf4',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8dccc',
  },
  tileSelected: {
    backgroundColor: '#2f2340',
    borderColor: '#2f2340',
  },
  tileNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: '#f3ddbd',
    color: '#7f4b1f',
    fontWeight: '800',
    marginBottom: 12,
    paddingTop: 7,
  },
  tileNumberSelected: {
    backgroundColor: '#f3b24e',
    color: '#2f2340',
  },
  tileLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2f2340',
    marginBottom: 6,
  },
  tileLabelSelected: {
    color: '#fff7f2',
  },
  tileSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b5d78',
  },
  tileSubtitleSelected: {
    color: '#d8cde4',
  },
  input: {
    backgroundColor: '#fffaf4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8dccc',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2f2340',
  },
  primaryButton: {
    backgroundColor: '#ca6a2a',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#ca6a2a',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff8f2',
    fontSize: 16,
    fontWeight: '800',
  },
  storyCard: {
    backgroundColor: '#fffaf4',
    borderRadius: 24,
    padding: 20,
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#e8dccc',
    gap: 14,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  storyTag: {
    backgroundColor: '#f3e4d2',
    color: '#7f4b1f',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 27,
    color: '#4f435d',
  },
  secondaryButton: {
    backgroundColor: '#2f2340',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.65,
  },
  secondaryButtonText: {
    color: '#fff7f2',
    fontSize: 16,
    fontWeight: '800',
  },
});
