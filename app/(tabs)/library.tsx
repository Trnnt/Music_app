import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library as LibraryIcon, Music, Heart, Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { listeningHistory, totalListeningMs } = useAuth();

  const sections = [
    { id: '1', title: 'Favorites', icon: Heart, count: 0, color: '#FF4B6E' },
    { id: '2', title: 'Recently Played', icon: Clock, count: listeningHistory?.length || 0, color: '#00B4D8' },
    { id: '3', title: 'Playlists', icon: LibraryIcon, count: 0, color: '#90E0EF' },
    { id: '4', title: 'Listening Time', icon: Music, count: Math.round((totalListeningMs || 0) / 60000), color: '#1DB954', unit: 'm' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0a2e', '#000']} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        ListHeaderComponent={() => (
          <View style={{ height: 16 }} />
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
              <item.icon color={item.color} size={32} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCount}>{item.count}{item.unit || ''} items</Text>
            </BlurView>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            {!listeningHistory || listeningHistory.length === 0 ? (
              <Text style={styles.emptyText}>Songs you play will appear here ✨</Text>
            ) : (
              listeningHistory.slice(0, 10).map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Music color="#FFF" size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName} numberOfLines={1}>{item.songTitle}</Text>
                    <Text style={styles.historyArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 120 }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 24, marginBottom: 10 },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 16 },
  card: { flex: 1, margin: 8, height: 140, borderRadius: 24, overflow: 'hidden' },
  cardBlur: { flex: 1, padding: 20, justifyContent: 'center' },
  cardTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginTop: 12 },
  cardCount: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
  historySection: { paddingHorizontal: 10, marginTop: 24 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 8 
  },
  historyIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  historyName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  historyArtist: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
});
