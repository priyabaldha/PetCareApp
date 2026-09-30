import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}

        <Text style={styles.eyebrow}>
          DISCOVER JEEVA
        </Text>

        <Text style={styles.title}>
          Everything they need.
        </Text>

        <Text style={styles.subtitle}>
          Helpful guides, animal knowledge and
          resources for better care.
        </Text>

        {/* SEARCH */}

        <View style={styles.search}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
          />

          <Text style={styles.searchText}>
            Search guides, topics & resources
          </Text>
        </View>

        {/* JEEVA AI */}

        <Pressable style={styles.aiCard}>
          <View style={styles.aiIcon}>
            <Text style={styles.aiEmoji}>
              ✨
            </Text>
          </View>

          <View style={styles.aiContent}>
            <Text style={styles.aiLabel}>
              JEEVA AI
            </Text>

            <Text style={styles.aiTitle}>
              Ask anything about pet care
            </Text>

            <Text style={styles.aiText}>
              Get quick guidance about food,
              behaviour, health and everyday care.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* EXPLORE BY TOPIC */}

        <Text style={styles.sectionTitle}>
          Explore by topic
        </Text>

        <View style={styles.grid}>
          <ExploreCard
            emoji="🍽️"
            title="Nutrition"
            description="Meals, portions & foods to avoid"
            background="#FFF0D1"
          />

          <ExploreCard
            emoji="💉"
            title="Health"
            description="Vaccines, medicines & wellness"
            background="#FFE3DF"
          />

          {/* NEW GROOMING CARD */}

          <ExploreCard
            emoji="✂️"
            title="Grooming"
            description="Bathing, brushing, nails & coat care"
            background="#F2E3F5"
          />

          <ExploreCard
            emoji="⚖️"
            title="Animal Laws"
            description="Rights, protections & legal help"
            background="#E8E0F5"
          />

          <ExploreCard
            emoji="🐕"
            title="Pet Guides"
            description="Care guides for every pet"
            background="#DDEEFF"
          />

          <ExploreCard
            emoji="🏠"
            title="Adoption"
            description="Find animals looking for homes"
            background="#E1F1E8"
          />

          <ExploreCard
            emoji="🛟"
            title="Rescue"
            description="Emergency help & rescue resources"
            background="#FFE8D9"
          />

          <ExploreCard
            emoji="🧠"
            title="Training"
            description="Behaviour, habits & bonding"
            background="#E5E8F8"
          />
        </View>

        {/* ANIMAL KNOWLEDGE */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Animal knowledge
          </Text>

          <Text style={styles.viewAll}>
            View all
          </Text>
        </View>

        <View style={styles.lawCard}>
          <View style={styles.lawIcon}>
            <Text style={styles.lawEmoji}>
              ⚖️
            </Text>
          </View>

          <View style={styles.lawContent}>
            <Text style={styles.lawTitle}>
              Know their rights
            </Text>

            <Text style={styles.lawText}>
              Learn about existing animal protection
              laws and responsible pet ownership.
            </Text>

            <Pressable>
              <Text style={styles.lawLink}>
                Explore animal laws →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* GROOMING GUIDE */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Care guide
          </Text>
        </View>

        <View style={styles.groomingCard}>
          <View style={styles.groomingIcon}>
            <Text style={styles.groomingEmoji}>
              ✂️
            </Text>
          </View>

          <View style={styles.groomingContent}>
            <Text style={styles.groomingLabel}>
              PET GROOMING
            </Text>

            <Text style={styles.groomingTitle}>
              Keep them clean, healthy & happy
            </Text>

            <Text style={styles.groomingText}>
              Learn how often your pet needs bathing,
              brushing, nail trimming and other grooming care.
            </Text>

            <Pressable>
              <Text style={styles.groomingLink}>
                Read grooming guide →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* DAILY GUIDE */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Today's guide
          </Text>
        </View>

        <View style={styles.guideCard}>
          <Text style={styles.guideEmoji}>
            🥕
          </Text>

          <View style={styles.guideContent}>
            <Text style={styles.guideLabel}>
              PET NUTRITION
            </Text>

            <Text style={styles.guideTitle}>
              How much should your pet eat?
            </Text>

            <Text style={styles.guideText}>
              Understand portions based on age,
              weight, activity and pet type.
            </Text>

            <Pressable>
              <Text style={styles.guideLink}>
                Read guide →
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ExploreCard({
  emoji,
  title,
  description,
  background,
}: {
  emoji: string;
  title: string;
  description: string;
  background: string;
}) {
  return (
    <Pressable
      style={[
        styles.exploreCard,
        { backgroundColor: background },
      ]}
    >
      <Text style={styles.exploreEmoji}>
        {emoji}
      </Text>

      <Text style={styles.exploreTitle}>
        {title}
      </Text>

      <Text style={styles.exploreDescription}>
        {description}
      </Text>

      <View style={styles.smallArrow}>
        <Ionicons
          name="arrow-forward"
          size={13}
          color="#34443E"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },

  content: {
    padding: 20,
  },

  eyebrow: {
    color: '#7057A5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    color: '#20352F',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },

  subtitle: {
    color: '#85817A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 330,
  },

  search: {
    height: 49,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchText: {
    color: '#9B9790',
    fontSize: 11,
    marginLeft: 9,
  },

  /* AI */

  aiCard: {
    backgroundColor: '#67539B',
    borderRadius: 23,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiEmoji: {
    fontSize: 24,
  },

  aiContent: {
    flex: 1,
    marginHorizontal: 13,
  },

  aiLabel: {
    color: '#DCD1F2',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  aiTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  aiText: {
    color: '#DDD6EB',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  /* SECTION */

  sectionTitle: {
    color: '#20352F',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 25,
    marginBottom: 13,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  /* TOPIC CARD */

  exploreCard: {
    width: '48%',
    minHeight: 157,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },

  exploreEmoji: {
    fontSize: 29,
  },

  exploreTitle: {
    color: '#293A35',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },

  exploreDescription: {
    color: '#77736D',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
    paddingRight: 5,
  },

  smallArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: '#FFFFFF80',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SECTION HEADER */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewAll: {
    color: '#A26A45',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 25,
  },

  /* LAWS */

  lawCard: {
    backgroundColor: '#E8E0F5',
    borderRadius: 23,
    padding: 17,
    flexDirection: 'row',
  },

  lawIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lawEmoji: {
    fontSize: 26,
  },

  lawContent: {
    flex: 1,
    marginLeft: 13,
  },

  lawTitle: {
    color: '#463D5D',
    fontSize: 15,
    fontWeight: '900',
  },

  lawText: {
    color: '#746B83',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  lawLink: {
    color: '#7057A5',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
  },

  /* GROOMING */

  groomingCard: {
    backgroundColor: '#F2E3F5',
    borderRadius: 23,
    padding: 17,
    flexDirection: 'row',
  },

  groomingIcon: {
    width: 57,
    height: 57,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  groomingEmoji: {
    fontSize: 29,
  },

  groomingContent: {
    flex: 1,
    marginLeft: 13,
  },

  groomingLabel: {
    color: '#92549D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  groomingTitle: {
    color: '#563D5C',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },

  groomingText: {
    color: '#806B84',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  groomingLink: {
    color: '#92549D',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 8,
  },

  /* DAILY GUIDE */

  guideCard: {
    backgroundColor: '#FFF0D1',
    borderRadius: 23,
    padding: 18,
    flexDirection: 'row',
  },

  guideEmoji: {
    fontSize: 38,
  },

  guideContent: {
    flex: 1,
    marginLeft: 13,
  },

  guideLabel: {
    color: '#A17819',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  guideTitle: {
    color: '#5E4D28',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },

  guideText: {
    color: '#88784F',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  guideLink: {
    color: '#9A7212',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 8,
  },
});