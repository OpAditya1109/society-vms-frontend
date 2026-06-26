// src/constants/index.js

export const ROLES = Object.freeze({
  RESIDENT: 'resident',
  GUARD:    'guard',
  ADMIN:    'admin',
});

export const VISITOR_STATUS = Object.freeze({
  PENDING:     'pending',
  APPROVED:    'approved',
  REJECTED:    'rejected',
  CHECKED_IN:  'checked_in',
  CHECKED_OUT: 'checked_out',
});

export const COMPLAINT_STATUS = Object.freeze({
  OPEN:        'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
  CLOSED:      'closed',
});

export const NOTICE_TYPE = Object.freeze({
  GENERAL:     'general',
  MAINTENANCE: 'maintenance',
  EMERGENCY:   'emergency',
  EVENT:       'event',
});

export const COMPLAINT_CATEGORIES = [
  'maintenance', 'noise', 'parking', 'water',
  'electricity', 'cleanliness', 'security', 'other',
];

export const COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ── Resident status (NEW) ─────────────────────────────────────────────────────
export const RESIDENT_STATUS = Object.freeze({
  PENDING:  'pending',
  ACTIVE:   'active',
  INACTIVE: 'inactive',
});

// ── Listing / Marketplace ─────────────────────────────────────────────────────
export const LISTING_TYPES = Object.freeze([
  'flat_rent', 'flat_sale', 'furniture', 'vehicle', 'appliance', 'other',
]);

export const LISTING_STATUS = Object.freeze([
  'active', 'sold', 'rented', 'withdrawn',
]);

export const LISTING_TYPE_LABELS = Object.freeze({
  flat_rent: 'Flat for Rent',
  flat_sale: 'Flat for Sale',
  furniture: 'Furniture',
  vehicle:   'Vehicle',
  appliance: 'Appliance',
  other:     'Other',
});

// ── Screen name constants ─────────────────────────────────────────────────────
export const SCREENS = Object.freeze({
  // Auth
  SPLASH:   'Splash',
  LOGIN:    'Login',
  REGISTER: 'Register',
  PENDING_APPROVAL:  'PendingApproval',  // ← ADD THIS
  // Resident
  RESIDENT_TABS:             'ResidentTabs',
  RESIDENT_DASHBOARD:        'ResidentDashboard',
  RESIDENT_VISITORS:         'ResidentVisitors',
  RESIDENT_VISITOR_DETAIL:   'ResidentVisitorDetail',
  RESIDENT_COMPLAINTS:       'ResidentComplaints',
  RESIDENT_COMPLAINT_DETAIL: 'ResidentComplaintDetail',
  RESIDENT_NOTICES:          'ResidentNotices',
  RESIDENT_NOTICE_DETAIL:    'ResidentNoticeDetail',
  RESIDENT_PROFILE:          'ResidentProfile',
  RESIDENT_FAMILY_MEMBERS:   'ResidentFamilyMembers',
  RESIDENT_DAILY_HELP:       'ResidentDailyHelp',
  RESIDENT_VEHICLES:         'ResidentVehicles',
  RESIDENT_MARKETPLACE:      'ResidentMarketplace',
  LISTING_DETAIL:            'ListingDetail',
  RESIDENT_COMMUNITY:        'ResidentCommunity',

  // Guard
  GUARD_TABS:           'GuardTabs',
  GUARD_DASHBOARD:      'GuardDashboard',
  GUARD_VISITOR_ENTRY:  'GuardVisitorEntry',
  GUARD_VISITOR_LOGS:   'GuardVisitorLogs',
  GUARD_VISITOR_DETAIL: 'GuardVisitorDetail',
  GUARD_NOTICES:        'GuardNotices',
  GUARD_PROFILE:        'GuardProfile',

  // Admin
  ADMIN_TABS:              'AdminTabs',
  ADMIN_DASHBOARD:         'AdminDashboard',
  ADMIN_VISITORS:          'AdminVisitors',
  ADMIN_VISITOR_DETAIL:    'AdminVisitorDetail',
  ADMIN_COMPLAINTS:        'AdminComplaints',
  ADMIN_COMPLAINT_DETAIL:  'AdminComplaintDetail',
  ADMIN_NOTICES:           'AdminNotices',
  ADMIN_NOTICE_DETAIL:     'AdminNoticeDetail',
  ADMIN_CREATE_NOTICE:     'AdminCreateNotice',
  ADMIN_MEMBERS:           'AdminMembers',
  ADMIN_PENDING_RESIDENTS: 'AdminPendingResidents', // ← NEW
  ADMIN_RESIDENT_DETAIL:   'AdminResidentDetail',   // ← NEW
  ADMIN_SOCIETY_SETTINGS:  'AdminSocietySettings',
  ADMIN_PROFILE:           'AdminProfile',
});

// ── Query keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = Object.freeze({
  ME:              ['auth', 'me'],
  SOCIETIES:       ['societies'],
  SOCIETY:         (id) => ['societies', id],
  DASHBOARD:       (role) => ['dashboard', role],
  VISITORS:        ['visitors'],
  VISITOR:         (id) => ['visitors', id],
  NOTICES:         ['notices'],
  NOTICE:          (id) => ['notices', id],
  COMPLAINTS:      ['complaints'],
  COMPLAINT:       (id) => ['complaints', id],
  MEMBERS:         (societyId) => ['members', societyId],
  RESIDENTS:       (status) => ['residents', status ?? 'all'],  // ← NEW
  RESIDENT:        (id) => ['residents', 'detail', id],         // ← NEW
  FAMILY_MEMBERS:  ['family-members'],
  DAILY_HELPS:     ['daily-help'],
  VEHICLES:        ['vehicles'],
  ATTENDANCE:      (id, month, year) => ['attendance', id, month, year],
  ENTRY_HISTORY:   (id) => ['entry-history', id],
  GUARDS:          ['guards'],
  GUARD_MESSAGES:  ['guard-messages'],
  GUARD_STATS:     ['guard-stats'],
  LISTINGS:        ['listings'],
  LISTING:         (id) => ['listings', id],
  COMMUNITY_POSTS: ['community'],
  COMMUNITY_POST:  (id) => ['community', id],
});