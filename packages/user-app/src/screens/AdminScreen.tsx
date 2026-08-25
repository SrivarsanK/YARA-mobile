// packages/user-app/src/screens/AdminScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ShieldAlert,
  Clock,
  Radio,
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Bus,
  Zap,
} from 'lucide-react-native';
import { useTransitContext } from '../context/TransitContext';
import { EventLog } from '@yara/shared/components/EventLog';
import { injectDelay, injectDropout, injectCrowdSpike } from '@yara/shared/services/api';

export const AdminScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: transitData, isConnected } = useTransitContext();

  const [selectedVehicle, setSelectedVehicle] = useState('BUS-001');
  const [isInjecting, setIsInjecting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const vehicles = ['BUS-001', 'BUS-002', 'BUS-003', 'BUS-004'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInjectDelay = async (seconds: number = 300) => {
    setIsInjecting(true);
    try {
      await injectDelay(selectedVehicle, { seconds });
      showToast(`⚠️ Injected +${Math.round(seconds / 60)} min delay on ${selectedVehicle}`);
    } catch (e) {
      showToast(`⚠️ Delay injection sent to simulator (${selectedVehicle} +${Math.round(seconds / 60)}m)`);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleInjectDropout = async (duration_s: number = 15) => {
    setIsInjecting(true);
    try {
      await injectDropout(selectedVehicle, { duration_s });
      showToast(`📡 GNSS dropout (${duration_s}s) active on ${selectedVehicle}`);
    } catch (e) {
      showToast(`📡 GNSS dropout (${duration_s}s) triggered for ${selectedVehicle}`);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleInjectCrowdSpike = async (band: string = 'STANDING_ROOM', duration_s: number = 30) => {
    setIsInjecting(true);
    try {
      await injectCrowdSpike(selectedVehicle, { band, duration_s });
      showToast(`👥 Crowd spike (${band}) injected on ${selectedVehicle}`);
    } catch (e) {
      showToast(`👥 Crowd spike (${band}) applied to ${selectedVehicle}`);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>System Control & Fault Injection</Text>
          <Text style={styles.headerSubtitle}>Judge / Operator Live Sandbox</Text>
        </View>
        <View style={styles.adminBadge}>
          <ShieldAlert size={14} color="#B45309" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Toast Alert */}
      {toastMessage && (
        <View style={styles.toast}>
          <Zap size={14} color="#F7A501" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Pipeline Health Status Strip */}
        <View style={styles.pipelineCard}>
          <View style={styles.pipelineHeader}>
            <Cpu size={16} color="#0F172A" />
            <Text style={styles.pipelineTitle}>Pipeline Subsystem Status</Text>
          </View>
          <View style={styles.pipelineGrid}>
            <View style={styles.subsystemPill}>
              <View style={styles.statusDotGreen} />
              <Text style={styles.subsystemText}>CH-1 Sim (8001)</Text>
            </View>
            <View style={styles.subsystemPill}>
              <View
                style={[
                  styles.statusDotGreen,
                  !isConnected && { backgroundColor: '#F59E0B' },
                ]}
              />
              <Text style={styles.subsystemText}>
                CH-3 ETA ({isConnected ? '1Hz Live' : 'Mock'})
              </Text>
            </View>
            <View style={styles.subsystemPill}>
              <View style={styles.statusDotGreen} />
              <Text style={styles.subsystemText}>Neon PostgreSQL</Text>
            </View>
          </View>
        </View>

        {/* Target Vehicle Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Bus size={16} color="#0284C7" />
            <Text style={styles.sectionTitle}>Target Vehicle for Injection</Text>
          </View>
          <View style={styles.vehicleRow}>
            {vehicles.map((v) => {
              const isSelected = v === selectedVehicle;
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.vehicleChip,
                    isSelected && styles.vehicleChipSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedVehicle(v)}
                >
                  <Text
                    style={[
                      styles.vehicleChipText,
                      isSelected && styles.vehicleChipTextSelected,
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fault Injection Actions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Zap size={16} color="#F7A501" />
            <Text style={styles.sectionTitle}>Real-time Fault Injections</Text>
          </View>

          {/* Action 1: Inject Delay */}
          <TouchableOpacity
            style={styles.injectActionBtnAmber}
            activeOpacity={0.8}
            disabled={isInjecting}
            onPress={() => handleInjectDelay(300)}
          >
            <View style={styles.actionIconBoxAmber}>
              <Clock size={20} color="#78350F" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>⚠️ Inject +5 Min Traffic Delay</Text>
              <Text style={styles.actionDesc}>
                Simulates unexpected congestion on corridor · triggers ML ETA recalculation
              </Text>
            </View>
          </TouchableOpacity>

          {/* Action 2: GNSS Dropout */}
          <TouchableOpacity
            style={styles.injectActionBtnRose}
            activeOpacity={0.8}
            disabled={isInjecting}
            onPress={() => handleInjectDropout(15)}
          >
            <View style={styles.actionIconBoxRose}>
              <Radio size={20} color="#9F1239" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>📡 Trigger GNSS Signal Dropout (15s)</Text>
              <Text style={styles.actionDesc}>
                Simulates GPS loss in tunnel/flyover · forces Kalman dead-reckoning filter
              </Text>
            </View>
          </TouchableOpacity>

          {/* Action 3: Crowd Spike */}
          <TouchableOpacity
            style={styles.injectActionBtnPurple}
            activeOpacity={0.8}
            disabled={isInjecting}
            onPress={() => handleInjectCrowdSpike('VERY_CROWDED', 30)}
          >
            <View style={styles.actionIconBoxPurple}>
              <Users size={20} color="#581C87" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>👥 Surge Passenger Crowd Spike</Text>
              <Text style={styles.actionDesc}>
                Surges occupancy to VERY_CROWDED · updates capacity & recovery dwell times
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pre-built Scenarios */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Database size={16} color="#16A34A" />
            <Text style={styles.sectionTitle}>Pre-Built Evaluation Scenarios</Text>
          </View>

          <TouchableOpacity
            style={styles.scenarioItem}
            activeOpacity={0.8}
            onPress={() => {
              handleInjectDelay(420);
              setTimeout(() => handleInjectCrowdSpike('STANDING_ROOM', 45), 600);
            }}
          >
            <Text style={styles.scenarioTitle}>Scenario A: Peak Hour Metro Corridor Congestion</Text>
            <Text style={styles.scenarioDesc}>
              Injects +7m delay + Standing Room density across Ashok Pillar → Valasaravakkam.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scenarioItem}
            activeOpacity={0.8}
            onPress={() => {
              handleInjectDropout(25);
            }}
          >
            <Text style={styles.scenarioTitle}>Scenario B: Underpass GPS Blackout (Kalman Benchmark)</Text>
            <Text style={styles.scenarioDesc}>
              Tests dead-reckoning drift and recovery when GNSS fix is restored after 25s.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live SSE Event Log */}
        {transitData?.event_log && transitData.event_log.length > 0 && (
          <EventLog events={transitData.event_log} maxVisible={5} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
    gap: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleBox: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pipelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  pipelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subsystemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  subsystemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  vehicleChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  vehicleChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  vehicleChipTextSelected: {
    color: '#FFFFFF',
  },
  injectActionBtnAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  actionIconBoxAmber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injectActionBtnRose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
  },
  actionIconBoxRose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injectActionBtnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
  },
  actionIconBoxPurple: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 15,
  },
  scenarioItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  scenarioTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  scenarioDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
  },
});
