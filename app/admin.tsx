import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Users, UserCheck, Activity, Clock, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  lastActive?: string;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getAllUsers, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    const allUsers = await getAllUsers();
    // Sort by most recently active first
    allUsers.sort((a, b) => {
      const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return bTime - aTime;
    });
    setUsers(allUsers);
  }, [getAllUsers]);

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const now = Date.now();

  // Active in last 5 minutes
  const activeNow = users.filter(u => {
    if (!u.lastActive) return false;
    return (now - new Date(u.lastActive).getTime()) < 5 * 60 * 1000;
  }).length;

  // Active in last 24 hours
  const activeToday = users.filter(u => {
    if (!u.lastActive) return false;
    return (now - new Date(u.lastActive).getTime()) < 24 * 60 * 60 * 1000;
  }).length;

  // Joined today
  const joinedToday = users.filter(u => {
    const created = new Date(u.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (lastActive?: string): string => {
    if (!lastActive) return '#555';
    const diff = now - new Date(lastActive).getTime();
    if (diff < 5 * 60 * 1000) return '#1DB954'; // Online (green)
    if (diff < 60 * 60 * 1000) return '#FFD700'; // Away (yellow)
    return '#555'; // Offline
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#0a0a0a']} style={styles.headerGradient}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Shield color="#FFD700" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.topTitle}>Admin Panel</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: '#1DB95440' }]}>
            <Users color="#1DB954" size={22} />
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#FFD70040' }]}>
            <Activity color="#1DB954" size={22} />
            <Text style={[styles.statNumber, { color: '#1DB954' }]}>{activeNow}</Text>
            <Text style={styles.statLabel}>Online Now</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#FF4B6E40' }]}>
            <UserCheck color="#4B9EFF" size={22} />
            <Text style={styles.statNumber}>{activeToday}</Text>
            <Text style={styles.statLabel}>Active Today</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#4B9EFF40' }]}>
            <Clock color="#FFD700" size={22} />
            <Text style={styles.statNumber}>{joinedToday}</Text>
            <Text style={styles.statLabel}>New Today</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Users List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>ALL REGISTERED USERS</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1DB954" />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Users color="#444" size={48} />
              <Text style={{ color: '#888', marginTop: 12 }}>No registered users yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCurrentUser = item.id === currentUser?.id;
            const statusColor = getStatusColor(item.lastActive);
            return (
              <View style={styles.userRow}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <LinearGradient 
                    colors={isCurrentUser ? ['#1DB954', '#17a34a'] : ['#2a2a3a', '#1a1a2e']} 
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                </View>

                {/* Info */}
                <View style={styles.userInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {isCurrentUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
                    <Text style={styles.userMeta}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.userMeta, { color: statusColor }]}>
                      {statusColor === '#1DB954' ? '● Online' : `Last active: ${formatTimeAgo(item.lastActive)}`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  headerGradient: { paddingBottom: 20 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  topTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 8,
  },
  statCard: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12,
    borderWidth: 1,
  },
  statNumber: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  listSection: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1.5,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  statusDot: {
    width: 12, height: 12, borderRadius: 6, position: 'absolute',
    bottom: 0, right: 0, borderWidth: 2, borderColor: '#0a0a0a',
  },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  userEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  userMeta: { color: '#666', fontSize: 11 },
  youBadge: {
    backgroundColor: '#1DB95420', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginLeft: 8,
  },
  youBadgeText: { color: '#1DB954', fontSize: 10, fontWeight: '800' },
});
