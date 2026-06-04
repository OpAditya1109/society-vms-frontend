// src/navigation/RootNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import {
  selectIsAuthenticated,
  selectUserRole,
} from '../store/slices/authSlice';

import AuthStack      from './AuthStack';
import ResidentNavigator from './ResidentNavigator';
import GuardNavigator    from './GuardNavigator';
import AdminNavigator    from './AdminNavigator';

import { ROLES } from '../constants';

const Root = createNativeStackNavigator();

export default function RootNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);

  const AppNavigator = React.useMemo(() => {
    if (!isAuthenticated) return null;
    switch (role) {
      case ROLES.RESIDENT: return ResidentNavigator;
      case ROLES.GUARD:    return GuardNavigator;
      case ROLES.ADMIN:    return AdminNavigator;
      default:             return null;
    }
  }, [isAuthenticated, role]);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || !AppNavigator ? (
          <Root.Screen name="Auth" component={AuthStack} />
        ) : (
          <Root.Screen name="App" component={AppNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
