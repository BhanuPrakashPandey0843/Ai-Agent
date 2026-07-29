import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuizHomeScreen from '../screens/quiz/QuizHomeScreen';
import QuizSessionScreen from '../screens/quiz/QuizSessionScreen';
import QuizResultScreen from '../screens/quiz/QuizResultScreen';
import LeaderboardScreen from '../screens/quiz/LeaderboardScreen';
import QuizStatsScreen from '../screens/quiz/QuizStatsScreen';
import AchievementsScreen from '../screens/quiz/AchievementsScreen';

const Stack = createNativeStackNavigator();

export default function QuizNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
      <Stack.Screen name="QuizHome" component={QuizHomeScreen} />
      <Stack.Screen name="QuizSession" component={QuizSessionScreen} />
      <Stack.Screen
        name="QuizResult"
        component={QuizResultScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="QuizStats" component={QuizStatsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
    </Stack.Navigator>
  );
}
