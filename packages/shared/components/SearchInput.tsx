// packages/shared/components/SearchInput.tsx - Phase 3 stub
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { X } from 'lucide-react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChangeText, placeholder = 'Search routes or stops...', onClear }) => (
  <View style={styles.container}>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
    />
    {value && onClear && (
      <TouchableOpacity onPress={onClear} style={styles.clearButton}>
        <X size={18} color={colors.text.muted} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.darkSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border.medium, paddingHorizontal: 12 },
  input: { flex: 1, height: 48, fontSize: 16, color: colors.text.inverse },
  clearButton: { padding: 4 },
});
