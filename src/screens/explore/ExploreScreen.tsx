import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { findPetGuide } from '../../data/petGuides';

type IconName = keyof typeof Ionicons.glyphMap;

type Category =
  | 'All'
  | 'Daily care'
  | 'Nutrition'
  | 'Health'
  | 'Lifestyle';

interface GuideCard {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, 'All'>;
  label: string;
  emoji: string;
  icon: IconName;
  background: string;
  accent: string;
}

const categories: Category[] = [
  'All',
  'Daily care',
  'Nutrition',
  'Health',
  'Lifestyle',
];

const guides: GuideCard[] = [
  {
    id: 'daily-care',
    title: 'Little routines.\nLots of love.',
    description: 'Bring everyday care together with a simple routine.',
    category: 'Daily care',
    label: 'EVERYDAY ESSENTIALS',
    emoji: '🐾',
    icon: 'heart-outline',
    background: '#E4EFE8',
    accent: '#39745D',
  },
  {
    id: 'nutrition',
    title: 'A little more\ncare at mealtime.',
    description: 'Build an organised feeding routine for your pet.',
    category: 'Nutrition',
    label: 'FOOD & MEALS',
    emoji: '🥣',
    icon: 'restaurant-outline',
    background: '#FFF0D3',
    accent: '#9B702C',
  },
  {
    id: 'health',
    title: 'Their records,\nall together.',
    description: 'Keep vaccination dates and appointment notes organised.',
    category: 'Health',
    label: 'HEALTH ORGANISER',
    emoji: '🩺',
    icon: 'medical-outline',
    background: '#F8E2DD',
    accent: '#AB6254',
  },
  {
    id: 'grooming',
    title: 'Fresh coat.\nHappy moments.',
    description: 'An introduction to a gentle grooming routine for dogs.',
    category: 'Lifestyle',
    label: 'DOG GROOMING',
    emoji: '🫧',
    icon: 'cut-outline',
    background: '#EDE3F4',
    accent: '#82539A',
  },
  {
    id: 'exercise',
    title: 'Make room\nfor play.',
    description: 'Explore activity and play ideas for your dog’s routine.',
    category: 'Lifestyle',
    label: 'PLAY & CONNECTION',
    emoji: '🎾',
    icon: 'tennisball-outline',
    background: '#E5EDFA',
    accent: '#5575A2',
  },
  {
    id: 'adoption',
    title: 'A new chapter.\nA loving home.',
    description: 'Thoughtful preparation before welcoming a new pet.',
    category: 'Lifestyle',
    label: 'ADOPTION PREPARATION',
    emoji: '🏡',
    icon: 'home-outline',
    background: '#F6E8D9',
    accent: '#9A704C',
  },
];

const checklistItems: {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'routine',
    title: 'Review today’s routine',
    description: 'Coordinate care with everyone at home.',
    icon: 'sunny-outline',
  },
  {
    id: 'records',
    title: 'Keep records together',
    description: 'Organise recent notes and documents.',
    icon: 'folder-open-outline',
  },
  {
    id: 'reminders',
    title: 'Check saved reminders',
    description: 'Look over vaccination dates and visits.',
    icon: 'calendar-outline',
  },
];

const featuredGuide = guides[0]!;

function getReadingTime(id: string) {
  const guide = findPetGuide(id);

  if (!guide) return 'Quick read';

  const words = guide.sections
    .map((section) => `${section.heading} ${section.text}`)
    .join(' ')
    .trim()
    .split(/\s+/).length;

  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [selectedCard, setSelectedCard] = useState<GuideCard | null>(
    null,
  );
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const searchTerm = query.trim().toLowerCase();

  const filteredGuides = guides.filter((card) => {
    const matchesCategory =
      category === 'All' || card.category === category;

    const article = findPetGuide(card.id);

    const searchableText = [
      card.title,
      card.description,
      card.category,
      card.label,
      article?.title ?? '',
      ...(article?.sections.map(
        (section) => `${section.heading} ${section.text}`,
      ) ?? []),
    ]
      .join(' ')
      .toLowerCase();

    return (
      matchesCategory &&
      (!searchTerm || searchableText.includes(searchTerm))
    );
  });

  const selectedGuide = selectedCard
    ? findPetGuide(selectedCard.id)
    : null;

  const completedCount = checkedItems.length;
  const progress = completedCount / checklistItems.length;
  const isFiltering = searchTerm.length > 0 || category !== 'All';

  function toggleChecklist(id: string) {
    setCheckedItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function clearFilters() {
    setQuery('');
    setCategory('All');
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>
                  THE JEEVA EDIT
                </Text>
              </View>

              <Text style={styles.title}>
                A little knowledge.
              </Text>

              <Text style={styles.titleAccent}>
                A lot of love.
              </Text>
            </View>

            <View
              style={styles.headerEmblem}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons name="paw" size={29} color="#71579C" />
              <View style={styles.emblemSparkle}>
                <Text style={styles.sparkle}>✦</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Thoughtful reads for the everyday moments you share.
          </Text>

          {/* SEARCH */}

          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={21}
              color="#7C7386"
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="What would you like to explore?"
              placeholderTextColor="#9A939F"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search pet guides"
            />

            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                style={styles.clearSearch}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={21}
                  color="#8D809D"
                />
              </Pressable>
            ) : (
              <View style={styles.searchDecoration}>
                <Ionicons
                  name="book-outline"
                  size={17}
                  color="#71579C"
                />
              </View>
            )}
          </View>

          {/* FEATURED GUIDE */}

          {!isFiltering && (
            <Pressable
              onPress={() => setSelectedCard(featuredGuide)}
              accessibilityRole="button"
              accessibilityLabel="Read the everyday care guide"
              style={({ pressed }) => [
                styles.featuredCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.featuredTop}>
                <View style={styles.featuredBadge}>
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color="#F0DAB0"
                  />
                  <Text style={styles.featuredBadgeText}>
                    START HERE
                  </Text>
                </View>

                <Text style={styles.featuredEdition}>
                  EVERYDAY CARE
                </Text>
              </View>

              <View style={styles.featuredBody}>
                <View style={styles.featuredCopy}>
                  <Text style={styles.featuredTitle}>
                    Great care starts{'\n'}with little things.
                  </Text>

                  <Text style={styles.featuredDescription}>
                    A simple guide to making their everyday
                    world feel a little more cared for.
                  </Text>
                </View>

                <View
                  style={styles.featuredArt}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <View style={styles.artCircle}>
                    <Text style={styles.artEmoji}>🐶</Text>
                  </View>
                  <View style={styles.artHeart}>
                    <Ionicons
                      name="heart"
                      size={22}
                      color="#A45E54"
                    />
                  </View>
                  <Text style={styles.artStar}>✦</Text>
                </View>
              </View>

              <View style={styles.featuredFooter}>
                <View style={styles.featuredReadButton}>
                  <Text style={styles.featuredReadText}>
                    Open the guide
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#354E43"
                  />
                </View>

                <Text style={styles.featuredTime}>
                  {getReadingTime(featuredGuide.id)}
                </Text>
              </View>
            </Pressable>
          )}

          {/* CATEGORY FILTERS */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                FIND YOUR NEXT READ
              </Text>
              <Text style={styles.sectionTitle}>
                The care collection
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredGuides.length} guides
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            keyboardShouldPersistTaps="handled"
          >
            {categories.map((item) => {
              const selected = item === category;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.filterChip,
                    selected && styles.filterChipActive,
                  ]}
                >
                  {item === 'All' && (
                    <Ionicons
                      name="grid-outline"
                      size={14}
                      color={selected ? '#FFFFFF' : '#77707F'}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {searchTerm.length > 0 && (
            <Text style={styles.searchSummary}>
              {filteredGuides.length}{' '}
              {filteredGuides.length === 1 ? 'guide' : 'guides'}
              {' '}matching “{query.trim()}”
            </Text>
          )}

          {/* GUIDE GRID */}

          {filteredGuides.length > 0 ? (
            <View style={styles.guideGrid}>
              {filteredGuides.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => setSelectedCard(card)}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${card.title.replace(
                    '\n',
                    ' ',
                  )}`}
                  style={({ pressed }) => [
                    styles.guideCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.guideArtwork,
                      { backgroundColor: card.background },
                    ]}
                  >
                    <View style={styles.guideArtworkCircle} />
                    <Text style={styles.guideEmoji}>
                      {card.emoji}
                    </Text>

                    <View style={styles.guideCategoryPill}>
                      <Text
                        style={[
                          styles.guideCategoryText,
                          { color: card.accent },
                        ]}
                      >
                        {card.category}
                      </Text>
                    </View>

                    <Ionicons
                      name={card.icon}
                      size={17}
                      color={card.accent}
                      style={styles.guideCornerIcon}
                    />
                  </View>

                  <View style={styles.guideCopy}>
                    <Text
                      style={[
                        styles.guideLabel,
                        { color: card.accent },
                      ]}
                    >
                      {card.label}
                    </Text>

                    <Text style={styles.guideTitle}>
                      {card.title}
                    </Text>

                    <Text style={styles.guideDescription}>
                      {card.description}
                    </Text>

                    <View style={styles.guideFooter}>
                      <Text style={styles.readTime}>
                        {getReadingTime(card.id)}
                      </Text>

                      <View
                        style={[
                          styles.guideArrow,
                          { backgroundColor: card.background },
                        ]}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={card.accent}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="search-outline"
                  size={30}
                  color="#71579C"
                />
              </View>

              <Text style={styles.emptyTitle}>
                A different little search?
              </Text>

              <Text style={styles.emptyDescription}>
                Try “food”, “grooming” or “records”, or choose
                another topic.
              </Text>

              <Pressable
                onPress={clearFilters}
                accessibilityRole="button"
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>
                  Show all guides
                </Text>
              </Pressable>
            </View>
          )}

          {/* DAILY CHECKLIST */}

          {!isFiltering && (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    SMALL THINGS MATTER
                  </Text>
                  <Text style={styles.sectionTitle}>
                    Your little care list
                  </Text>
                </View>

                <Text style={styles.checklistEmoji}>📝</Text>
              </View>

              <View style={styles.checklistCard}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressHeading}>
                    <Text style={styles.progressTitle}>
                      {completedCount === checklistItems.length
                        ? 'A little more organised.'
                        : 'One little step at a time.'}
                    </Text>

                    <Text style={styles.progressSubtitle}>
                      A checklist for this visit
                    </Text>
                  </View>

                  <Text style={styles.progressCount}>
                    {completedCount}/{checklistItems.length}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>

                {checklistItems.map((item, index) => {
                  const checked = checkedItems.includes(item.id);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleChecklist(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={item.title}
                      accessibilityState={{ checked }}
                      style={[
                        styles.checklistRow,
                        index < checklistItems.length - 1 &&
                          styles.checklistRowBorder,
                      ]}
                    >
                      <View style={styles.checklistItemIcon}>
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color="#71579C"
                        />
                      </View>

                      <View style={styles.checklistText}>
                        <Text
                          style={[
                            styles.checklistTitle,
                            checked && styles.checkedTitle,
                          ]}
                        >
                          {item.title}
                        </Text>

                        <Text style={styles.checklistDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxActive,
                        ]}
                      >
                        {checked && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}

                <Text style={styles.checklistNote}>
                  Just for this screen visit · Not saved to your
                  pet’s records
                </Text>
              </View>

              {/* ADOPTION FEATURE */}

              <Pressable
                onPress={() =>
                  setSelectedCard(
                    guides.find((item) => item.id === 'adoption') ??
                      featuredGuide,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Read adoption preparation guide"
                style={({ pressed }) => [
                  styles.adoptionCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.adoptionTop}>
                  <Text style={styles.adoptionEyebrow}>
                    BEFORE THE FIRST HELLO
                  </Text>
                  <Text style={styles.adoptionEmoji}>🏡</Text>
                </View>

                <Text style={styles.adoptionTitle}>
                  Make space for{'\n'}a new best friend.
                </Text>

                <Text style={styles.adoptionDescription}>
                  Explore the questions, preparations and
                  everyday commitments behind a loving home.
                </Text>

                <View style={styles.adoptionFooter}>
                  <Text style={styles.adoptionLink}>
                    Read the preparation guide
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#805A40"
                  />
                </View>
              </Pressable>

              {/* FUTURE FEATURES */}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    MORE TO LOOK FORWARD TO
                  </Text>
                  <Text style={styles.sectionTitle}>
                    Growing with JEEVA
                  </Text>
                </View>
              </View>

              <View style={styles.comingSoonCard}>
                <View style={styles.comingSoonIcon}>
                  <Ionicons
                    name="sparkles"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.comingSoonContent}>
                  <Text style={styles.comingSoonLabel}>
                    COMING SOON
                  </Text>
                  <Text style={styles.comingSoonTitle}>
                    A little extra help.
                  </Text>
                  <Text style={styles.comingSoonDescription}>
                    JEEVA AI, verified animal-law resources and
                    rescue information are planned for future
                    updates.
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Ionicons
                  name="heart-outline"
                  size={15}
                  color="#A29AA9"
                />
                <Text style={styles.footerText}>
                  For the little lives that make ours bigger.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* FULL ARTICLE READER */}

      <Modal
        visible={selectedCard !== null}
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <SafeAreaView style={styles.readerScreen}>
          {selectedCard && (
            <>
              <View style={styles.readerToolbar}>
                <Pressable
                  onPress={() => setSelectedCard(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Close guide"
                  style={styles.readerClose}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color="#35473F"
                  />
                </Pressable>

                <Text style={styles.readerBrand}>
                  THE JEEVA EDIT
                </Text>

                <Ionicons
                  name="book-outline"
                  size={21}
                  color="#71579C"
                />
              </View>

              <ScrollView
                key={selectedCard.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.readerScroll}
              >
                <View style={styles.readerContainer}>
                  <View
                    style={[
                      styles.readerHero,
                      {
                        backgroundColor: selectedCard.background,
                      },
                    ]}
                  >
                    <View style={styles.readerHeroTop}>
                      <View style={styles.readerCategory}>
                        <Text
                          style={[
                            styles.readerCategoryText,
                            { color: selectedCard.accent },
                          ]}
                        >
                          {selectedCard.category}
                        </Text>
                      </View>

                      <Text style={styles.readerHeroEmoji}>
                        {selectedCard.emoji}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.readerEyebrow,
                        { color: selectedCard.accent },
                      ]}
                    >
                      {selectedCard.label}
                    </Text>

                    <Text style={styles.readerTitle}>
                      {selectedGuide?.title ??
                        selectedCard.title.replace('\n', ' ')}
                    </Text>

                    <Text style={styles.readerIntro}>
                      {selectedCard.description}
                    </Text>

                    <View style={styles.readerMeta}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={selectedCard.accent}
                      />
                      <Text
                        style={[
                          styles.readerMetaText,
                          { color: selectedCard.accent },
                        ]}
                      >
                        {getReadingTime(selectedCard.id)}
                      </Text>

                      <View style={styles.metaDot} />

                      <Text
                        style={[
                          styles.readerMetaText,
                          { color: selectedCard.accent },
                        ]}
                      >
                        JEEVA care collection
                      </Text>
                    </View>
                  </View>

                  {selectedGuide ? (
                    <>
                      <View style={styles.readerContents}>
                        <Text style={styles.contentsLabel}>
                          INSIDE THIS GUIDE
                        </Text>

                        {selectedGuide.sections.map(
                          (section, index) => (
                            <View
                              key={`${index}-${section.heading}`}
                              style={styles.contentsRow}
                            >
                              <Text
                                style={[
                                  styles.contentsNumber,
                                  { color: selectedCard.accent },
                                ]}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </Text>

                              <Text style={styles.contentsText}>
                                {section.heading}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {selectedGuide.sections.map(
                        (section, index) => (
                          <View
                            key={`${index}-${section.heading}`}
                            style={styles.articleSection}
                          >
                            <View
                              style={[
                                styles.articleNumber,
                                {
                                  backgroundColor:
                                    selectedCard.background,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.articleNumberText,
                                  { color: selectedCard.accent },
                                ]}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </Text>
                            </View>

                            <Text style={styles.articleHeading}>
                              {section.heading}
                            </Text>

                            <Text style={styles.articleText}>
                              {section.text}
                            </Text>
                          </View>
                        ),
                      )}

                      <View style={styles.readerNote}>
                        <Ionicons
                          name="information-circle-outline"
                          size={21}
                          color="#71579C"
                        />

                        <Text style={styles.readerNoteText}>
                          General care information. For advice
                          specific to your pet’s health, diet or
                          treatment, speak with your veterinarian.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.missingGuide}>
                      <Text style={styles.emptyTitle}>
                        This guide isn’t available yet.
                      </Text>

                      <Text style={styles.emptyDescription}>
                        Check that petGuides.ts includes the guide
                        ID “{selectedCard.id}”.
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => setSelectedCard(null)}
                    accessibilityRole="button"
                    style={styles.readerDoneButton}
                  >
                    <Text style={styles.readerDoneText}>
                      Back to exploring
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },
  container: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eyebrowLine: {
    width: 20,
    height: 2,
    backgroundColor: '#71579C',
  },
  eyebrow: {
    color: '#71579C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#263D33',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#71579C',
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 1,
  },
  headerEmblem: {
    width: 62,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EDE6F4',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
  },
  emblemSparkle: {
    position: 'absolute',
    right: -3,
    top: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5DFC0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F9F7F2',
  },
  sparkle: {
    color: '#9B702C',
    fontSize: 14,
  },
  subtitle: {
    color: '#8A837C',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 300,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    paddingHorizontal: 14,
    marginTop: 22,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    color: '#35473F',
    fontSize: 12,
  },
  clearSearch: {
    padding: 5,
  },
  searchDecoration: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1EDF6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Featured guide

  featuredCard: {
    backgroundColor: '#354E43',
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 28,
  },
  featuredTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF15',
  },
  featuredBadgeText: {
    color: '#F0DAB0',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuredEdition: {
    color: '#BCCDBF',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    gap: 8,
  },
  featuredCopy: {
    flex: 1,
  },
  featuredTitle: {
    color: '#FFFDF7',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  featuredDescription: {
    color: '#C8D4C9',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 10,
  },
  featuredArt: {
    width: 88,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircle: {
    width: 83,
    height: 98,
    borderRadius: 42,
    backgroundColor: '#DADDBE',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  artEmoji: {
    fontSize: 51,
  },
  artHeart: {
    position: 'absolute',
    bottom: 0,
    right: -3,
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: '#F0CBBE',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  artStar: {
    position: 'absolute',
    top: -4,
    left: 0,
    color: '#F0DAB0',
    fontSize: 24,
  },
  featuredFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 22,
  },
  featuredReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: '#F4E8D3',
    borderRadius: 12,
  },
  featuredReadText: {
    color: '#354E43',
    fontSize: 11,
    fontWeight: '800',
  },
  featuredTime: {
    color: '#CAD6CC',
    fontSize: 10,
  },

  // Filters and section headers

  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: '#9B9288',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#2D4036',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#ECE7F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countText: {
    color: '#71579C',
    fontSize: 10,
    fontWeight: '700',
  },
  filterList: {
    gap: 8,
    paddingBottom: 18,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  filterChipActive: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  filterText: {
    color: '#77707F',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  searchSummary: {
    color: '#8B8292',
    fontSize: 12,
    marginBottom: 15,
  },

  // Guide cards

  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 30,
  },
  guideCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  guideArtwork: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  guideArtworkCircle: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#FFFFFF45',
    top: 12,
  },
  guideEmoji: {
    fontSize: 47,
    marginBottom: 8,
  },
  guideCategoryPill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFFCC',
  },
  guideCategoryText: {
    fontSize: 8,
    fontWeight: '800',
  },
  guideCornerIcon: {
    position: 'absolute',
    top: 11,
    right: 11,
  },
  guideCopy: {
    flex: 1,
    padding: 13,
  },
  guideLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  guideTitle: {
    color: '#2F4037',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  guideDescription: {
    color: '#898179',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
    marginBottom: 15,
  },
  guideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  readTime: {
    color: '#9A919E',
    fontSize: 9,
  },
  guideArrow: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 23,
    backgroundColor: '#EEE7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#35473F',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#8B8292',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },
  resetButton: {
    marginTop: 18,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 12,
    backgroundColor: '#71579C',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Checklist

  checklistEmoji: {
    fontSize: 29,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 26,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressHeading: {
    flex: 1,
  },
  progressTitle: {
    color: '#3D4A40',
    fontSize: 14,
    fontWeight: '800',
  },
  progressSubtitle: {
    color: '#9A919E',
    fontSize: 10,
    marginTop: 4,
  },
  progressCount: {
    color: '#71579C',
    fontSize: 19,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F0EAF5',
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9279B4',
    borderRadius: 3,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 15,
  },
  checklistRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1EDE7',
  },
  checklistItemIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#F4F0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistText: {
    flex: 1,
  },
  checklistTitle: {
    color: '#3C483F',
    fontSize: 12,
    fontWeight: '700',
  },
  checkedTitle: {
    color: '#8D9690',
    textDecorationLine: 'line-through',
  },
  checklistDescription: {
    color: '#989087',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DDD4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  checklistNote: {
    color: '#A199A6',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 8,
  },

  // Adoption feature

  adoptionCard: {
    backgroundColor: '#F2E4D3',
    borderRadius: 26,
    padding: 23,
    marginBottom: 30,
  },
  adoptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  adoptionEyebrow: {
    flex: 1,
    color: '#9A7656',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  adoptionEmoji: {
    fontSize: 38,
  },
  adoptionTitle: {
    color: '#614B38',
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.7,
    fontWeight: '800',
    marginTop: 9,
  },
  adoptionDescription: {
    color: '#937B66',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 11,
  },
  adoptionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 17,
    marginTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#DFCDB8',
  },
  adoptionLink: {
    flex: 1,
    color: '#805A40',
    fontSize: 12,
    fontWeight: '800',
  },

  // Coming soon and footer

  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#EDE7F4',
    borderRadius: 23,
    padding: 18,
  },
  comingSoonIcon: {
    width: 49,
    height: 55,
    borderRadius: 17,
    backgroundColor: '#71579C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonLabel: {
    color: '#9179AD',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  comingSoonTitle: {
    color: '#594273',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },
  comingSoonDescription: {
    color: '#8A789D',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 28,
  },
  footerText: {
    flexShrink: 1,
    color: '#A29AA9',
    fontSize: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },

  // Article reader

  readerScreen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  readerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
  },
  readerClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerBrand: {
    color: '#71579C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  readerScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  readerContainer: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  readerHero: {
    borderRadius: 27,
    padding: 23,
  },
  readerHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    gap: 12,
  },
  readerCategory: {
    backgroundColor: '#FFFFFFB3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  readerCategoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  readerHeroEmoji: {
    fontSize: 46,
  },
  readerEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  readerTitle: {
    color: '#2F4037',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  readerIntro: {
    color: '#756F69',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  readerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
  },
  readerMetaText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#A69A8E',
    marginHorizontal: 2,
  },
  readerContents: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE7DF',
    marginTop: 20,
    marginBottom: 9,
  },
  contentsLabel: {
    color: '#9B9288',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 13,
  },
  contentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 6,
  },
  contentsNumber: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 19,
  },
  contentsText: {
    flex: 1,
    color: '#5E635D',
    fontSize: 12,
    lineHeight: 19,
  },
  articleSection: {
    paddingVertical: 23,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E1D9',
  },
  articleNumber: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  articleNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  articleHeading: {
    color: '#304238',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  articleText: {
    color: '#77736B',
    fontSize: 14,
    lineHeight: 25,
    marginTop: 11,
  },
  readerNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EEE8F5',
    padding: 17,
    borderRadius: 18,
    marginTop: 24,
  },
  readerNoteText: {
    flex: 1,
    color: '#857393',
    fontSize: 11,
    lineHeight: 19,
  },
  missingGuide: {
    paddingVertical: 30,
    paddingHorizontal: 15,
  },
  readerDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#71579C',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 24,
  },
  readerDoneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});