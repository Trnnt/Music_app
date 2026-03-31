import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library as LibraryIcon, Music, Heart, Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  const sections = [
    { id: '1', title: 'Favorites', icon: Heart, count: 12, color: '#FF4B6E' },
    { id: '2', title: 'Recently Played', icon: Clock, count: 48, color: '#00B4D8' },
    { id: '3', title: 'My Playlists', icon: LibraryIcon, count: 5, color: '#90E0EF' },
    { id: '4', title: 'Downloaded', icon: Music, count: 124, color: '#1DB954' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <BlurView intensity={20} style={styles.cardBlur}>
              <item.icon color={item.color} size={32} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCount}>{item.count} items</Text>
            </BlurView>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 16 },
  card: { flex: 1, margin: 8, height: 160, borderRadius: 24, overflow: 'hidden' },
  cardBlur: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  cardCount: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
});
