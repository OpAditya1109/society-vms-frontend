// constants/countryStateData.js - FIXED VERSION

export const COUNTRIES = [
  { id: 'IN', code: '+91', name: 'India', flag: '🇮🇳' },
  { id: 'US', code: '+1', name: 'USA', flag: '🇺🇸' },
  { id: 'UK', code: '+44', name: 'UK', flag: '🇬🇧' },
  { id: 'AU', code: '+61', name: 'Australia', flag: '🇦🇺' },
  { id: 'CA', code: '+1', name: 'Canada', flag: '🇨🇦' },  // Same code as USA but different id
  { id: 'SG', code: '+65', name: 'Singapore', flag: '🇸🇬' },
];

// Indian states and their cities
export const INDIAN_STATES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Kakinada', 'Rajahmundry'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezu'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Nagaon', 'Tinsukia'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Rajnandgaon'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Hisar', 'Panipat', 'Rohtak'],
  'Himachal Pradesh': ['Shimla', 'Solan', 'Mandi', 'Kangra', 'Palampur'],
  'Jharkhand': ['Ranchi', 'Dhanbad', 'Giridih', 'Bokaro', 'Jamshedpur'],
  'Karnataka': ['Bangalore', 'Mangalore', 'Mysore', 'Hubballi', 'Belgaum'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Alappuzha', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Kolhapur'],
  'Manipur': ['Imphal', 'Bishnupur', 'Thoubal'],
  'Meghalaya': ['Shillong', 'Tura', 'Nongpoh'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Berhampur'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Chandigarh', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Ajmer', 'Bikaner'],
  'Sikkim': ['Gangtok', 'Pelling', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Roorkee'],
  'West Bengal': ['Kolkata', 'Darjeeling', 'Siliguri', 'Asansol', 'Durgapur'],
  'Delhi': ['New Delhi', 'Central Delhi', 'West Delhi', 'East Delhi'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Ladakh': ['Leh', 'Kargil'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Samba'],
};

export const MOBILE_LENGTH = 10;