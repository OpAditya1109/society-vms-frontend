// src/navigation/RootNavigator.js  ← REPLACE the existing file with this
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import {
  selectIsAuthenticated,
  selectUserRole,
  selectUserStatus,
} from '../store/slices/authSlice';

import AuthStack             from './AuthStack';
import ResidentNavigator     from './ResidentNavigator';
import GuardNavigator        from './GuardNavigator';
import AdminNavigator        from './AdminNavigator';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

import { ROLES, RESIDENT_STATUS, SCREENS } from '../constants';

// ── Notification / socket integration ────────────────────────────────────────
import { useVisitorNotifications } from '../hooks/useVisitorNotifications';
import VisitorAlertPopup            from '../components/common/VisitorAlertPopup';

const Root = createNativeStackNavigator();

// ── Inner component (needs to be inside NavigationContainer) ─────────────────
function AppShell() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);
  const status          = useSelector(selectUserStatus);

  const isPending = isAuthenticated && status === RESIDENT_STATUS.PENDING;

  const AppNavigator = React.useMemo(() => {
    if (!isAuthenticated || isPending) return null;
    switch (role) {
      case ROLES.RESIDENT: return ResidentNavigator;
      case ROLES.GUARD:    return GuardNavigator;
      case ROLES.ADMIN:    return AdminNavigator;
      default:             return null;
    }
  }, [isAuthenticated, isPending, role]);

  // 🔔 Visitor alert popup (only fires for residents)
  const { pendingVisitor, dismissVisitor } = useVisitorNotifications();

  const handleApproved = () => {
    dismissVisitor();
    Toast.show({ type: 'success', text1: '✅ Visitor Approved', text2: 'The guard has been notified.' });
  };

  const handleRejected = () => {
    dismissVisitor();
    Toast.show({ type: 'error', text1: '❌ Visitor Rejected', text2: 'The guard has been notified.' });
  };

  return (
    <View style={styles.root}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Root.Screen name="Auth" component={AuthStack} />
        ) : isPending ? (
          <Root.Screen name={SCREENS.PENDING_APPROVAL} component={PendingApprovalScreen} />
        ) : AppNavigator ? (
          <Root.Screen name="App" component={AppNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>

      {/* 🔔 Floating visitor alert — renders on top of every screen */}
      <VisitorAlertPopup
        visitor={pendingVisitor}
        onDismiss={dismissVisitor}
        onApproved={handleApproved}
        onRejected={handleRejected}
      />
    </View>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <AppShell />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});