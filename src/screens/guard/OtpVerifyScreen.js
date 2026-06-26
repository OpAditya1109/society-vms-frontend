import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { visitorService } from '../../api/services/visitorService';

export default function OtpVerifyScreen({ route, navigation }) {
  const { visitorId, visitorMobile, visitorName } = route.params;

  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      Alert.alert('Enter OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await visitorService.verifyOtp(visitorId, otpStr);
      Alert.alert(
        'OTP Verified ✓',
        'Visitor verified. Resident has been notified for approval.',
        [{ text: 'OK', onPress: () => navigation.navigate('GuardDashboard') }]
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'OTP verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await visitorService.resendOtp(visitorId);
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setCanResend(false);
      inputs.current[0]?.focus();
      Alert.alert('OTP Resent', 'New OTP sent to visitor\'s mobile.');
    } catch (err) {
      Alert.alert('Error', 'Could not resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  const maskedMobile = visitorMobile
    ? visitorMobile.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')
    : '**********';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Verify Visitor</Text>
        <Text style={styles.subtitle}>
          OTP sent to {visitorName}'s mobile{'\n'}
          <Text style={styles.mobile}>{maskedMobile}</Text>
        </Text>

        <Text style={styles.label}>Enter 6-digit OTP</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={1}
              returnKeyType="next"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.verifyBtnText}>Verify OTP</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend || resending}
          style={styles.resendBtn}
        >
          {resending
            ? <ActivityIndicator size="small" color="#666" />
            : (
              <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
                {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
              </Text>
            )
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 28, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  title:        { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  mobile:       { fontWeight: '600', color: '#333' },
  label:        { fontSize: 13, color: '#888', marginBottom: 12, textAlign: 'center' },
  otpRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  otpBox:       { width: 46, height: 54, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#111', backgroundColor: '#fafafa' },
  otpBoxFilled: { borderColor: '#2563EB', backgroundColor: '#eff6ff' },
  verifyBtn:    { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  btnDisabled:  { opacity: 0.6 },
  verifyBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn:    { alignItems: 'center', paddingVertical: 8 },
  resendText:   { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  resendDisabled: { color: '#aaa' },
});