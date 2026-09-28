import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import ScreenPlaceholder from '../../components/ScreenPlaceholder';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList, 'MainTabs'>
>;

export default function ProfileScreen({ navigation }: Props) {
  return (
    <ScreenPlaceholder
      title="Your Profile"
      description="Your personal details and preferences will live here."
    >
      <AppButton
        title="Open settings"
        variant="secondary"
        onPress={() => navigation.navigate('Settings')}
      />
    </ScreenPlaceholder>
  );
}