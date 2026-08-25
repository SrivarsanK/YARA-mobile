// packages/user-app/src/screens/KioskScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Clock,
  Radio,
  MapPin,
  Sparkles,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Terminal,
  Bus,
} from 'lucide-react-native';

import {
  ETABreakdownBar,
  AGENCY_PRESETS,
  type OccupancyBand,
  type EventLogEntry,
} from '@yara/shared';
import { useTransit } from '../context/TransitContext';
import { ScreenNavigationProp } from '../navigation/types';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

function formatMMSS(sec: number): string {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface DensityConfigItem {
  label: string;
  sublabel: string;
  dotColor: string;
  bg: string;
  text: string;
  border: string;
  barColor: string;
  barPct: number;
}

const DENSITY_CONFIG: Record<OccupancyBand | string, DensityConfigItem> = {
  SEATS_AVAILABLE: {
    label: 'Seats Available',
    sublabel: 'Comfortable • Seats Open',
    dotColor: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#34D399',
    border: 'rgba(16, 185, 129, 0.3)',
    barColor: '#10B981',
    barPct: 25,
  },
  MODERATE: {
    label: 'Standing Room',
    sublabel: 'Moderate • Standing space',
    dotColor: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.12)',
    text: '#FCD34D',
    border: 'rgba(251, 191, 36, 0.3)',
    barColor: '#FBBF24',
    barPct: 50,
  },
  STANDING_ROOM: {
    label: 'Almost Full',
    sublabel: 'High Density • Limited space',
    dotColor: '#F97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    text: '#FB923C',
    border: 'rgba(249, 115, 22, 0.3)',
    barColor: '#F97316',
    barPct: 75,
  },
  VERY_CROWDED: {
    label: 'Overcrowded',
    sublabel: 'Capacity Full • No standing',
    dotColor: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.15)',
    text: '#FB7185',
    border: 'rgba(244, 63, 94, 0.35)',
    barColor: '#F43F5E',
    barPct: 100,
  },
};

const SCHEDULED_DEPARTURES = [
  {
    code: '21G',
    dest: 'To Broadway Terminus',
    via: 'Via Guindy Kathipara • Bay 3',
    time: '18:30',
    status: 'On Schedule',
  },
  {
    code: '570',
    dest: 'To Siruseri IT Park',
    via: 'Via OMR Express • Bay 1',
    time: '25:00',
    status: 'On Schedule',
  },
  {
    code: '101',
    dest: 'To Thiruvottiyur B.T.',
    via: 'Via Central Station • Bay 4',
    time: '32:00',
    status: 'On Schedule',
  },
];

export const KioskScreen: React.FC = () => {
  // 1. Keep awake while mounted
  useKeepAwake();

  const navigation = useNavigation<ScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height || width >= 768;

  const { data, isConnected } = useTransit();
  const [timeStr, setTimeStr] = useState<string>('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 3. Screen orientation: Lock landscape on mount, restore on unmount
  useEffect(() => {
    async function lockLandscape() {
      try {
        if (Platform.OS !== 'web' && ScreenOrientation?.lockAsync) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch {
        // Safe fallback for web or unsupported devices
      }
    }
    lockLandscape();

    return () => {
      async function unlockOrientation() {
        try {
          if (Platform.OS !== 'web' && ScreenOrientation?.unlockAsync) {
            await ScreenOrientation.unlockAsync();
          }
        } catch {
          // Safe fallback
        }
      }
      unlockOrientation();
    };
  }, []);

  // Live pulsing beacon
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Live 1-second clock
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const agency = AGENCY_PRESETS[0];
  const originName = 'Ashok Pillar';
  const destName = 'Valasaravakkam';
  const routeCode = 'S26';

  // Loading state if snapshot missing
  if (!data || !data.inbound) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar hidden={true} />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Bus size={18} color="#0F172A" />
              <Text style={styles.logoBadgeText}>YARA</Text>
            </View>
            <View style={styles.kioskPill}>
              <Text style={styles.kioskPillText}>KIOSK</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleExit} style={styles.exitBtn} activeOpacity={0.8}>
            <ArrowLeft size={16} color="#F8FAFC" />
            <Text style={styles.exitBtnText}>Exit Kiosk</Text>
          </TouchableOpacity>
        </View>

        {/* Loading card */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#F7A501" />
            <Text style={styles.loadingTitle}>Connecting to Yara Transit Stream...</Text>
            <Text style={styles.loadingSubtitle}>
              Waiting for live Kalman sensor fusion & GTFS snapshot telemetry
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.footerText}>
              Real-Time Kalman Sensor Fusion Active • Sub-2s Continuous ETA Engine
            </Text>
          </View>
          <Text style={styles.footerRight}>
            Smart India Hackathon 2026 • Yara Public Transit Intelligence Platform
          </Text>
        </View>
      </View>
    );
  }

  const { T_total_sec, T_outbound_sec, T_dwell_sec, T_inbound_sec, occupancy_band } = data.inbound;
  const leg = data.vehicle?.leg ?? 'inbound';
  const blockId = data.vehicle?.block_id ?? 'block_001';
  const density = DENSITY_CONFIG[occupancy_band] ?? DENSITY_CONFIG.SEATS_AVAILABLE;
  const eventLog: EventLogEntry[] = data.event_log ?? [];
  const recentEvents = [...eventLog].reverse().slice(0, 5);

  const legLabel =
    leg === 'outbound'
      ? 'Completing Route A'
      : leg === 'dwell'
      ? 'Terminal Halt'
      : 'Inbound Leg';

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* 2. Hidden StatusBar for immersive layout */}
      <StatusBar hidden={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Kiosk Header Bar */}
        <View style={styles.header}>
          {/* Brand & Terminal Station */}
          <View style={styles.headerLeftGroup}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Bus size={18} color="#0F172A" />
                <Text style={styles.logoBadgeText}>YARA</Text>
              </View>
              <View style={styles.kioskPill}>
                <Text style={styles.kioskPillText}>KIOSK</Text>
              </View>
            </View>

            <View style={styles.headerDivider} />

            <View style={styles.stationInfo}>
              <View style={styles.stationIconBox}>
                <MapPin size={16} color="#F7A501" />
              </View>
              <View>
                <Text style={styles.stationTitle}>{originName} Terminal</Text>
                <Text style={styles.stationSubtitle}>{agency.shortName} • Platform 2</Text>
              </View>
            </View>
          </View>

          {/* Right Status & Exit Button */}
          <View style={styles.headerRightGroup}>
            {/* Live Clock */}
            <View style={styles.clockPill}>
              <Clock size={15} color="#F7A501" />
              <Text style={styles.clockText}>{timeStr || '12:00:00'}</Text>
            </View>

            {/* Connection Beacon */}
            <View
              style={[
                styles.beaconPill,
                {
                  backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  borderColor: isConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)',
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.beaconDot,
                  {
                    backgroundColor: isConnected ? '#10B981' : '#F59E0B',
                    opacity: pulseAnim,
                  },
                ]}
              />
              <Text
                style={[
                  styles.beaconText,
                  { color: isConnected ? '#34D399' : '#FCD34D' },
                ]}
              >
                {isConnected ? 'LIVE FEED' : 'SIM FEED'}
              </Text>
            </View>

            {/* Exit Button */}
            <TouchableOpacity onPress={handleExit} style={styles.exitBtn} activeOpacity={0.8}>
              <ArrowLeft size={15} color="#F8FAFC" />
              <Text style={styles.exitBtnText}>Exit Kiosk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Kiosk Content Grid */}
        <View style={[styles.mainGrid, isLandscape ? styles.gridRow : styles.gridCol]}>
          {/* Left Column: Giant Live Arrival Countdown Card */}
          <View style={[styles.card, styles.leftColumn]}>
            {/* Card Top: Route Info & Status */}
            <View style={styles.cardHeader}>
              <View style={styles.routeHeaderLeft}>
                <View style={styles.routeCodeBox}>
                  <Text style={styles.routeCodeText}>{routeCode}</Text>
                </View>
                <View style={styles.routeMeta}>
                  <View style={styles.tagRow}>
                    <View style={styles.approachingPill}>
                      <Text style={styles.approachingPillText}>NEXT APPROACHING BUS</Text>
                    </View>
                    <Text style={styles.blockIdText}>GTFS Block: {blockId}</Text>
                  </View>
                  <Text style={styles.destTitle} numberOfLines={1}>
                    To {destName}
                  </Text>
                </View>
              </View>

              <View style={styles.legPill}>
                <Activity size={14} color="#60A5FA" />
                <Text style={styles.legPillText}>{legLabel}</Text>
              </View>
            </View>

            {/* Center: Giant Sunlight-Readable Countdown Timer (~72px) */}
            <View style={styles.countdownWell}>
              <Text style={styles.countdownHeading}>ESTIMATED ARRIVAL AT THIS STOP</Text>
              <Text style={styles.giantTimer}>{formatMMSS(T_total_sec)}</Text>
              <View style={styles.countdownSubRow}>
                <Clock size={14} color="#F7A501" />
                <Text style={styles.countdownSubText}>
                  {Math.ceil(T_total_sec / 60)} min {Math.round(T_total_sec % 60)} sec remaining
                </Text>
              </View>
            </View>

            {/* Compound ETA Breakdown Strip */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownBoxLabel}>Outbound Leg</Text>
                <Text style={styles.breakdownBoxVal}>{formatMMSS(T_outbound_sec)}</Text>
              </View>
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownBoxLabel}>Terminal Halt</Text>
                <Text style={styles.breakdownBoxVal}>{formatMMSS(T_dwell_sec)}</Text>
              </View>
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownBoxLabel}>Inbound Leg</Text>
                <Text style={styles.breakdownBoxVal}>{formatMMSS(T_inbound_sec)}</Text>
              </View>
            </View>

            {/* ETABreakdownBar Full Width */}
            <View style={styles.barContainer}>
              <ETABreakdownBar
                tOut={T_outbound_sec}
                tDwell={T_dwell_sec}
                tIn={T_inbound_sec}
                showLabels={true}
              />
            </View>

            {/* Large Occupancy & Passenger Density Bar (~24px text) */}
            <View style={[styles.densityBox, { backgroundColor: density.bg, borderColor: density.border }]}>
              <View style={styles.densityTopRow}>
                <View style={styles.densityLabelLeft}>
                  <View style={[styles.densityDot, { backgroundColor: density.dotColor }]} />
                  <Text style={[styles.densityTitle, { color: density.text }]}>
                    Passenger Density: {density.label}
                  </Text>
                </View>
                <Text style={[styles.densitySublabel, { color: density.text }]}>
                  {density.sublabel}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.densityTrack}>
                <View
                  style={[
                    styles.densityFill,
                    { width: `${density.barPct}%`, backgroundColor: density.barColor },
                  ]}
                />
              </View>

              {/* Scale marks */}
              <View style={styles.scaleRow}>
                <Text style={styles.scaleText}>Empty</Text>
                <Text style={styles.scaleText}>Seated Capacity (40)</Text>
                <Text style={styles.scaleText}>Standing Limit (55)</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Station Departures Board & Real-Time Event Log */}
          <View style={[styles.card, styles.rightColumn]}>
            {/* Departures Board Header */}
            <View style={styles.boardHeader}>
              <View style={styles.boardHeaderLeft}>
                <View style={styles.radioIconBox}>
                  <Radio size={16} color="#F7A501" />
                </View>
                <View>
                  <Text style={styles.boardTitle}>Station Departures</Text>
                  <Text style={styles.boardSubtitle}>{originName} Terminal</Text>
                </View>
              </View>
              <View style={styles.liveUpdatesBadge}>
                <Text style={styles.liveUpdatesText}>Live Updates</Text>
              </View>
            </View>

            {/* Departures List */}
            <View style={styles.departuresList}>
              {/* 1. Live Approaching Vehicle (Hero Highlight) */}
              <View style={styles.liveApproachCard}>
                <View style={styles.liveApproachLeft}>
                  <View style={styles.liveApproachCodeBox}>
                    <Text style={styles.liveApproachCodeText}>{routeCode}</Text>
                  </View>
                  <View style={styles.liveApproachInfo}>
                    <View style={styles.liveApproachTitleRow}>
                      <Text style={styles.liveApproachDest} numberOfLines={1}>
                        To {destName}
                      </Text>
                      <View style={styles.livePill}>
                        <Text style={styles.livePillText}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.liveApproachSub} numberOfLines={1}>
                      Live Block Chained ({density.label})
                    </Text>
                  </View>
                </View>

                <View style={styles.liveApproachRight}>
                  <Text style={styles.liveApproachTimer}>{formatMMSS(T_total_sec)}</Text>
                  <Text style={styles.liveApproachStatus}>Approaching</Text>
                </View>
              </View>

              {/* 2. Other Scheduled Departures */}
              {SCHEDULED_DEPARTURES.map((item) => (
                <View key={item.code} style={styles.schedCard}>
                  <View style={styles.schedLeft}>
                    <View style={styles.schedCodeBox}>
                      <Text style={styles.schedCodeText}>{item.code}</Text>
                    </View>
                    <View style={styles.schedInfo}>
                      <Text style={styles.schedDest} numberOfLines={1}>
                        {item.dest}
                      </Text>
                      <Text style={styles.schedVia} numberOfLines={1}>
                        {item.via}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.schedRight}>
                    <Text style={styles.schedTime}>{item.time}</Text>
                    <Text style={styles.schedStatus}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Real-time Pipeline Event Log */}
            <View style={styles.eventLogSection}>
              <View style={styles.eventLogHeader}>
                <View style={styles.eventLogHeaderLeft}>
                  <Terminal size={14} color="#10B981" />
                  <Text style={styles.eventLogTitle}>PIPELINE EVENT LOG</Text>
                </View>
                <Text style={styles.eventLogSub}>Cause & Effect</Text>
              </View>

              <View style={styles.eventLogList}>
                {recentEvents.length === 0 ? (
                  <Text style={styles.eventLogEmpty}>Waiting for pipeline telemetry events...</Text>
                ) : (
                  recentEvents.map((evt, idx) => {
                    const isNewest = idx === 0;
                    const deltaMin = Math.round(evt.delta_sec / 60);
                    const isNeg = evt.delta_sec < 0;

                    return (
                      <View
                        key={`${evt.ts}-${idx}`}
                        style={[
                          styles.eventLogRow,
                          isNewest && styles.eventLogRowNewest,
                        ]}
                      >
                        <View style={styles.eventLogContent}>
                          <Text style={styles.eventLogTs}>{evt.ts}</Text>
                          <Text
                            style={[
                              styles.eventLogMsg,
                              isNewest && styles.eventLogMsgNewest,
                            ]}
                            numberOfLines={1}
                          >
                            {evt.event}
                          </Text>
                        </View>
                        {evt.delta_sec !== 0 && (
                          <View
                            style={[
                              styles.deltaPill,
                              {
                                backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                borderColor: isNeg ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.deltaPillText,
                                { color: isNeg ? '#34D399' : '#FB7185' },
                              ]}
                            >
                              {isNeg ? '' : '+'}{deltaMin}m
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Passenger Notice Callout */}
            <View style={styles.noticeCard}>
              <Sparkles size={16} color="#F7A501" />
              <Text style={styles.noticeText}>
                Digital Smart Pass NFC valid on all Deluxe & MTC Express routes.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Information Ticker / Footer Bar */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.footerText}>
              Real-Time Kalman Sensor Fusion Active • Sub-2s Continuous ETA Engine
            </Text>
          </View>
          <Text style={styles.footerRight}>
            Smart India Hackathon 2026 • Yara Public Transit Intelligence Platform
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7A501',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  kioskPill: {
    backgroundColor: 'rgba(247, 165, 1, 0.2)',
    borderColor: '#F7A501',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kioskPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F7A501',
    letterSpacing: 0.8,
  },
  headerDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(247, 165, 1, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(247, 165, 1, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  stationSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clockText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  beaconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  beaconText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // Main Content Grid
  mainGrid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridCol: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    gap: 16,
  },
  leftColumn: {
    flex: 1.15,
    justifyContent: 'space-between',
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Left Card: Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  routeCodeBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F7A501',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCodeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  routeMeta: {
    flex: 1,
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  approachingPill: {
    backgroundColor: 'rgba(247, 165, 1, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approachingPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F7A501',
    letterSpacing: 0.5,
  },
  blockIdText: {
    fontSize: 11,
    fontFamily: MONO,
    fontWeight: '700',
    color: '#94A3B8',
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  legPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  legPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
  },

  // Giant Countdown Well (~72px)
  countdownWell: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countdownHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  giantTimer: {
    fontSize: 72,
    fontFamily: MONO,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -1,
    lineHeight: 80,
  },
  countdownSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownSubText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
  },

  // Breakdown 3-Box Strip
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  breakdownBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  breakdownBoxVal: {
    fontSize: 14,
    fontFamily: MONO,
    fontWeight: '900',
    color: '#F8FAFC',
  },

  // Bar Container
  barContainer: {
    paddingVertical: 2,
  },

  // Density Box (~24px text)
  densityBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  densityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  densityLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  densityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  densityTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  densitySublabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
  densityTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  densityFill: {
    height: '100%',
    borderRadius: 4,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Right Card: Departures Board
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  boardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(247, 165, 1, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(247, 165, 1, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  boardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  liveUpdatesBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveUpdatesText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34D399',
  },

  // Departures List
  departuresList: {
    gap: 8,
  },
  liveApproachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 165, 1, 0.12)',
    borderWidth: 1.5,
    borderColor: '#F7A501',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  liveApproachLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  liveApproachCodeBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F7A501',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveApproachCodeText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  liveApproachInfo: {
    flex: 1,
    gap: 2,
  },
  liveApproachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveApproachDest: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    flexShrink: 1,
  },
  livePill: {
    backgroundColor: '#F7A501',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  livePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F172A',
  },
  liveApproachSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  liveApproachRight: {
    alignItems: 'flex-end',
  },
  liveApproachTimer: {
    fontFamily: MONO,
    fontSize: 17,
    fontWeight: '900',
    color: '#F7A501',
  },
  liveApproachStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },

  schedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  schedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  schedCodeBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schedCodeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  schedInfo: {
    flex: 1,
  },
  schedDest: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  schedVia: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  schedRight: {
    alignItems: 'flex-end',
  },
  schedTime: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '900',
    color: '#CBD5E1',
  },
  schedStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Event Log Section
  eventLogSection: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 8,
  },
  eventLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLogHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLogTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  eventLogSub: {
    fontSize: 10,
    fontFamily: MONO,
    fontWeight: '600',
    color: '#94A3B8',
  },
  eventLogList: {
    gap: 6,
  },
  eventLogEmpty: {
    fontSize: 11,
    fontFamily: MONO,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 8,
  },
  eventLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  eventLogRowNewest: {
    borderColor: 'rgba(247, 165, 1, 0.4)',
    backgroundColor: 'rgba(247, 165, 1, 0.05)',
  },
  eventLogContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eventLogTs: {
    fontSize: 10,
    fontFamily: MONO,
    color: '#94A3B8',
  },
  eventLogMsg: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1,
  },
  eventLogMsgNewest: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  deltaPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  deltaPillText: {
    fontSize: 9,
    fontFamily: MONO,
    fontWeight: '800',
  },

  // Notice Card
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    flexWrap: 'wrap',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footerRight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 480,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
