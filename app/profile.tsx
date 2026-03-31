import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, Music, LogOut, Settings, Headphones, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, listeningHistory, totalListeningMs, logout } = useAuth();

  if (!user) return null;

  const totalHours = Math.floor(totalListeningMs / 3600000);
  const totalMinutes = Math.floor((totalListeningMs % 3600000) / 60000);
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const daysSinceJoined = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0a0a0a']} style={styles.headerGradient}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color="#FF4B6E" size={22} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.joinDate}>Joined {memberSince} ({daysSinceJoined} days)</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Headphones color="#1DB954" size={22} />
            <Text style={styles.statNumber}>{totalHours}h {totalMinutes}m</Text>
            <Text style={styles.statLabel}>Listening Time</Text>
          </View>
          <View style={styles.statCard}>
            <Music color="#FF4B6E" size={22} />
            <Text style={styles.statNumber}>{listeningHistory.length}</Text>
            <Text style={styles.statLabel}>Songs Played</Text>
          </View>
          <View style={styles.statCard}>
            <Clock color="#FFD700" size={22} />
            <Text style={styles.statNumber}>{daysSinceJoined}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Admin Panel Button */}
        <TouchableOpacity 
          style={styles.adminButton} 
          onPress={() => router.push('/admin')}
          activeOpacity={0.7}
        >
          <Shield color="#FFD700" size={18} />
          <Text style={styles.adminButtonText}>Admin Panel</Text>
          <ChevronLeft color="#888" size={16} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Activity Timeline */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>ACTIVITIES</Text>
        {listeningHistory.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Music color="#444" size={48} />
            <Text style={{ color: '#888', marginTop: 12 }}>No listening history yet</Text>
            <Text style={{ color: '#555', marginTop: 4 }}>Start playing songs to see your activity!</Text>
          </View>
        ) : (
          <FlatList
            data={listeningHistory}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            renderItem={({item}) => (
              <View style={styles.activityItem}>
                <View style={styles.timelineDot} />
                <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
                <View style={styles.activityContent}>
                  <Image source={{ uri: item.artwork }} style={styles.activityArt} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>
                      Listened to <Text style={styles.activityBold}>{item.songTitle}</Text>
                    </Text>
                    <Text style={styles.activityArtist}>{item.artist}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  headerGradient: { paddingBottom: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  topTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  logoutBtn: { padding: 4 },
  profileCard: { alignItems: 'center', paddingVertical: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#1DB954', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: '800' },
  userName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 12 },
  userEmail: { color: '#888', fontSize: 14, marginTop: 4 },
  joinDate: { color: '#666', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginTop: 16 },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16,
    alignItems: 'center', flex: 1, marginHorizontal: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  activitySection: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 16, letterSpacing: 1 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 8,
  },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#1DB954',
    position: 'absolute', left: 0, top: 8,
  },
  timeAgo: { color: '#666', fontSize: 11, width: 55, marginLeft: 16 },
  activityContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  activityArt: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  activityText: { color: '#ccc', fontSize: 13 },
  activityBold: { color: '#FFF', fontWeight: '700' },
  activityArtist: { color: '#666', fontSize: 11, marginTop: 2 },
  adminButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,215,0,0.06)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  adminButtonText: { color: '#FFD700', fontSize: 15, fontWeight: '700', flex: 1, marginLeft: 12 },
});
