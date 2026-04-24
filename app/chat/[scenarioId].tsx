import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { router, useLocalSearchParams } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCENARIOS } from '../../constants/Scenarios';
import { useConversationStore } from '../../stores/useConversationStore';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { sendMessage } from '../../services/conversationService';
import { Colors } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../hooks/useTranslation';
import { useVocabStore } from '../../stores/useVocabStore';
import { Message } from '../../types';

export default function ChatScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const colors = useThemeColors();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    currentSession,
    isLoading,
    timeRemainingSeconds,
    startSession,
    addMessage,
    endSession,
    setLoading,
    tickTimer,
  } = useConversationStore();

  const profile = useUserStore((s) => s.profile);
  const addMinutesUsed = useUserStore((s) => s.addMinutesUsed);
  const incrementSessions = useUserStore((s) => s.incrementSessions);
  const recordPracticeDay = useUserStore((s) => s.recordPracticeDay);
  const sessionHistory = useConversationStore((s) => s.sessionHistory);
  const { isPro } = useSubscriptionStore();
  const { isLoaded: adLoaded, isLoading: adLoading, showAd } = useRewardedAd();
  const { saveWord, hasWord } = useVocabStore();

  useEffect(() => {
    if (!scenario) { router.back(); return; }
    startSession(scenario);
    sendInitialMessage(scenario.id, profile?.level ?? 'beginner');
  }, []);

  useEffect(() => {
    if (!currentSession) return;
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
  }, [currentSession, tickTimer]);

  useEffect(() => {
    if (timeRemainingSeconds === 0 && currentSession) handleTimeUp();
  }, [timeRemainingSeconds]);

  async function sendInitialMessage(sid: string, level: string) {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await sendMessage({ messages: [], scenarioId: sid, userLevel: level, isPremium: isPro(), deviceId: profile.deviceId });
      addMessage('assistant', res.content);
    } catch {
      addMessage('assistant', "안녕하세요! 준비됐나요? Let's practice Korean! 😊\n\n💡 피드백:\n- 문법: N/A\n- 자연스러움: N/A");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading || !profile || !currentSession) return;

    if (currentSession.turnsUsed >= Config.maxSessionTurns) {
      Alert.alert(t.chat.sessionComplete, t.chat.sessionCompleteMsg, [
        { text: t.chat.sessionCompleteBtn, onPress: handleEndSession },
      ]);
      return;
    }

    setInputText('');
    addMessage('user', text);
    setLoading(true);

    try {
      const messages = currentSession.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      messages.push({ role: 'user', content: text });
      const res = await sendMessage({ messages, scenarioId: currentSession.scenario.id, userLevel: profile.level, isPremium: isPro(), deviceId: profile.deviceId });
      addMessage('assistant', res.content);
    } catch {
      addMessage('assistant', t.errors.apiError);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function handleTimeUp() {
    type AlertButton = { text: string; style?: 'destructive' | 'cancel' | 'default'; onPress?: () => void };
    const buttons: AlertButton[] = [
      { text: t.chat.endSession, style: 'destructive', onPress: handleEndSession },
      { text: t.chat.watchAdBtn(adLoaded), onPress: handleWatchAd },
    ];
    if (!isPro()) buttons.push({ text: t.chat.goPro, onPress: () => router.push('/paywall') });
    Alert.alert(t.chat.timeUp, t.chat.timeUpMsg, buttons);
  }

  async function handleWatchAd() {
    if (!adLoaded) {
      Alert.alert(adLoading ? t.chat.adLoadingTitle : t.rewarded.noAd, adLoading ? t.chat.adLoadingMsg : '');
      return;
    }
    const shown = await showAd();
    if (!shown) Alert.alert(t.errors.adNotReady);
  }

  async function handleEndSession() {
    const minutesUsed = Math.ceil((Date.now() - (currentSession?.startedAt ?? Date.now())) / 60000);
    addMinutesUsed(minutesUsed);
    incrementSessions();
    recordPracticeDay();
    endSession();

    const completedCount = sessionHistory.length + 1;
    if ([3, 10, 30].includes(completedCount) && await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
    router.back();
  }

  if (!scenario) return null;

  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const isTimeWarning = timeRemainingSeconds < 60 && timeRemainingSeconds > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndSession} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>{t.chat.endSession}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{scenario.emoji}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{scenario.titleEn}</Text>
        </View>
        <View style={[styles.timerChip, isTimeWarning && styles.timerChipWarning]}>
          <Text style={[styles.timerText, isTimeWarning && styles.timerTextWarning]}>
            {timeDisplay}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={currentSession?.messages ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            colors={colors}
            feedbackLabel={t.chat.feedbackLabel}
            onLongPress={item.role === 'assistant' ? () => {
              const korean = item.content.split('\n')[0].trim();
              if (hasWord(korean)) { Alert.alert('이미 저장된 표현이에요!'); return; }
              saveWord(korean, '', scenarioId ?? '');
              Alert.alert('단어장에 저장됐어요! 📖');
            } : undefined}
          />
        )}
        ListFooterComponent={isLoading ? <TypingIndicator colors={colors} /> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t.chat.placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, colors, feedbackLabel, onLongPress }: {
  message: Message; colors: ThemeColors; feedbackLabel: string; onLongPress?: () => void;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';
  const parts = message.content.split('💡 피드백:');
  const mainText = parts[0].trim();
  const feedbackText = parts[1]?.trim();

  const handleSpeak = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(mainText, {
      language: 'ko-KR',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [isSpeaking, mainText]);

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isUser && <Text style={styles.avatar}>👩‍🏫</Text>}
      <View style={styles.bubbleColumn}>
        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={onLongPress ? 0.75 : 1}
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
        >
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
            {mainText}
          </Text>
        </TouchableOpacity>
        {!isUser && (
          <TouchableOpacity style={styles.ttsButton} onPress={handleSpeak} activeOpacity={0.7}>
            <Text style={[styles.ttsIcon, isSpeaking && styles.ttsIconActive]}>
              {isSpeaking ? '■' : '▶'}
            </Text>
            <Text style={[styles.ttsLabel, isSpeaking && styles.ttsLabelActive]}>
              {isSpeaking ? '정지' : '듣기'}
            </Text>
          </TouchableOpacity>
        )}
        {feedbackText && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>{feedbackLabel}</Text>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: ThemeColors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.typingWrapper}>
      <Text style={styles.avatar}>👩‍🏫</Text>
      <View style={styles.typingBubble}>
        <Text style={styles.typingDot}>●</Text>
        <Text style={[styles.typingDot, { opacity: 0.5 }]}>●</Text>
        <Text style={[styles.typingDot, { opacity: 0.25 }]}>●</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingRight: 6,
    },
    backArrow: { fontSize: 24, color: Colors.primary, lineHeight: 28 },
    backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerEmoji: { fontSize: 18 },
    headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, letterSpacing: -0.2 },
    timerChip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    timerChipWarning: { backgroundColor: 'rgba(232,50,90,0.12)', borderColor: 'rgba(232,50,90,0.30)' },
    timerText: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
    timerTextWarning: { color: Colors.primary },

    messageList: { paddingHorizontal: 16, paddingVertical: 20, gap: 14 },

    bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    bubbleRight: { justifyContent: 'flex-end' },
    bubbleLeft: { justifyContent: 'flex-start' },
    avatar: { fontSize: 26, marginBottom: 2 },
    bubbleColumn: { flex: 1, maxWidth: '82%' },

    bubble: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleUser: {
      backgroundColor: Colors.primary,
      borderBottomRightRadius: 6,
      alignSelf: 'flex-end',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    bubbleAssistant: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: { fontSize: 15, lineHeight: 22 },
    bubbleTextUser: { color: '#FFFFFF', fontWeight: '500' },
    bubbleTextAssistant: { color: colors.text },

    feedbackCard: {
      marginTop: 6,
      backgroundColor: colors.feedbackBg,
      borderRadius: 14,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: Colors.gold,
    },
    feedbackTitle: { fontSize: 11, fontWeight: '700', color: Colors.gold, marginBottom: 4, letterSpacing: 0.5 },
    feedbackText: { fontSize: 13, color: colors.feedbackText, lineHeight: 18 },

    ttsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ttsIcon: { fontSize: 9, color: colors.textSecondary },
    ttsIconActive: { color: Colors.primary },
    ttsLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 },
    ttsLabelActive: { color: Colors.primary },

    typingWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 4 },
    typingBubble: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 5,
      alignItems: 'center',
    },
    typingDot: { fontSize: 8, color: colors.textSecondary },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: 10,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 11,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      letterSpacing: -0.1,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    sendButtonDisabled: { opacity: 0.35, shadowOpacity: 0 },
    sendText: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
  });
}
