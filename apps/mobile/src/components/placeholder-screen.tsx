import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/src/components/card';
import { Screen } from '@/src/components/screen';
import { Text } from '@/src/components/text';
import { colors, radii, spacing } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PlaceholderScreenProps = PropsWithChildren<{
  body: string;
  icon: IconName;
  title: string;
}>;

export function PlaceholderScreen({
  body,
  children,
  icon,
  title,
}: PlaceholderScreenProps) {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text tone="accent" variant="eyebrow">
          HOVREN MOBILE
        </Text>
        <View style={styles.icon}>
          <Ionicons color={colors.forest} name={icon} size={26} />
        </View>
        <Text variant="title">{title}</Text>
        <Text style={styles.body} tone="secondary">
          {body}
        </Text>
      </View>

      <Card accessibilityLabel="État de cette section" style={styles.card}>
        <Text variant="heading">Le carnet se prépare.</Text>
        <Text style={styles.cardBody} tone="secondary">
          Navigation, zones sûres et fondations visuelles sont prêtes. Le contenu
          métier arrivera dans une prochaine étape.
        </Text>
        {children}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    minHeight: 330,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  icon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.sageSoft,
  },
  body: {
    maxWidth: 330,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.xs,
  },
  cardBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
