// src/navigation/GuardNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { SCREENS } from '../constants';
import GuardDashboardScreen  from '../screens/guard/GuardDashboardScreen';
import VisitorLogsScreen     from '../screens/guard/VisitorLogsScreen';
import VisitorEntryScreen    from '../screens/guard/VisitorEntryScreen';
import VisitorDetailScreen   from '../screens/guard/VisitorDetailScreen';
import GuardProfileScreen    from '../screens/guard/GuardProfileScreen';
import SosAlertsScreen       from '../screens/guard/SosAlertsScreen';
import GuardInboxScreen      from '../screens/guard/GuardInboxScreen';
import { useSosAlerts }      from '../hooks/useSos';
import { useGuardMessages }  from '../hooks/useGuards';

const Tab          = createBottomTabNavigator();
const VisitorStack = createNativeStackNavigator();

const GUARD_ACCENT = '#E65100';
const tabIcon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

function SosTabIcon({ color, size }) {
  const { data } = useSosAlerts();
  const activeCount = (data?.data ?? []).filter(a => a.status === 'active').length;
  return (
    <View>
      <Ionicons name="warning-outline" size={size} color={activeCount > 0 ? '#C62828' : color} />
      {activeCount > 0 && (
        <View style={badge.wrap}>
          <Text style={badge.text}>{activeCount}</Text>
        </View>
      )}
    </View>
  );
}

function InboxTabIcon({ color, size }) {
  const { data } = useGuardMessages();
  const unread = data?.data?.unreadCount ?? 0;
  return (
    <View>
      <Ionicons name="chatbubbles-outline" size={size} color={color} />
      {unread > 0 && (
        <View style={badge.wrap}>
          <Text style={badge.text}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#C62828', minWidth: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  text: { color: '#fff', fontSize: 9, fontWeight: '900' },
});

function VisitorStackNavigator() {
  return (
    <VisitorStack.Navigator screenOptions={{ headerShown: false }}>
      <VisitorStack.Screen name={SCREENS.GUARD_VISITOR_LOGS}   component={VisitorLogsScreen} />
      <VisitorStack.Screen name={SCREENS.GUARD_VISITOR_ENTRY}  component={VisitorEntryScreen} />
      <VisitorStack.Screen name={SCREENS.GUARD_VISITOR_DETAIL} component={VisitorDetailScreen} />
    </VisitorStack.Navigator>
  );
}

export default function GuardNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   GUARD_ACCENT,
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
        name={SCREENS.GUARD_DASHBOARD}
        component={GuardDashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: tabIcon('grid-outline') }}
      />
      <Tab.Screen
        name="GuardVisitorStack"
        component={VisitorStackNavigator}
        options={{ tabBarLabel: 'Visitors', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tab.Screen
        name="GuardInbox"
        component={GuardInboxScreen}
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color, size }) => <InboxTabIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="GuardSosAlerts"
        component={SosAlertsScreen}
        options={{
          tabBarLabel: 'SOS',
          tabBarIcon: ({ color, size }) => <SosTabIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={SCREENS.GUARD_PROFILE}
        component={GuardProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tab.Navigator>
  );
}