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

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              JEEVA COMMUNITY
            </Text>

            <Text style={styles.title}>
              Together, we care. 🐾
            </Text>

            <Text style={styles.subtitle}>
              A community for everyone who loves,
              protects and helps animals.
            </Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={21}
              color="#20352F"
            />

            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#99958D"
          />

          <Text style={styles.searchText}>
            Search people, shelters, stories...
          </Text>
        </View>

        {/* COMMUNITY TYPES */}

        <Text style={styles.sectionTitle}>
          Find your community
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <CommunityCategory
            emoji="🐾"
            title="Pet Lovers"
            color="#E8E0F5"
          />

          <CommunityCategory
            emoji="🛡️"
            title="Protectors"
            color="#DDEEFF"
          />

          <CommunityCategory
            emoji="🏠"
            title="Shelters"
            color="#FFE3DF"
          />

          <CommunityCategory
            emoji="🩺"
            title="Vets"
            color="#E1F1E8"
          />

          <CommunityCategory
            emoji="🤝"
            title="Volunteers"
            color="#FFF0C9"
          />
        </ScrollView>

        {/* FEATURED */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Featured today
          </Text>

          <Text style={styles.viewAll}>
            View all
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureEmoji}>
            <Text style={styles.bigEmoji}>
              🐕
            </Text>
          </View>

          <View style={styles.featureContent}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                NEEDS HELP
              </Text>
            </View>

            <Text style={styles.featureTitle}>
              Help find a loving home
            </Text>

            <Text style={styles.featureDescription}>
              A local rescue is looking for a
              caring family for a rescued dog.
            </Text>

            <Pressable style={styles.featureButton}>
              <Text style={styles.featureButtonText}>
                Learn more
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        {/* STORIES */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Community stories
          </Text>

          <Text style={styles.viewAll}>
            See all
          </Text>
        </View>

        <StoryCard
          avatar="👩🏻"
          name="Priya"
          role="Pet Parent"
          emoji="🐶"
          title="Bruno's recovery journey"
          text="After weeks of care, Bruno is finally back to his playful self."
          likes="124"
          comments="18"
        />

        <StoryCard
          avatar="👨🏻"
          name="Arjun"
          role="Animal Volunteer"
          emoji="🐱"
          title="A small act can change a life"
          text="Our weekend rescue drive helped 12 animals find temporary shelter."
          likes="89"
          comments="11"
        />

        {/* SHELTERS */}

        <View style={styles.shelterCard}>
          <View style={styles.shelterIcon}>
            <Text style={styles.shelterEmoji}>
              🏠
            </Text>
          </View>

          <View style={styles.shelterContent}>
            <Text style={styles.shelterTitle}>
              Looking for a shelter?
            </Text>

            <Text style={styles.shelterText}>
              Discover shelters, rescuers and
              animal-care organizations near you.
            </Text>

            <Pressable>
              <Text style={styles.shelterLink}>
                Explore shelters →
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CREATE POST */}

      <Pressable style={styles.createButton}>
        <Ionicons
          name="add"
          size={25}
          color="#FFFFFF"
        />

        <Text style={styles.createText}>
          Create
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

/* CATEGORY */

function CommunityCategory({
  emoji,
  title,
  color,
}: {
  emoji: string;
  title: string;
  color: string;
}) {
  return (
    <Pressable
      style={[
        styles.category,
        { backgroundColor: color },
      ]}
    >
      <Text style={styles.categoryEmoji}>
        {emoji}
      </Text>

      <Text style={styles.categoryTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

/* STORY */

function StoryCard({
  avatar,
  name,
  role,
  emoji,
  title,
  text,
  likes,
  comments,
}: {
  avatar: string;
  name: string;
  role: string;
  emoji: string;
  title: string;
  text: string;
  likes: string;
  comments: string;
}) {
  return (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatar}
          </Text>
        </View>

        <View style={styles.storyUser}>
          <Text style={styles.userName}>
            {name}
          </Text>

          <Text style={styles.userRole}>
            {role}
          </Text>
        </View>

        <Pressable>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color="#777"
          />
        </Pressable>
      </View>

      <View style={styles.storyImage}>
        <Text style={styles.storyEmoji}>
          {emoji}
        </Text>
      </View>

      <Text style={styles.storyTitle}>
        {title}
      </Text>

      <Text style={styles.storyText}>
        {text}
      </Text>

      <View style={styles.storyActions}>
        <View style={styles.action}>
          <Ionicons
            name="heart-outline"
            size={19}
            color="#6E6A64"
          />

          <Text style={styles.actionText}>
            {likes}
          </Text>
        </View>

        <View style={styles.action}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color="#6E6A64"
          />

          <Text style={styles.actionText}>
            {comments}
          </Text>
        </View>

        <Ionicons
          name="share-outline"
          size={19}
          color="#6E6A64"
        />
      </View>
    </View>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: '#7057A5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    color: '#20352F',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 6,
  },

  subtitle: {
    color: '#85817A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 290,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    right: 11,
    top: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D76A50',
  },

  searchBox: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchText: {
    color: '#A09C95',
    fontSize: 12,
    marginLeft: 9,
  },

  sectionTitle: {
    color: '#20352F',
    fontSize: 17,
    fontWeight: '900',
  },

  categoryScroll: {
    paddingVertical: 14,
    gap: 10,
  },

  category: {
    width: 94,
    height: 100,
    borderRadius: 20,
    padding: 13,
    justifyContent: 'space-between',
  },

  categoryEmoji: {
    fontSize: 27,
  },

  categoryTitle: {
    color: '#37443F',
    fontSize: 11,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 13,
  },

  viewAll: {
    color: '#A26A45',
    fontSize: 11,
    fontWeight: '800',
  },

  featureCard: {
    backgroundColor: '#20352F',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
  },

  featureEmoji: {
    width: 88,
    height: 150,
    borderRadius: 18,
    backgroundColor: '#F2E7D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bigEmoji: {
    fontSize: 48,
  },

  featureContent: {
    flex: 1,
    marginLeft: 14,
    paddingVertical: 3,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF20',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  tagText: {
    color: '#FFD6C8',
    fontSize: 7,
    fontWeight: '900',
  },

  featureTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },

  featureDescription: {
    color: '#B9C7C0',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },

  featureButton: {
    height: 34,
    backgroundColor: '#7057A5',
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 13,
    gap: 6,
  },

  featureButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    marginBottom: 12,
  },

  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EEE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 21,
  },

  storyUser: {
    flex: 1,
    marginLeft: 10,
  },

  userName: {
    color: '#283B35',
    fontSize: 12,
    fontWeight: '900',
  },

  userRole: {
    color: '#99958E',
    fontSize: 9,
    marginTop: 2,
  },

  storyImage: {
    height: 125,
    borderRadius: 17,
    backgroundColor: '#EAF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },

  storyEmoji: {
    fontSize: 65,
  },

  storyTitle: {
    color: '#283B35',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },

  storyText: {
    color: '#85817A',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  storyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 20,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  actionText: {
    color: '#77736D',
    fontSize: 10,
  },

  shelterCard: {
    backgroundColor: '#FFE6E0',
    borderRadius: 22,
    padding: 17,
    flexDirection: 'row',
    marginTop: 8,
  },

  shelterIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shelterEmoji: {
    fontSize: 25,
  },

  shelterContent: {
    flex: 1,
    marginLeft: 12,
  },

  shelterTitle: {
    color: '#613E36',
    fontSize: 14,
    fontWeight: '900',
  },

  shelterText: {
    color: '#8D7068',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  shelterLink: {
    color: '#C45B45',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
  },

  createButton: {
    position: 'absolute',
    right: 18,
    bottom: 94,
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#67539B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },

  createText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 1,
  },
});