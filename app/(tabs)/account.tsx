import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User as UserIcon, Settings, CreditCard, Shield, LogOut, ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [showAdminRow, setShowAdminRow] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const options = [
    { icon: Settings, title: 'Settings', subtitle: 'Preference, Audio Quality', onPress: () => {} },
    { icon: CreditCard, title: 'Subscription', subtitle: 'Manage your plan', onPress: () => {} },
  ];

  // The Phantom Door: Reveal admin link only after long press
  if (isAdmin && showAdminRow) {
    options.unshift({ 
      icon: Shield, 
      title: 'Admin Console', 
      subtitle: 'Users, Stats, Systems', 
      onPress: () => router.push('/admin') 
    });
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', fontSize: 18, marginBottom: 20 }}>Please login to view account</Text>
        <TouchableOpacity 
          style={[styles.playBtn, { backgroundColor: '#1DB954', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.profileHeader, { paddingTop: insets.top + 50 }]}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <UserIcon color="#FFF" size={40} />
          )}
        </View>
        <TouchableOpacity 
          onLongPress={() => setShowAdminRow(true)} 
          delayLongPress={3000}
          activeOpacity={1}
        >
          <Text style={styles.profileName}>{user.name}</Text>
        </TouchableOpacity>
        <Text style={styles.profileEmail}>{user.email}</Text>
        {isAdmin && showAdminRow && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>MASTER ADMIN ACCESS GRANTED</Text>
          </View>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity key={index} style={styles.optionRow} onPress={option.onPress} activeOpacity={0.7}>
            <View style={[styles.optionIcon, option.title === 'Admin Console' && { backgroundColor: 'rgba(255,215,0,0.1)' }]}>
              <option.icon color={option.title === 'Admin Console' ? '#FFD700' : '#90E0EF'} size={24} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <ChevronRight color="rgba(255,255,255,0.3)" size={20} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.optionRow, { marginTop: 40 }]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.optionIcon, { backgroundColor: 'rgba(255,75,110,0.1)' }]}>
            <LogOut color="#FF4B6E" size={24} />
          </View>
          <Text style={[styles.optionTitle, { color: '#FF4B6E' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: insets.bottom + 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  profileHeader: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden'
  },
  avatarImage: { width: 100, height: 100 },
  profileName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  profileEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  adminBadge: { 
    backgroundColor: 'rgba(255,215,0,0.15)', 
    paddingHorizontal: 12, paddingVertical: 4, 
    borderRadius: 6, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)'
  },
  adminBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  optionsContainer: { paddingHorizontal: 24 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  optionIcon: { 
    width: 48, height: 48, borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  optionTextContainer: { marginLeft: 16, flex: 1 },
  optionTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  optionSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  playBtn: { justifyContent: 'center', alignItems: 'center' }, // For login button
});
