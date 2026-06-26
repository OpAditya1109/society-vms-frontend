// src/screens/admin/GuardDetailScreen.js
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DUTY_STATUS_COLORS = {
  active: { bg: '#E8F5E9', text: '#2E7D32', label: 'On Duty' },
  inactive: { bg: '#FAFAFA', text: '#9E9E9E', label: 'Off Duty' },
  onBreak: { bg: '#FFF3E0', text: '#E65100', label: 'On Break' },
};

/**
 * GuardDetailScreen
 * 
 * Shows complete details of a selected guard
 * - Basic info (name, contact, shift)
 * - Duty status and schedule
 * - Performance metrics (visitors logged, SOS responses, avg response time)
 * - Activity history (if available)
 */
export default function GuardDetailScreen({ route, navigation }) {
  const { guard } = route.params || {};
  const [expandedSection, setExpandedSection] = useState(null);

  if (!guard) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Guard data not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dutyStatus = DUTY_STATUS_COLORS[guard.dutyStatus] || DUTY_STATUS_COLORS.inactive;
  const initials = [guard.firstName?.[0], guard.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const InfoField = ({ icon, label, value, color = '#9E9E9E' }) => (
    <View style={styles.infoField}>
      <View style={[styles.fieldIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  const StatSection = ({ icon, color, title, value, unit = '' }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={[styles.statBigValue, { color }]}>
          {value}{unit}
        </Text>
      </View>
    </View>
  );

  const SectionHeader = ({ title, section, icon }) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color="#E65100" />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons 
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color="#999"
        style={{ marginLeft: 'auto' }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation?.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guard Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Surface style={styles.profileCard} elevation={2}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: '#E65100' + '18' }]}>
            <Text style={[styles.avatarText, { color: '#E65100' }]}>{initials}</Text>
          </View>

          {/* Name and Role */}
          <Text style={styles.guardName}>
            {guard.firstName} {guard.lastName}
          </Text>
          <View style={[styles.dutyBadge, { backgroundColor: dutyStatus.bg }]}>
            <Text style={[styles.dutyText, { color: dutyStatus.text }]}>
              {dutyStatus.label}
            </Text>
          </View>

          {/* Basic Contact Info */}
          <View style={styles.divider} />
          <InfoField 
            icon="call-outline" 
            label="Mobile" 
            value={guard.mobile}
            color="#1565C0"
          />
          <InfoField 
            icon="mail-outline" 
            label="Email" 
            value={guard.email}
            color="#1565C0"
          />
          {guard.shift && (
            <InfoField 
              icon="time-outline" 
              label="Shift" 
              value={guard.shift}
              color="#2E7D32"
            />
          )}
          {guard.joinDate && (
            <InfoField 
              icon="calendar-outline" 
              label="Joined" 
              value={new Date(guard.joinDate).toLocaleDateString()}
              color="#7B1FA2"
            />
          )}
        </Surface>

        {/* Performance Metrics */}
        <Text style={styles.sectionHeading}>Performance Metrics</Text>
        <View style={styles.statsGrid}>
          <StatSection 
            icon="people-outline"
            color="#1565C0"
            title="Visitors Logged"
            value={guard.visitorsLogged ?? 0}
          />
          <StatSection 
            icon="alert-circle-outline"
            color="#C62828"
            title="SOS Responded"
            value={guard.sosResponded ?? 0}
          />
          <StatSection 
            icon="timer-outline"
            color="#7B1FA2"
            title="Avg Response Time"
            value={guard.avgResponseTime ?? 'N/A'}
            unit={guard.avgResponseTime ? 'm' : ''}
          />
          <StatSection 
            icon="checkmark-circle-outline"
            color="#2E7D32"
            title="Duties Completed"
            value={guard.dutiesCompleted ?? 0}
          />
        </View>

        {/* Detailed Information Sections */}
        <Surface style={styles.sectionContainer} elevation={1}>
          <SectionHeader 
            title="Duty & Schedule" 
            section="duty"
            icon="calendar-outline"
          />
          {expandedSection === 'duty' && (
            <View style={styles.sectionContent}>
              <InfoField 
                icon="time-outline"
                label="Shift Duration"
                value={guard.shiftDuration ? `${guard.shiftDuration} hours` : 'N/A'}
              />
              <InfoField 
                icon="location-outline"
                label="Assigned Area"
                value={guard.assignedArea || 'Main Gate'}
              />
              <InfoField 
                icon="document-text-outline"
                label="Employment Status"
                value={guard.employmentStatus || 'Full-time'}
              />
              <InfoField 
                icon="alert-circle-outline"
                label="Current Status"
                value={dutyStatus.label}
              />
              {guard.lastCheckIn && (
                <InfoField 
                  icon="log-in-outline"
                  label="Last Check-in"
                  value={new Date(guard.lastCheckIn).toLocaleTimeString()}
                />
              )}
            </View>
          )}
        </Surface>

        <Surface style={styles.sectionContainer} elevation={1}>
          <SectionHeader 
            title="Performance Details" 
            section="performance"
            icon="trending-up-outline"
          />
          {expandedSection === 'performance' && (
            <View style={styles.sectionContent}>
              <InfoField 
                icon="award-outline"
                label="Rating"
                value={guard.rating ? `${guard.rating}/5.0` : 'N/A'}
              />
              <InfoField 
                icon="checkmark-done-outline"
                label="Tasks Completed This Month"
                value={guard.tasksCompleted || '0'}
              />
              <InfoField 
                icon="calendar-outline"
                label="Attendance Rate"
                value={guard.attendanceRate ? `${guard.attendanceRate}%` : 'N/A'}
              />
              <InfoField 
                icon="alert-outline"
                label="Incident Reports"
                value={guard.incidentReports || '0'}
              />
              <InfoField 
                icon="star-outline"
                label="Commendations"
                value={guard.commendations || '0'}
              />
            </View>
          )}
        </Surface>

        <Surface style={styles.sectionContainer} elevation={1}>
          <SectionHeader 
            title="Additional Information" 
            section="additional"
            icon="information-circle-outline"
          />
          {expandedSection === 'additional' && (
            <View style={styles.sectionContent}>
              {guard.experience && (
                <InfoField 
                  icon="briefcase-outline"
                  label="Experience"
                  value={`${guard.experience} years`}
                />
              )}
              {guard.language && (
                <InfoField 
                  icon="language-outline"
                  label="Languages"
                  value={guard.language}
                />
              )}
              {guard.certifications && (
                <InfoField 
                  icon="shield-outline"
                  label="Certifications"
                  value={guard.certifications}
                />
              )}
              {guard.emergencyContact && (
                <InfoField 
                  icon="phone-portrait-outline"
                  label="Emergency Contact"
                  value={guard.emergencyContact}
                />
              )}
              {guard.notes && (
                <InfoField 
                  icon="document-outline"
                  label="Notes"
                  value={guard.notes}
                />
              )}
            </View>
          )}
        </Surface>

        {/* Quick Actions */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionBtn, styles.messageBtn]}>
            <Ionicons name="chatbubble-outline" size={20} color="#1565C0" />
            <Text style={[styles.actionBtnText, { color: '#1565C0' }]}>Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]}>
            <Ionicons name="call-outline" size={20} color="#2E7D32" />
            <Text style={[styles.actionBtnText, { color: '#2E7D32' }]}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F5F3FF' 
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Content
  content: {
    paddingBottom: 40,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '900' 
  },
  guardName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  dutyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  dutyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Info Fields
  infoField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    width: '100%',
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Section Heading
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopWidth: 3,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
  },
  statBigValue: {
    fontSize: 24,
    fontWeight: '900',
  },

  // Collapsible Sections
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageBtn: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1565C0',
  },
  callBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});