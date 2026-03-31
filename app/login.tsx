import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup, loginWithGoogle, quickLogin } = useAuth();
  const [mode, setMode] = useState<'quick' | 'login' | 'signup'>('quick');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleAuth(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleAuth = async (accessToken: string) => {
    setLoading(true);
    setError('');
    try {
      const ok = await loginWithGoogle(accessToken);
      if (ok) {
        router.replace('/(tabs)');
      } else {
        setError('Failed to sign in with Google');
      }
    } catch (e) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    const ok = await quickLogin(name.trim());
    setLoading(false);
    
    // Explicit navigate instead of waiting for segments to realize
    router.replace('/(tabs)');
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const ok = await signup(name.trim(), email.trim(), password);
        if (ok) {
          router.replace('/(tabs)');
        } else {
          setError('An account with this email already exists');
        }
      } else {
        const ok = await login(email.trim(), password);
        if (ok) {
          router.replace('/(tabs)');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (e) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e', '#16213e', '#0a0a1a']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.logoCircle}>
              <Music color="#FFF" size={40} />
            </LinearGradient>
            <Text style={styles.appName}>Rimuru Music</Text>
            <Text style={styles.tagline}>Your personal music experience</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            
            {mode === 'quick' ? (
              <>
                <Text style={styles.formTitle}>Get Started</Text>
                <Text style={styles.subtitle}>Just enter your name to start listening</Text>

                <View style={styles.inputContainer}>
                  <User color="#1DB954" size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                  onPress={handleQuickLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.submitGradient}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Zap color="#FFF" size={18} style={{ marginRight: 8 }} />
                      <Text style={styles.submitText}>{loading ? 'Getting in...' : 'Start Listening'}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  style={styles.googleBtn} 
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setMode('login'); setError(''); }} style={styles.toggleBtn}>
                  <Text style={styles.toggleText}>
                    Have an account? <Text style={styles.toggleHighlight}>Sign In with Email</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>{mode === 'signup' ? 'Create Account' : 'Sign In'}</Text>

                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <User color="#888" size={20} />
                    <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Mail color="#888" size={20} />
                  <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>

                <View style={styles.inputContainer}>
                  <Lock color="#888" size={20} />
                  <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color="#888" size={20} /> : <Eye color="#888" size={20} />}
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleEmailSubmit} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.submitGradient}>
                    <Text style={styles.submitText}>{loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }} style={styles.toggleBtn}>
                  <Text style={styles.toggleText}>
                    {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={styles.toggleHighlight}>{mode === 'signup' ? 'Sign In' : 'Sign Up'}</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setMode('quick'); setError(''); }} style={[styles.toggleBtn, { marginTop: 4 }]}>
                  <Text style={styles.toggleText}>
                    <Text style={styles.toggleHighlight}>← Quick sign-in with name</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#1DB954', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  appName: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 16, letterSpacing: -0.5 },
  tagline: { color: '#888', fontSize: 14, marginTop: 4 },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  formTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  input: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 12, padding: 0 },
  errorText: { color: '#FF4B6E', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submitBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  submitGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#666', marginHorizontal: 12, fontSize: 12 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  googleIcon: { color: '#FFF', fontSize: 20, fontWeight: '800', marginRight: 10 },
  googleText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  toggleBtn: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#888', fontSize: 14 },
  toggleHighlight: { color: '#1DB954', fontWeight: '700' },
});
