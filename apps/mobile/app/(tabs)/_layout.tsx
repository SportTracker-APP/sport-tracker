import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  fontFamilies,
  radii,
  shadows,
  spacing,
} from '@/src/theme/tokens';

type TabIconProps = {
  activeName: ComponentProps<typeof Ionicons>['name'];
  color: ColorValue;
  focused: boolean;
  inactiveName: ComponentProps<typeof Ionicons>['name'];
};

function TabIcon({ activeName, color, focused, inactiveName }: TabIconProps) {
  return (
    <Ionicons
      color={color}
      name={focused ? activeName : inactiveName}
      size={24}
    />
  );
}

function PrimaryActionIcon() {
  return (
    <View style={styles.primaryActionIcon}>
      <Ionicons color={colors.white} name="add" size={30} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, spacing.xs);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.warmGray,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 66 + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Refuge',
          tabBarAccessibilityLabel: 'Ouvrir le Refuge',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="home"
              color={color}
              focused={focused}
              inactiveName="home-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarAccessibilityLabel: 'Explorer',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="compass"
              color={color}
              focused={focused}
              inactiveName="compass-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: 'Ajouter',
          tabBarAccessibilityLabel: 'Action principale HOVREN',
          tabBarIcon: PrimaryActionIcon,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Carnet',
          tabBarAccessibilityLabel: 'Ouvrir le Carnet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="book"
              color={color}
              focused={focused}
              inactiveName="book-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Ouvrir le Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="person"
              color={color}
              focused={focused}
              inactiveName="person-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.warmGraySoft,
    backgroundColor: colors.surfaceStrong,
    paddingTop: spacing.xs,
    ...shadows.floating,
  },
  tabBarItem: {
    minHeight: 52,
  },
  tabBarLabel: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 11,
    lineHeight: 14,
  },
  primaryActionIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -8 }],
    borderWidth: 4,
    borderColor: colors.canvas,
    borderRadius: radii.pill,
    backgroundColor: colors.forest,
    shadowColor: colors.forestDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});
