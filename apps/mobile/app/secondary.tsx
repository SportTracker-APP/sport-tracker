import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/src/components';
import { spacing } from '@/src/theme/tokens';

export default function SecondaryScreen() {
  return (
    <Screen includeBottomInset>
      <View style={styles.content}>
        <Text tone="accent" variant="eyebrow">
          STACK NATIVE
        </Text>
        <Text style={styles.title} variant="title">
          Un chemin hors des onglets
        </Text>
        <Card>
          <Text tone="secondary">
            Cette route valide l’ouverture future de fiches, réglages ou détails
            sans encombrer la navigation principale.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
});
