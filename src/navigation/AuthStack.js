// src/navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen   from '../screens/auth/SplashScreen';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import { SCREENS } from '../constants';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.SPLASH}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name={SCREENS.SPLASH}   component={SplashScreen} />
      <Stack.Screen name={SCREENS.LOGIN}    component={LoginScreen} />
      <Stack.Screen
        name={SCREENS.REGISTER}
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
