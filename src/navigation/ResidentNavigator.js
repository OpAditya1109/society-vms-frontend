// src/navigation/ResidentNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { SCREENS } from '../constants';
import ResidentDashboardScreen  from '../screens/resident/ResidentDashboardScreen';
import VisitorRequestsScreen    from '../screens/resident/VisitorRequestsScreen';
import NoticesScreen            from '../screens/resident/NoticesScreen';
import ComplaintsScreen         from '../screens/resident/ComplaintsScreen';
import ProfileScreen            from '../screens/resident/ProfileScreen';
import FamilyMembersScreen      from '../screens/resident/FamilyMembersScreen';
import DailyHelpScreen          from '../screens/resident/DailyHelpScreen';
import VehiclesScreen           from '../screens/resident/VehiclesScreen';
import PreApprovedScreen        from '../screens/resident/PreApprovedScreen';
import AmenityBookingScreen     from '../screens/resident/AmenityBookingScreen';
import SosScreen                from '../screens/resident/SosScreen';
import MarketplaceScreen        from '../screens/resident/MarketplaceScreen';
import ListingDetailScreen      from '../screens/resident/ListingDetailScreen';
import CommunityScreen          from '../screens/resident/CommunityScreen';   // ← NEW

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCREENS.RESIDENT_PROFILE}        component={ProfileScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_FAMILY_MEMBERS} component={FamilyMembersScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_DAILY_HELP}     component={DailyHelpScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_VEHICLES}       component={VehiclesScreen} />
      <Stack.Screen name="ResidentPreApproved"             component={PreApprovedScreen} />
      <Stack.Screen name="ResidentAmenities"               component={AmenityBookingScreen} />
      <Stack.Screen name="ResidentSos"                     component={SosScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCREENS.RESIDENT_DASHBOARD}    component={ResidentDashboardScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_VISITORS}     component={VisitorRequestsScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_COMPLAINTS}   component={ComplaintsScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_NOTICES}      component={NoticesScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_FAMILY_MEMBERS} component={FamilyMembersScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_DAILY_HELP}   component={DailyHelpScreen} />
      <Stack.Screen name={SCREENS.RESIDENT_VEHICLES}     component={VehiclesScreen} />
      <Stack.Screen name="ResidentPreApproved"           component={PreApprovedScreen} />
      <Stack.Screen name="ResidentAmenities"             component={AmenityBookingScreen} />
      <Stack.Screen name="ResidentSos"                   component={SosScreen} />
    </Stack.Navigator>
  );
}

function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketplaceHome" component={MarketplaceScreen} />
      <Stack.Screen name="ListingDetail"   component={ListingDetailScreen} />
    </Stack.Navigator>
  );
}

export default function ResidentNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor:   colors.surface,
          borderTopColor:    colors.outlineVariant,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="ResidentHomeStack"
        component={HomeStack}
        options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      {/* ── Community tab ──────────────────────────────────────────── */}
      <Tab.Screen
        name="ResidentCommunity"
        component={CommunityScreen}
        options={{ tabBarLabel: 'Community', tabBarIcon: tabIcon('globe-outline') }}
      />
      {/* ─────────────────────────────────────────────────────────────── */}
      <Tab.Screen
        name="ResidentMarketplace"
        component={MarketplaceStack}
        options={{ tabBarLabel: 'Marketplace', tabBarIcon: tabIcon('storefront-outline') }}
      />
      <Tab.Screen
        name="ResidentProfileStack"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tab.Navigator>
  );
}