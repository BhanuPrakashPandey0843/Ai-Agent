import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BibleHomeScreen from '../screens/bible/BibleHomeScreen';
import BibleBooksScreen from '../screens/bible/BibleBooksScreen';
import BibleChaptersScreen from '../screens/bible/BibleChaptersScreen';
import BibleReaderScreen from '../screens/bible/BibleReaderScreen';
import BibleSearchScreen from '../screens/bible/BibleSearchScreen';
import BibleBookmarksScreen from '../screens/bible/BibleBookmarksScreen';
import BibleNotesScreen from '../screens/bible/BibleNotesScreen';
import BiblePlansScreen from '../screens/bible/BiblePlansScreen';

const Stack = createNativeStackNavigator();

export default function BibleNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
      <Stack.Screen name="BibleHome" component={BibleHomeScreen} />
      <Stack.Screen name="BibleBooks" component={BibleBooksScreen} />
      <Stack.Screen name="BibleChapters" component={BibleChaptersScreen} />
      <Stack.Screen name="BibleReader" component={BibleReaderScreen} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="BibleSearch" component={BibleSearchScreen} />
      <Stack.Screen name="BibleBookmarks" component={BibleBookmarksScreen} />
      <Stack.Screen name="BibleNotes" component={BibleNotesScreen} />
      <Stack.Screen name="BiblePlans" component={BiblePlansScreen} />
    </Stack.Navigator>
  );
}
