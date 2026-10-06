import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PetGuide } from '../data/petGuides';

interface Props {
  guide: PetGuide | null;
  onClose: () => void;
}

export default function PetGuideModal({ guide, onClose }: Props) {
  return (
    <Modal
      visible={guide !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.label}>JEEVA PET GUIDE</Text>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}
          >
            <Text style={styles.closeText}>Close ✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{guide?.title}</Text>

          {guide?.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.text}</Text>
            </View>
          ))}

          <Text style={styles.note}>
            General guidance. Follow your vet’s instructions for your
            individual pet.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F7F2' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: '#7057A5', fontSize: 11, fontWeight: '800' },
  close: { padding: 12 },
  closeText: { color: '#7057A5', fontWeight: '700' },
  content: { padding: 24, paddingBottom: 48 },
  title: { color: '#20352F', fontSize: 28, fontWeight: '800' },
  section: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    color: '#20352F',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: { color: '#68665F', fontSize: 15, lineHeight: 24 },
  note: { color: '#85817A', fontSize: 12, lineHeight: 19, marginTop: 24 },
});