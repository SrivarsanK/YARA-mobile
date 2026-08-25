// packages/user-app/src/components/AgencySelectorModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Bus, Check, X } from 'lucide-react-native';
import { AGENCY_PRESETS, AgencyPreset } from '@yara/shared/lib/agencies';
import { colors } from '@yara/shared';

interface AgencySelectorModalProps {
  visible: boolean;
  selectedAgencyId: string;
  onSelectAgency: (agency: AgencyPreset) => void;
  onClose: () => void;
}

export const AgencySelectorModal: React.FC<AgencySelectorModalProps> = ({
  visible,
  selectedAgencyId,
  onSelectAgency,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>SELECT TRANSIT PROVIDER</Text>
                  <Text style={styles.headerSubtitle}>Multi-Agency Transit Network</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{AGENCY_PRESETS.length} Networks</Text>
                </View>
              </View>

              {/* Agency List */}
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {AGENCY_PRESETS.map((agency) => {
                  const isSelected = agency.id === selectedAgencyId;

                  return (
                    <TouchableOpacity
                      key={agency.id}
                      activeOpacity={0.7}
                      style={[
                        styles.agencyCard,
                        isSelected && styles.agencyCardSelected,
                      ]}
                      onPress={() => {
                        onSelectAgency(agency);
                        onClose();
                      }}
                    >
                      <View style={styles.cardLeft}>
                        <View
                          style={[
                            styles.iconBox,
                            {
                              backgroundColor: isSelected
                                ? agency.accentColor
                                : colors.neutral[100],
                            },
                          ]}
                        >
                          <Bus
                            size={18}
                            color={isSelected ? '#FFFFFF' : colors.text.secondary}
                          />
                        </View>
                        <View style={styles.agencyInfo}>
                          <View style={styles.cityRow}>
                            <Text
                              style={[
                                styles.cityName,
                                isSelected && { color: colors.text.primary },
                              ]}
                            >
                              {agency.city}
                            </Text>
                            <Text style={styles.shortName}>
                              ({agency.shortName})
                            </Text>
                          </View>
                          <Text style={styles.dataStatus}>
                            {agency.dataStatus}
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View
                          style={[
                            styles.checkBadge,
                            { backgroundColor: agency.accentColor },
                          ]}
                        >
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  list: {
    maxHeight: 320,
    marginVertical: 12,
  },
  listContent: {
    gap: 10,
  },
  agencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: '#FFFFFF',
  },
  agencyCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyInfo: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
  },
  shortName: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
  },
  dataStatus: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: 4,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
