import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import { colors } from '../../constants/theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    eyebrow: 'WELCOME TO THEIR HAPPY PLACE',
    title: 'Little paws.\nA whole lot of love.',
    description:
      'A thoughtful home for your pets and the everyday care that keeps them happy.',
  },
  {
    eyebrow: 'CARE, BEAUTIFULLY ORGANISED',
    title: 'More care.\nLess to remember.',
    description:
      'Keep health records, vaccinations, and medication details together for every pet.',
  },
  {
    eyebrow: 'TOGETHER, EVERY STEP',
    title: 'Their next visit.\nOne less worry.',
    description:
      'Explore vets and services, organise appointments, and keep important details close.',
  },
];

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [photoWidth, setPhotoWidth] = useState(0);

  const slide = slides[slideIndex]!;
  const isLastSlide = slideIndex === slides.length - 1;
  const photoHeight = photoWidth * (2 / 3);

  function handleNext() {
    if (isLastSlide) {
      onComplete();
      return;
    }

    setSlideIndex((current) => current + 1);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brand}>petcare.</Text>
            <Text style={styles.step}>
              {slideIndex + 1} / {slides.length}
            </Text>
          </View>

          <View
            style={[styles.photoFrame, { height: photoHeight }]}
            onLayout={(event) => {
              setPhotoWidth(event.nativeEvent.layout.width);
            }}
          >
            {photoWidth > 0 && (
              <Image
                source={require('../../../assets/images/pets-hero.png')}
                style={{
                  width: photoWidth,
                  height: photoHeight,
                }}
                resizeMode="contain"
                accessible
                accessibilityLabel="A golden retriever and kitten resting together"
              />
            )}
          </View>

          <View
            style={styles.copy}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>

            <Text accessibilityRole="header" style={styles.title}>
              {slide.title}
            </Text>

            <Text style={styles.description}>
              {slide.description}
            </Text>
          </View>

          <View
            style={styles.dots}
            accessibilityLabel={`Onboarding page ${slideIndex + 1} of ${slides.length}`}
          >
            {slides.map((item, index) => (
              <View
                key={item.eyebrow}
                style={[
                  styles.dot,
                  index === slideIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton
              title={isLastSlide ? 'Get started' : 'Continue'}
              onPress={handleNext}
            />

            {slideIndex > 0 ? (
              <AppButton
                title="Back"
                variant="secondary"
                onPress={() => {
                  setSlideIndex((current) => current - 1);
                }}
              />
            ) : (
              <AppButton
                title="Skip introduction"
                variant="secondary"
                onPress={onComplete}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  brand: {
    color: colors.forest,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  step: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  photoFrame: {
    alignSelf: 'stretch',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.paleSage,
  },
  copy: {
    marginTop: 28,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    lineHeight: 17,
    marginBottom: 12,
  },
  title: {
    color: colors.forest,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -1,
  },
  description: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginVertical: 26,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.primary,
  },
  actions: {
    gap: 12,
    paddingBottom: 12,
  },
});