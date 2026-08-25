import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@yara/shared';

export const AdminScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>Fault injection, fleet control, scenario runner, DB inspector</Text>
    </View>
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Screen scaffold � implementation in Phase 5</Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.dark },
  content: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text.inverse, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.text.muted, textAlign: 'center' },
  placeholder: { padding: 24, borderWidth: 1, borderColor: colors.border.medium, borderRadius: 12, backgroundColor: colors.bg.darkSecondary, minWidth: '80%' },
  placeholderText: { color: colors.text.muted, fontSize: 14, textAlign: 'center' },
});
