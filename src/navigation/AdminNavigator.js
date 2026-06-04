// src/navigation/AdminNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { SCREENS } from '../constants';
import AdminDashboardScreen        from '../screens/admin/AdminDashboardScreen';
import ResidentsListScreen         from '../screens/admin/ResidentsListScreen';
import NoticesManagementScreen     from '../screens/admin/NoticesManagementScreen';
import ComplaintsManagementScreen  from '../screens/admin/ComplaintsManagementScreen';
import AdminProfileScreen          from '../screens/admin/AdminProfileScreen';
import AmenityManagementScreen     from '../screens/admin/AmenityManagementScreen';

const Tab = createBottomTabNavigator();
const ADMIN_ACCENT = '#4A148C';
const tabIcon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

export default function AdminNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   ADMIN_ACCENT,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name={SCREENS.ADMIN_DASHBOARD}
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: tabIcon('grid-outline') }}
      />
      <Tab.Screen
        name={SCREENS.ADMIN_MEMBERS}
        component={ResidentsListScreen}
        options={{ tabBarLabel: 'Residents', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tab.Screen
        name="AdminAmenitiesTab"
        component={AmenityManagementScreen}
        options={{ tabBarLabel: 'Amenities', tabBarIcon: tabIcon('business-outline') }}
      />
      <Tab.Screen
        name={SCREENS.ADMIN_NOTICES}
        component={NoticesManagementScreen}
        options={{ tabBarLabel: 'Notices', tabBarIcon: tabIcon('newspaper-outline') }}
      />
      <Tab.Screen
        name={SCREENS.ADMIN_COMPLAINTS}
        component={ComplaintsManagementScreen}
        options={{ tabBarLabel: 'Complaints', tabBarIcon: tabIcon('alert-circle-outline') }}
      />
      <Tab.Screen
        name={SCREENS.ADMIN_PROFILE}
        component={AdminProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tab.Navigator>
  );
}