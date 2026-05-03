import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Search, Sliders, User } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const RIMURU_LOGO = require('../../assets/images/rimuru.jpg');

interface PremiumHeaderProps {
  title: string;
  onSearchPress?: () => void;
  onSortPress?: () => void;
  user?: { name: string } | null;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  onSearchPress,
  onSortPress,
  user,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Theme.spacing.sm }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Image source={RIMURU_LOGO} style={styles.logo} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn} onPress={onSortPress}>
            <Sliders color={Theme.colors.text} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress}>
            <Search color={Theme.colors.text} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.avatarBtn} 
            onPress={() => router.push('/profile')}
          >
            <LinearGradient 
              colors={[Theme.colors.primary, Theme.colors.primaryDark]} 
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    height: Theme.dimensions.headerHeight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: Theme.radius.md,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginLeft: Theme.spacing.sm,
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Theme.spacing.sm,
  },
  avatarBtn: {
    marginLeft: Theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
