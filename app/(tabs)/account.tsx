import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, Music, LogOut, Headphones, 
  Shield, Cloud, Upload, Info
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { GlassView } from '@/components/ui/GlassView';
import { PremiumBackground } from '@/components/PremiumBackground';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, listeningHistory, totalListeningMs, logout, isAdmin } = useAuth();
  const [showAdminBadge, setShowAdminBadge] = useState(false);

  if (!user) return null;

  const totalHours = Math.floor(totalListeningMs / 3600000);
  const totalMinutes = Math.floor((totalListeningMs % 3600000) / 60000);
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  const handleBackup = async () => {
    const data = {
      user,
      history: listeningHistory,
      timestamp: Date.now(),
    };
    try {
      await Share.share({
        message: JSON.stringify(data),
        title: 'Rimuru Music Backup',
      });
    } catch (e) {
      Alert.alert('Backup Failed', 'Could not create backup file.');
    }
  };

  const colors = {
    background: '#1a1a2e',
    primary: '#1DB954',
    secondary: '#16213e',
    detail: '#888',
  };

  return (
    <View style={styles.container}>
      <PremiumBackground colors={colors} />
      
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Account</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color="#FF4B6E" size={22} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <GlassView style={styles.profileCard} intensity={20}>
            <TouchableOpacity 
              onLongPress={() => setShowAdminBadge(true)}
              delayLongPress={2000}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[colors.primary, '#17a34a']} style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            {isAdmin && showAdminBadge ? (
               <TouchableOpacity 
                 style={[styles.badge, {borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)'}]}
                 onPress={() => router.push('/admin')}
               >
                 <Text style={[styles.badgeText, {color: '#FFD700'}]}>Master Admin Access</Text>
               </TouchableOpacity>
            ) : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Premium Member</Text>
              </View>
            )}
          </GlassView>
        </View>

        <View style={styles.statsGrid}>
          <GlassView style={styles.statBox}>
            <Headphones color={colors.primary} size={24} />
            <Text style={styles.statVal}>{totalHours}h {totalMinutes}m</Text>
            <Text style={styles.statLabel}>Listening</Text>
          </GlassView>
          <GlassView style={styles.statBox}>
            <Music color="#FF4B6E" size={24} />
            <Text style={styles.statVal}>{listeningHistory.length}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </GlassView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CLOUD SYNC & BACKUP</Text>
          <GlassView style={styles.featureContainer}>
            <TouchableOpacity style={styles.featureItem} onPress={handleBackup}>
              <View style={[styles.featureIcon, {backgroundColor: 'rgba(29,185,84,0.1)'}]}>
                <Upload color={colors.primary} size={20} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Export Data</Text>
                <Text style={styles.featureDesc}>Create a local backup of your history</Text>
              </View>
              <ChevronLeft color="#444" size={20} style={{transform: [{rotate: '180deg'}]}} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.featureItem} onPress={() => Alert.alert('Sync', 'Cloud Sync is coming in the next update!')}>
              <View style={[styles.featureIcon, {backgroundColor: 'rgba(59,130,246,0.1)'}]}>
                <Cloud color="#3b82f6" size={20} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Google Drive Sync</Text>
                <Text style={styles.featureDesc}>Connect to your cloud storage</Text>
              </View>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>SOON</Text>
              </View>
            </TouchableOpacity>
          </GlassView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <GlassView style={styles.featureContainer}>
            <TouchableOpacity style={styles.featureItem} onPress={() => Alert.alert('Settings', 'Coming Soon!')}>
              <View style={[styles.featureIcon, {backgroundColor: 'rgba(255,255,255,0.05)'}]}>
                <Shield color="#FFF" size={20} />
              </View>
              <Text style={[styles.featureTitle, {flex: 1, marginLeft: 12}]}>Privacy Settings</Text>
              <ChevronLeft color="#444" size={20} style={{transform: [{rotate: '180deg'}]}} />
            </TouchableOpacity>
          </GlassView>
        </View>

        <View style={styles.footer}>
          <Info color="#444" size={16} />
          <Text style={styles.footerText}>Rimuru Music v1.0.0 (Gold Edition)</Text>
          <Text style={styles.footerSubText}>Member since {memberSince}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  topTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  logoutBtn: { padding: 4 },
  profileSection: { paddingHorizontal: 20, marginVertical: 10 },
  profileCard: { padding: 30, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 15, shadowColor: '#1DB954', shadowOpacity: 0.5, shadowRadius: 15 },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  userName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  userEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 5 },
  badge: { backgroundColor: 'rgba(29,185,84,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: 'rgba(29,185,84,0.3)' },
  badgeText: { color: '#1DB954', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginVertical: 10 },
  statBox: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, fontWeight: 'bold' },
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12, marginLeft: 5 },
  featureContainer: { paddingVertical: 5 },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  featureIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1, marginLeft: 15 },
  featureTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  featureDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 70 },
  comingSoon: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  comingSoonText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 'bold' },
  footer: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  footerText: { color: '#FFF', fontSize: 12, marginTop: 10, fontWeight: 'bold' },
  footerSubText: { color: '#888', fontSize: 11, marginTop: 4 },
});
