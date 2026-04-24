import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Star, Play, ChevronRight, Music2, Headphones } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAudioLibrary } from '@/hooks/useAudioLibrary';
import { usePlayer } from '@/context/PlayerContext';
import { PremiumBackground } from '@/components/PremiumBackground';
import { GlassView } from '@/components/ui/GlassView';
import SongArtwork from '@/components/SongArtwork';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { songs } = useAudioLibrary();
  const { setPlaylistAndPlay, openPlayer } = usePlayer();

  const trendingSongs = useMemo(() => songs.slice(0, 10), [songs]);
  const categories = ['Pop', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Classical'];

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
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSub}>Discover new music & trends</Text>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredSection}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => {
              if (songs.length > 0) {
                setPlaylistAndPlay(songs, 0);
                router.push('/player');
              }
            }}
          >
            <LinearGradient
              colors={['#1DB954', '#17a34a', '#14532d']}
              style={styles.featuredCard}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredLabel}>
                  <Star color="#FFF" size={14} fill="#FFF" />
                  <Text style={styles.featuredLabelText}>RECOMMENDED</Text>
                </View>
                <Text style={styles.featuredTitle}>Gold Mix 2026</Text>
                <Text style={styles.featuredDesc}>Based on your recent listening activity</Text>
                <View style={styles.playFab}>
                  <Play color="#000" size={24} fill="#000" />
                </View>
              </View>
              <Music2 color="rgba(255,255,255,0.1)" size={150} style={styles.featuredBgIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CATEGORIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {categories.map((cat, i) => (
              <GlassView key={i} style={styles.categoryCard} intensity={20}>
                <Text style={styles.categoryText}>{cat}</Text>
              </GlassView>
            ))}
          </ScrollView>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <TrendingUp color={colors.primary} size={20} />
            <Text style={styles.sectionHeader}>TRENDING NOW</Text>
          </View>
          
          <View style={styles.trendingContainer}>
            {trendingSongs.length === 0 ? (
              <GlassView style={styles.emptyCard}>
                <Headphones color="rgba(255,255,255,0.2)" size={40} />
                <Text style={styles.emptyText}>Scan your library to see trends</Text>
              </GlassView>
            ) : (
              trendingSongs.map((song, index) => (
                <TouchableOpacity 
                  key={song.id} 
                  style={styles.trendingRow}
                  onPress={() => {
                    setPlaylistAndPlay(songs, index);
                    router.push('/player');
                  }}
                >
                  <Text style={styles.rank}>{index + 1}</Text>
                  <SongArtwork artwork={song.artwork} size={50} borderRadius={8} songTitle={song.title} />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                  </View>
                  <ChevronRight color="rgba(255,255,255,0.2)" size={18} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4, fontWeight: '500' },
  featuredSection: { paddingHorizontal: 20, marginBottom: 30 },
  featuredCard: { height: 180, borderRadius: 24, overflow: 'hidden', padding: 25, justifyContent: 'center' },
  featuredContent: { zIndex: 1 },
  featuredLabel: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 15 },
  featuredLabelText: { color: '#FFF', fontSize: 10, fontWeight: '900', marginLeft: 6 },
  featuredTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  playFab: { position: 'absolute', right: 0, bottom: -10, width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  featuredBgIcon: { position: 'absolute', right: -30, bottom: -40, opacity: 0.15 },
  section: { marginBottom: 30 },
  sectionHeader: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 15, marginLeft: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  categoryCard: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15, marginRight: 12 },
  categoryText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  trendingContainer: { paddingHorizontal: 20 },
  trendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rank: { color: 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '900', width: 30 },
  songInfo: { flex: 1, marginLeft: 15 },
  songTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  songArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  emptyCard: { padding: 40, alignItems: 'center', borderRadius: 20 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 15, textAlign: 'center' },
});
