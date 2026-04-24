import { useState, useEffect, useRef, useCallback } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCENARIOS } from '../../constants/Scenarios';
import { useConversationStore } from '../../stores/useConversationStore';
import { useUserStore } from '../../stores/useUserStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { sendMessage } from '../../services/conversationService';
import { Colors } from '../../constants/Colors';
import { Strings } from '../../constants/Strings';
import { Config } from '../../constants/Config';
import { Message } from '../../types';

export default function ChatScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  const {
    currentSession,
    isLoading,
    timeRemainingSeconds,
    startSession,
    addMessage,
    endSession,
    setLoading,
    tickTimer,
    clearSession,
  } = useConversationStore();

  const profile = useUserStore((s) => s.profile);
  const addMinutesUsed = useUserStore((s) => s.addMinutesUsed);
  const incrementSessions = useUserStore((s) => s.incrementSessions);
  const { isPro } = useSubscriptionStore();
  const { isLoaded: adLoaded, isLoading: adLoading, showAd } = useRewardedAd();

  // Start session on mount
  useEffect(() => {
    if (!scenario) {
      router.back();
      return;
    }
    startSession(scenario);
    sendInitialMessage(scenario.id, profile?.level ?? 'beginner');
  }, []);

  // Timer tick
  useEffect(() => {
    if (!currentSession) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession, tickTimer]);

  // Handle time up
  useEffect(() => {
    if (timeRemainingSeconds === 0 && currentSession) {
      handleTimeUp();
    }
  }, [timeRemainingSeconds]);

  async function sendInitialMessage(sid: string, level: string) {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await sendMessage({
        messages: [],
        scenarioId: sid,
        userLevel: level,
        isPremium: isPro(),
        deviceId: profile.deviceId,
      });
      addMessage('assistant', res.content);
    } catch {
      addMessage('assistant', '안녕하세요! 준비됐나요? Let\'s practice Korean! 😊\n\n💡 피드백:\n- 문법: N/A\n- 자연스러움: N/A');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading || !profile || !currentSession) return;

    if (currentSession.turnsUsed >= Config.maxSessionTurns) {
      Alert.alert('Session Complete', 'Great practice! Starting a new session will reset the conversation.', [
        { text: 'End Session', onPress: handleEndSession },
      ]);
      return;
    }

    setInputText('');
    addMessage('user', text);
    setLoading(true);

    try {
      const messages = currentSession.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      messages.push({ role: 'user', content: text });

      const res = await sendMessage({
        messages,
        scenarioId: currentSession.scenario.id,
        userLevel: profile.level,
        isPremium: isPro(),
        deviceId: profile.deviceId,
      });
      addMessage('assistant', res.content);
    } catch (error) {
      addMessage('assistant', Strings.errors.apiError);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function handleTimeUp() {
    type AlertButton = { text: string; style?: 'destructive' | 'cancel' | 'default'; onPress?: () => void };
    const buttons: AlertButton[] = [
      { text: 'End Session', style: 'destructive', onPress: handleEndSession },
      { text: adLoaded ? '+ 5 min (Watch Ad)' : 'Loading ad...', onPress: handleWatchAd },
    ];
    if (!isPro()) {
      buttons.push({ text: 'Go Pro', onPress: () => router.push('/paywall') });
    }
    Alert.alert(Strings.chat.timeUp, 'Watch an ad for 5 more minutes or upgrade to Pro.', buttons);
  }

  async function handleWatchAd() {
    if (!adLoaded) {
      Alert.alert(
        adLoading ? 'Loading Ad...' : Strings.rewarded.noAd,
        adLoading ? 'Please wait a moment.' : ''
      );
      return;
    }
    // showAd()가 완료되면 useRewardedAd 내부에서 addTime + addAdWatched 자동 호출
    const shown = await showAd();
    if (!shown) {
      Alert.alert(Strings.errors.adNotReady);
    }
  }

  function handleEndSession() {
    const minutesUsed = Math.ceil((Date.now() - (currentSession?.startedAt ?? Date.now())) / 60000);
    addMinutesUsed(minutesUsed);
    incrementSessions();
    endSession();
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
        <TouchableOpacity onPress={handleEndSession} style={styles.backButton}>
          <Text style={styles.backText}>← End</Text>
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

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={currentSession?.messages ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={Strings.chat.placeholder}
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  // Split assistant message into response + feedback
  const parts = message.content.split('💡 피드백:');
  const mainText = parts[0].trim();
  const feedbackText = parts[1]?.trim();

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isUser && <Text style={styles.avatar}>👩‍🏫</Text>}
      <View style={styles.bubbleColumn}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
            {mainText}
          </Text>
        </View>
        {feedbackText && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>💡 피드백</Text>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingWrapper}>
      <Text style={styles.avatar}>👩‍🏫</Text>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>•••</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: { paddingRight: 12 },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerEmoji: { fontSize: 20 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  timerChip: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerChipWarning: { backgroundColor: '#FEF2F2' },
  timerText: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  timerTextWarning: { color: Colors.error },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  avatar: { fontSize: 28 },
  bubbleColumn: { flex: 1, maxWidth: '85%' },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleAssistant: {
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: Colors.light.text },
  feedbackCard: {
    marginTop: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  feedbackText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  typingWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
  },
  typingBubble: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingText: { fontSize: 20, color: Colors.light.textSecondary, letterSpacing: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.light.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
});
