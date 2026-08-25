import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Sparkles,
  Compass,
  ArrowRight,
  Tv,
  Terminal,
  Clock,
  Cpu,
  Users,
  Zap,
  Activity,
  Radio,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import {
  TransitSnapshot,
  colors,
  spacing,
  typography,
  ETABreakdownBar,
  BLOCK_ID,
} from '@yara/shared';
import { useTransitContext } from '../context/TransitContext';
import { ScreenNavigationProp } from '../navigation/types';
import { YaraAnimatedLogo } from '../components/YaraAnimatedLogo';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

function formatMMSS(sec: number): string {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const DENSITY_BADGE: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  SEATS_AVAILABLE: {
    label: 'Seats Available',
    bg: '#F0FDF4',
    text: '#166534',
    dot: '#22C55E',
    border: '#BBF7D0',
  },
  MODERATE: {
    label: 'Moderate Crowd',
    bg: '#FFFBEB',
    text: '#92400E',
    dot: '#EAB308',
    border: '#FDE68A',
  },
  STANDING_ROOM: {
    label: 'Almost Full',
    bg: '#FFF7ED',
    text: '#9A3412',
    dot: '#F97316',
    border: '#FED7AA',
  },
  VERY_CROWDED: {
    label: 'Overcrowded',
    bg: '#FFF1F2',
    text: '#9F1239',
    dot: '#EF4444',
    border: '#FECDD3',
  },
};

const DEFAULT_SNAPSHOT: TransitSnapshot = {
  ts: Math.floor(Date.now() / 1000),
  vehicle: {
    lat: 13.0302,
    lon: 80.1806,
    leg: 'outbound',
    progress: 0.45,
    source: 'gnss',
    trip_id: 'trip_outbound_1',
    block_id: BLOCK_ID,
  },
  outbound: {
    T_outbound_sec: 420,
  },
  inbound: {
    trip_id: 'trip_inbound_1',
    T_total_sec: 720,
    T_outbound_sec: 420,
    T_dwell_sec: 180,
    T_inbound_sec: 120,
    occupancy_band: 'SEATS_AVAILABLE',
  },
  event_log: [
    {
      ts: '12:00:00',
      event: `System initialized - ${BLOCK_ID} active`,
      delta_sec: 0,
    },
  ],
};

export const OverviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const { data, isConnected } = useTransitContext();

  const snapshot = data ?? DEFAULT_SNAPSHOT;
  const { T_total_sec, T_outbound_sec, T_dwell_sec, T_inbound_sec, occupancy_band } = snapshot.inbound;
  const density = DENSITY_BADGE[occupancy_band] ?? DENSITY_BADGE.SEATS_AVAILABLE;

  // Pulse animation for live feed indicator
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0.8);

  React.useEffect(() => {
    if (isConnected) {
      pingScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(0.9, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pingScale.value = 1;
      pingOpacity.value = 0.8;
    }
  }, [isConnected]);

  const animatedPingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: pingOpacity.value,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero Showcase Section ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(450).springify()}
          style={styles.heroCard}
        >
          {/* Background Gradient Accents */}
          <View style={styles.glowTopRight} />
          <View style={styles.glowBottomLeft} />

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={styles.hackathonBadge}>
              <Sparkles size={12} color="#B45309" />
              <Text style={styles.hackathonBadgeText}>Smart India Hackathon 2026</Text>
            </View>

            <View
              style={[
                styles.liveBadge,
                isConnected ? styles.liveBadgeConnected : styles.liveBadgeSimulated,
              ]}
            >
              <View style={styles.dotContainer}>
                {isConnected && (
                  <Animated.View style={[styles.pingDot, animatedPingStyle]} />
                )}
                <View
                  style={[
                    styles.solidDot,
                    { backgroundColor: isConnected ? '#22C55E' : '#F59E0B' },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.liveBadgeText,
                  { color: isConnected ? '#166534' : '#92400E' },
                ]}
              >
                {isConnected ? '1Hz Live Pipeline' : 'Simulated Feed'}
              </Text>
            </View>
          </View>

          {/* Logo Hero & Heading */}
          <View style={styles.heroBrandSection}>
            <YaraAnimatedLogo height={52} width={230} animate={true} />
            <Text style={styles.heroTitle}>Continuous Public Transit Intelligence</Text>
            <Text style={styles.heroSubtitle}>
              Watch a bus disappear from{' '}
              <Text style={styles.heroBold}>Route A</Text> and instantly project a live, shrinking countdown on{' '}
              <Text style={styles.heroBold}>Route B</Text> before it even arrives — powered by pure-Python Kalman
              sensor fusion, dwell delay recovery, and WiFi passenger density sensing.
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.heroActions}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              onPress={() => navigation.navigate('LiveMap')}
              accessibilityRole="button"
              accessibilityLabel="Launch Commuter Map"
            >
              <Compass size={18} color="#020617" />
              <Text style={styles.btnPrimaryText}>Launch Commuter Map</Text>
              <ArrowRight size={16} color="#020617" />
            </Pressable>

            <View style={styles.heroSecondaryActions}>
              <Pressable
                style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                onPress={() => navigation.navigate('Kiosk')}
                accessibilityRole="button"
                accessibilityLabel="Stop Kiosk Screen"
              >
                <Tv size={16} color="#B17816" />
                <Text style={styles.btnSecondaryText}>Stop Kiosk Screen</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.btnDark, pressed && styles.btnPressed]}
                onPress={() => navigation.navigate('Admin')}
                accessibilityRole="button"
                accessibilityLabel="Judge Control Panel"
              >
                <Terminal size={16} color="#FBBF24" />
                <Text style={styles.btnDarkText}>Judge Control Panel</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── 2. Live Telemetry HUD Section ───────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(450).springify()}
          style={styles.hudCard}
        >
          {/* Header Row */}
          <View style={styles.hudHeader}>
            <View style={styles.hudHeaderLeft}>
              <View style={styles.routePill}>
                <Text style={styles.routePillText}>S26</Text>
              </View>
              <View>
                <Text style={styles.hudAssetTitle}>Active Asset: Bus #1</Text>
                <Text style={styles.hudGtfsCode}>GTFS: {snapshot.vehicle.block_id}</Text>
              </View>
            </View>

            <View
              style={[
                styles.densityPill,
                { backgroundColor: density.bg, borderColor: density.border },
              ]}
            >
              <View style={[styles.densityDot, { backgroundColor: density.dot }]} />
              <Text style={[styles.densityText, { color: density.text }]}>{density.label}</Text>
            </View>
          </View>

          {/* Giant Countdown Preview */}
          <View style={styles.countdownBox}>
            <Text style={styles.countdownTitle}>LIVE COMPOUND ETA COUNTDOWN</Text>
            <Text style={styles.countdownTimer}>{formatMMSS(T_total_sec)}</Text>
            <Text style={styles.countdownFormula}>
              T_outbound ({formatMMSS(T_outbound_sec)}) + T_dwell ({formatMMSS(T_dwell_sec)}) + T_inbound ({formatMMSS(T_inbound_sec)})
            </Text>
            <View style={styles.etaBarContainer}>
              <ETABreakdownBar
                tOut={T_outbound_sec}
                tDwell={T_dwell_sec}
                tIn={T_inbound_sec}
                showLabels={true}
              />
            </View>
          </View>

          {/* Micro Sensor Status Pills */}
          <View style={styles.sensorGrid}>
            <View style={styles.sensorCard}>
              <View style={styles.sensorIconEmerald}>
                <ShieldCheck size={16} color="#16A34A" />
              </View>
              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>Kalman Filter</Text>
                <Text style={styles.sensorDesc}>Covariance 0.04m²</Text>
              </View>
            </View>

            <View style={styles.sensorCard}>
              <View style={styles.sensorIconAmber}>
                <Users size={16} color="#D97706" />
              </View>
              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>WiFi MAC Probe</Text>
                <Text style={styles.sensorDesc}>Rolling Window</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 3. Pipeline Status 3 Cards (SIM / KAL / ETA) ────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(450).springify()}
          style={styles.pipelineCard}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconBox}>
                <Layers size={18} color="#B17816" />
              </View>
              <View>
                <Text style={styles.sectionHeading}>Live Pipeline Architecture</Text>
                <Text style={styles.sectionSubheading}>MQTT Broker & FastSSE Stream Flow</Text>
              </View>
            </View>
            <View style={styles.latencyPill}>
              <Text style={styles.latencyPillText}>&lt; 2.0s Latency</Text>
            </View>
          </View>

          {/* 3 Main Backend Channels Grid */}
          <View style={styles.pipelineGrid}>
            {/* CH-1 Simulator */}
            <View style={styles.pipelineChannelAmber}>
              <View style={styles.channelHeader}>
                <View style={styles.channelBadgeAmber}>
                  <Text style={styles.channelBadgeTextDark}>CH-1 :8001</Text>
                </View>
                <Activity size={15} color="#B45309" />
              </View>
              <Text style={styles.channelTitle}>Simulator Engine</Text>
              <Text style={styles.channelDesc}>1Hz vehicle physics & REST injection API</Text>
              <View style={styles.channelStatusRow}>
                <View
                  style={[
                    styles.channelStatusDot,
                    { backgroundColor: isConnected ? '#22C55E' : '#F59E0B' },
                  ]}
                />
                <Text style={styles.channelStatusText}>
                  {isConnected ? 'Live Simulation' : 'Standby / Local'}
                </Text>
              </View>
            </View>

            {/* CH-2 Kalman Fusion */}
            <View style={styles.pipelineChannelPurple}>
              <View style={styles.channelHeader}>
                <View style={styles.channelBadgePurple}>
                  <Text style={styles.channelBadgeTextPurple}>CH-2</Text>
                </View>
                <Cpu size={15} color="#7E22CE" />
              </View>
              <Text style={styles.channelTitle}>Kalman Fusion</Text>
              <Text style={styles.channelDesc}>Covariance noise filter & dead-reckoning</Text>
              <View style={styles.channelStatusRow}>
                <View
                  style={[
                    styles.channelStatusDot,
                    { backgroundColor: isConnected ? '#22C55E' : '#A855F7' },
                  ]}
                />
                <Text style={styles.channelStatusText}>
                  {isConnected ? '4D Filter Active' : 'Calculative Mode'}
                </Text>
              </View>
            </View>

            {/* CH-3 ETA & Density */}
            <View style={styles.pipelineChannelEmerald}>
              <View style={styles.channelHeader}>
                <View style={styles.channelBadgeEmerald}>
                  <Text style={styles.channelBadgeTextEmerald}>CH-3 :8002</Text>
                </View>
                <Radio size={15} color="#15803D" />
              </View>
              <Text style={styles.channelTitle}>ETA & Density Engine</Text>
              <Text style={styles.channelDesc}>Compounding ETA & live FastSSE stream</Text>
              <View style={styles.channelStatusRow}>
                <View
                  style={[
                    styles.channelStatusDot,
                    { backgroundColor: isConnected ? '#22C55E' : '#EF4444' },
                  ]}
                />
                <Text style={styles.channelStatusText}>
                  {isConnected ? 'FastSSE Stream 1Hz' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 4. Four Technological Pillars 2x2 Grid ─────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(450).springify()}
          style={styles.pillarsSection}
        >
          <View style={styles.sectionHeaderSimple}>
            <Text style={styles.sectionHeadingLarge}>Four Technological Pillars</Text>
            <Text style={styles.sectionSubheadingLarge}>
              Engineered specifically for Indian public transit challenges
            </Text>
          </View>

          <View style={styles.pillarsGrid}>
            {/* Pillar 1: Compounding ETA */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarIconAmber}>
                <Clock size={20} color="#B45309" />
              </View>
              <Text style={styles.pillarTitle}>Compounding Block ETA</Text>
              <Text style={styles.pillarDesc}>
                Projects downstream arrival times across linked block trips before the bus even leaves its previous leg, automatically absorbing dwell buffer.
              </Text>
              <View style={styles.pillarFooter}>
                <Text style={styles.pillarTagAmber}>Dynamic Dwell Recovery</Text>
              </View>
            </View>

            {/* Pillar 2: Kalman Fusion */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarIconPurple}>
                <Cpu size={20} color="#7E22CE" />
              </View>
              <Text style={styles.pillarTitle}>Kalman Fusion Engine</Text>
              <Text style={styles.pillarDesc}>
                Pure-Python 4D tracker fuses GNSS coordinates with cell triangulation (R_cell = 1000 * R_gnss) for smooth dead-reckoning during dropouts.
              </Text>
              <View style={styles.pillarFooter}>
                <Text style={styles.pillarTagPurple}>Zero-Jitter Trajectory</Text>
              </View>
            </View>

            {/* Pillar 3: Density Sensing */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarIconEmerald}>
                <Users size={20} color="#15803D" />
              </View>
              <Text style={styles.pillarTitle}>Passenger Density Sensing</Text>
              <Text style={styles.pillarDesc}>
                Passive ESP32 WiFi probe sniffing rolling probe frames maps directly into 4 clear occupancy tiers without invading passenger privacy.
              </Text>
              <View style={styles.pillarFooter}>
                <Text style={styles.pillarTagEmerald}>4 Privacy-First Bands</Text>
              </View>
            </View>

            {/* Pillar 4: Sub-2s Causality */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarIconRose}>
                <Zap size={20} color="#BE123C" />
              </View>
              <Text style={styles.pillarTitle}>Sub-2s Event Causality</Text>
              <Text style={styles.pillarDesc}>
                End-to-end pipeline latency from injected traffic delays or crowd surges to visible kiosk countdown changes stays strictly under 2 seconds.
              </Text>
              <View style={styles.pillarFooter}>
                <Text style={styles.pillarTagRose}>Ultra-Low Latency SSE</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 5. Interactive Platform Portals ────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(450).springify()}
          style={styles.portalsSection}
        >
          <View style={styles.sectionHeaderSimple}>
            <Text style={styles.sectionHeadingLarge}>Interactive Portals</Text>
            <Text style={styles.sectionSubheadingLarge}>
              Explore all dedicated views in the Yara transit platform
            </Text>
          </View>

          <View style={styles.portalsList}>
            {/* Portal 1: Commuter Map App */}
            <Pressable
              style={({ pressed }) => [styles.portalCard, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('LiveMap')}
              accessibilityRole="button"
              accessibilityLabel="Open Passenger View"
            >
              <View style={styles.portalCardTop}>
                <View style={styles.portalIconAmber}>
                  <Compass size={22} color="#B45309" />
                </View>
                <View style={styles.portalContent}>
                  <Text style={styles.portalTitle}>Live Commuter Transit App</Text>
                  <Text style={styles.portalDesc}>
                    Consumer transit map featuring live vehicle radar, nearest bus stops, walking directions, and route timelines.
                  </Text>
                </View>
              </View>
              <View style={styles.portalFooter}>
                <Text style={styles.portalActionTextAmber}>Open Passenger View</Text>
                <View style={styles.portalArrowAmber}>
                  <ChevronRight size={16} color="#B45309" />
                </View>
              </View>
            </Pressable>

            {/* Portal 2: Bus Stop Kiosk */}
            <Pressable
              style={({ pressed }) => [styles.portalCard, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('Kiosk')}
              accessibilityRole="button"
              accessibilityLabel="Launch Kiosk Display"
            >
              <View style={styles.portalCardTop}>
                <View style={styles.portalIconBlue}>
                  <Tv size={22} color="#1D4ED8" />
                </View>
                <View style={styles.portalContent}>
                  <Text style={styles.portalTitle}>Bus Stop Kiosk Display</Text>
                  <Text style={styles.portalDesc}>
                    High-contrast digital departure board with giant countdowns, 3-leg ETA breakdown, and platform timetable.
                  </Text>
                </View>
              </View>
              <View style={styles.portalFooter}>
                <Text style={styles.portalActionTextBlue}>Launch Kiosk Display</Text>
                <View style={styles.portalArrowBlue}>
                  <ChevronRight size={16} color="#1D4ED8" />
                </View>
              </View>
            </Pressable>

            {/* Portal 3: Judge Injection Panel */}
            <Pressable
              style={({ pressed }) => [styles.portalCard, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('Admin')}
              accessibilityRole="button"
              accessibilityLabel="Open Admin Panel"
            >
              <View style={styles.portalCardTop}>
                <View style={styles.portalIconRose}>
                  <Terminal size={22} color="#BE123C" />
                </View>
                <View style={styles.portalContent}>
                  <Text style={styles.portalTitle}>Judge Injection & Control</Text>
                  <Text style={styles.portalDesc}>
                    Live demonstration cockpit to trigger artificial delay minutes, GNSS dropouts, and passenger surges with real-time causality.
                  </Text>
                </View>
              </View>
              <View style={styles.portalFooter}>
                <Text style={styles.portalActionTextRose}>Open Admin Panel</Text>
                <View style={styles.portalArrowRose}>
                  <ChevronRight size={16} color="#BE123C" />
                </View>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 6. Hackathon Demo Blurb Banner ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(360).duration(450).springify()}
          style={styles.blurbCard}
        >
          <View style={styles.blurbHeader}>
            <View style={styles.blurbBadge}>
              <CheckCircle2 size={14} color="#B45309" />
              <Text style={styles.blurbBadgeText}>SIH 2026 Problem Statement</Text>
            </View>
            <Text style={styles.blurbTitle}>Continuous Block Resolution</Text>
          </View>
          <Text style={styles.blurbBody}>
            In Indian public transit, unpredictable choke-point delays and terminal dwell times cause severe bus
            bunching and misleading ETA predictions. Yara provides true compounding ETA continuity across entire
            vehicle blocks.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },

  /* ── Hero Showcase Section ────────────────────────────── */
  heroCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    boxShadow: '0px 3px 8px rgba(15, 23, 42, 0.05)',
    overflow: 'hidden',
    gap: 16,
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(254, 240, 138, 0.35)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(191, 219, 254, 0.25)',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  hackathonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  hackathonBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#78350F',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
    borderWidth: 1,
  },
  liveBadgeConnected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  liveBadgeSimulated: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  dotContainer: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#86EFAC',
  },
  solidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroBrandSection: {
    gap: 10,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 21,
  },
  heroBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  heroActions: {
    gap: 10,
    marginTop: 4,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F7A501',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    boxShadow: '0px 3px 6px rgba(245, 158, 11, 0.25)',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#020617',
  },
  heroSecondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  btnDark: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  btnDarkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  /* ── 2. Live Telemetry HUD Card ───────────────────────── */
  hudCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  hudHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routePill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F7A501',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
  },
  routePillText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#020617',
  },
  hudAssetTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  hudGtfsCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: MONO,
  },
  densityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  densityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  densityText: {
    fontSize: 11,
    fontWeight: '900',
  },
  countdownBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    gap: 4,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.03)',
  },
  countdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  countdownTimer: {
    fontSize: 48,
    fontWeight: '900',
    fontFamily: MONO,
    color: '#0F172A',
    letterSpacing: -1,
    marginVertical: 2,
  },
  countdownFormula: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    textAlign: 'center',
  },
  etaBarContainer: {
    width: '100%',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sensorGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sensorCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  sensorIconEmerald: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIconAmber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  sensorDesc: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },

  /* ── 3. Pipeline Status Section ────────────────────────── */
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.03)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(247, 165, 1, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubheading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  latencyPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  latencyPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#166534',
  },
  pipelineGrid: {
    gap: 10,
  },
  pipelineChannelAmber: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    gap: 4,
  },
  pipelineChannelPurple: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    gap: 4,
  },
  pipelineChannelEmerald: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    gap: 4,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelBadgeAmber: {
    backgroundColor: '#F7A501',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelBadgePurple: {
    backgroundColor: '#E9D5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelBadgeEmerald: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelBadgeTextDark: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#020617',
  },
  channelBadgeTextPurple: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#581C87',
  },
  channelBadgeTextEmerald: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#14532D',
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  channelDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  channelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  channelStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  channelStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  /* ── 4. Four Technological Pillars ────────────────────── */
  pillarsSection: {
    gap: 12,
  },
  sectionHeaderSimple: {
    gap: 2,
  },
  sectionHeadingLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubheadingLarge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pillarsGrid: {
    gap: 10,
  },
  pillarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.02)',
  },
  pillarIconAmber: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconPurple: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconEmerald: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconRose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  pillarDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 18,
  },
  pillarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  pillarTagAmber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  pillarTagPurple: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
  pillarTagEmerald: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  pillarTagRose: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },

  /* ── 5. Interactive Portals ────────────────────────────── */
  portalsSection: {
    gap: 12,
  },
  portalsList: {
    gap: 12,
  },
  portalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.03)',
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    borderColor: '#F59E0B',
  },
  portalCardTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  portalIconAmber: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalIconRose: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalContent: {
    flex: 1,
    gap: 4,
  },
  portalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  portalDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 17,
  },
  portalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  portalActionTextAmber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  portalArrowAmber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalActionTextBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  portalArrowBlue: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalActionTextRose: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BE123C',
  },
  portalArrowRose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── 6. Hackathon Demo Blurb Banner ────────────────────── */
  blurbCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    gap: 8,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.10)',
  },
  blurbHeader: {
    gap: 6,
  },
  blurbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  blurbBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FDE68A',
  },
  blurbTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  blurbBody: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 18,
  },
});

