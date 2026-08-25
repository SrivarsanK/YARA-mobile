// packages/shared/components/SearchInput.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search routes, stops, or places...',
  autoFocus = false,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.focusedContainer]}>
      <Search
        size={18}
        color={isFocused ? colors.brand.primary : colors.text.muted}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
          accessibilityLabel="Clear search input"
          accessibilityRole="button"
        >
          <X size={15} color={colors.text.secondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  focusedContainer: {
    borderColor: colors.brand.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  clearButtonPressed: {
    backgroundColor: colors.neutral[200],
  },
});
