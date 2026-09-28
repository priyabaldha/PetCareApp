import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import ScreenPlaceholder from '../../components/ScreenPlaceholder';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  return (
    <ScreenPlaceholder
      title="Make it yours"
      description="We’ll add your app preferences here in the Settings phase."
      includeTopInset={false}
    >
      <AppButton
        title="Back to profile"
        onPress={() => navigation.goBack()}
      />
    </ScreenPlaceholder>
  );
}