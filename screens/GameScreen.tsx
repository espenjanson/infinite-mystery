import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Box from "../components/Box";
import CaseImage from "../components/CaseImage";
import GameInput from "../components/GameInput";
import MessageBubble from "../components/MessageBubble";
import Text from "../components/Text";
import { API_CONFIG, validateApiKeys } from "../config/api";
import audioService from "../services/audioService";
import claudeService from "../services/claude";
import gameManager from "../services/gameManager";
import { GameSession } from "../types/mystery";

const GameScreen: React.FC = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [caseGenerating, setCaseGenerating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [gameStats, setGameStats] = useState({
    hintsRemaining: 2,
    questionsAsked: 0,
  });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeGame();

    // Cleanup audio when component unmounts
    return () => {
      audioService.cleanup();
    };
  }, []);

  const initializeGame = async () => {
    try {
      // Validate API keys
      const validation = validateApiKeys();
      if (!validation.isValid) {
        Alert.alert(
          "API Keys Missing",
          "Please set your Claude API key in the environment variables.\n\n" +
            validation.errors.join("\n"),
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      // Initialize Claude service
      claudeService.initialize(API_CONFIG.claude.apiKey);

      // Initialize and start background audio
      await audioService.initializeAudio();
      await audioService.playBackgroundMusic();

      // Set loading states
      setCaseGenerating(true);
      setImageGenerating(true);

      // Start new game with callbacks
      const newSession = await gameManager.startNewGame(
        "medium",
        () => {
          // Case generated callback
          setCaseGenerating(false);
        },
        () => {
          // Image generated callback
          setImageGenerating(false);
        }
      );

      setSession(newSession);
      setGameStats(gameManager.getGameStats());
      setIsInitialized(true);
      setCaseGenerating(false); // Ensure it's false in case callback wasn't called
      setImageGenerating(false); // Ensure it's false in case callback wasn't called

      // Don't scroll on initial load - the first message should be at the top
    } catch (error) {
      console.error("Error initializing game:", error);
      Alert.alert("Error", "Failed to start new game. Please try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session || isLoading) return;

    setIsLoading(true);

    try {
      // First scroll immediately when user sends message
      setTimeout(() => scrollToBottom(), 50);

      const result = await gameManager.processPlayerInput(message);

      // Update session with new messages
      const updatedSession = gameManager.getCurrentSession();
      if (updatedSession) {
        setSession({ ...updatedSession });
        setGameStats(gameManager.getGameStats());
      }

      // Scroll again after state update to ensure player message is visible
      setTimeout(() => scrollToBottom(), 100);

      // Handle game over
      if (result.isGameOver) {
        setTimeout(() => {
          Alert.alert(
            result.isSolved ? "🎉 Case Solved!" : "❌ Wrong Accusation",
            result.isSolved
              ? `Congratulations! You solved the mystery.\nScore: ${result.score} points`
              : `You accused the wrong person.\nScore: 0 points\n\nYou only get one chance at justice.`,
            [{ text: "OK" }]
          );
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      Alert.alert("Error", "Failed to process your message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (!session || isLoading) return;

    setIsLoading(true);

    try {
      const hintMessage = await gameManager.requestHint();

      if (hintMessage) {
        const updatedSession = gameManager.getCurrentSession();
        if (updatedSession) {
          setSession({ ...updatedSession });
          setGameStats(gameManager.getGameStats());
        }

        setTimeout(() => scrollToBottom(), 100);
      } else {
        Alert.alert(
          "No Hints Available",
          "You have used all your hints for this case."
        );
      }
    } catch (error) {
      console.error("Error requesting hint:", error);
      Alert.alert("Error", "Failed to get hint. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiveUp = () => {
    Alert.alert(
      "Give Up?",
      "Are you sure you want to give up? This will reveal the solution but you won't get any points.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Give Up",
          style: "destructive",
          onPress: async () => {
            if (!session) return;

            setIsLoading(true);
            try {
              const revealMessage = await gameManager.giveUp();

              const updatedSession = gameManager.getCurrentSession();
              if (updatedSession) {
                setSession({ ...updatedSession });
              }

              setTimeout(() => scrollToBottom(), 100);
            } catch (error) {
              console.error("Error giving up:", error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setIsAtBottom(true);
    setShowScrollButton(false);
    console.log("Manual scroll to bottom - hiding button");
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottomNow =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setIsAtBottom(isAtBottomNow);
    setShowScrollButton(!isAtBottomNow);
  };

  const handleTypewriterComplete = () => {
    // Auto-scroll when AI message is complete
    setTimeout(() => scrollToBottom(), 100);
    
    // If this was the opening message, add suggestions
    if (session && session.conversation.length === 1) {
      const suggestionsMessage = {
        id: Date.now().toString(),
        type: 'narrator' as const,
        message: `💡 **Suggestions to get started:**\n\n` +
                 `• **Examine the crime scene** - Look for evidence and clues\n` +
                 `• **Talk to the coroner** - Learn about the cause of death and time of death\n` +
                 `• **Check the victim's belongings** - Search for personal items that might reveal connections\n\n` +
                 `You can also interview witnesses, search specific areas, or follow your own investigative instincts.`,
        timestamp: new Date(),
      };
      
      // Add suggestions to conversation
      const updatedSession = {
        ...session,
        conversation: [...session.conversation, suggestionsMessage]
      };
      setSession(updatedSession);
      
      // Scroll again after suggestions appear
      setTimeout(() => scrollToBottom(), 200);
    }
  };

  const handleTextUpdate = () => {
    // Auto-scroll during typing if user is at bottom
    if (isAtBottom) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  };

  const handleStartNewGame = () => {
    Alert.alert(
      "Start New Case?",
      "This will end your current investigation. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "New Case",
          onPress: async () => {
            setSession(null);
            setIsInitialized(false);
            // Restart music for new case
            await audioService.playBackgroundMusic();
            initializeGame();
          },
        },
      ]
    );
  };

  if (!isInitialized || !session) {
    return (
      <Box
        flex={1}
        backgroundColor="mainBackground"
        justifyContent="center"
        alignItems="center"
        padding="l"
      >
        <Text
          variant="title"
          color="accentText"
          marginBottom="xl"
          textAlign="center"
        >
          PREPARING CASE FILES
        </Text>

        {/* Case Generation Status */}
        <Box
          flexDirection="row"
          alignItems="center"
          marginBottom="l"
          opacity={caseGenerating ? 1 : 0.5}
        >
          <Box marginRight="m">
            {caseGenerating ? (
              <ActivityIndicator size="small" color="#B22222" />
            ) : (
              <Box
                width={20}
                height={20}
                justifyContent="center"
                alignItems="center"
              >
                <Text color="accent" fontSize={16}>
                  ✓
                </Text>
              </Box>
            )}
          </Box>
          <Box>
            <Text variant="body" color="primaryText">
              Generating Mystery Case
            </Text>
            <Text variant="caption" color="secondaryText">
              {caseGenerating
                ? "Claude is crafting your story..."
                : "Case ready"}
            </Text>
          </Box>
        </Box>

        {/* Image Generation Status */}
        <Box
          flexDirection="row"
          alignItems="center"
          marginBottom="l"
          opacity={imageGenerating ? 1 : 0.5}
        >
          <Box marginRight="m">
            {imageGenerating ? (
              <ActivityIndicator size="small" color="#B22222" />
            ) : (
              <Box
                width={20}
                height={20}
                justifyContent="center"
                alignItems="center"
              >
                <Text color="accent" fontSize={16}>
                  ✓
                </Text>
              </Box>
            )}
          </Box>
          <Box>
            <Text variant="body" color="primaryText">
              Creating Case Illustration
            </Text>
            <Text variant="caption" color="secondaryText">
              {imageGenerating
                ? "Generating noir atmosphere..."
                : "Illustration complete"}
            </Text>
          </Box>
        </Box>

        <Box marginTop="xl">
          <Text
            variant="caption"
            color="secondaryText"
            textAlign="center"
            opacity={0.7}
          >
            This may take a moment...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      {/* Header */}

      {/* Conversation */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: 8,
          paddingTop: insets.top ?? 16,
          paddingBottom: insets.bottom ?? 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Box padding="m" borderBottomWidth={1} borderColor="border">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box flex={1}>
              <Text
                variant="title"
                fontSize={16}
                color="accentText"
                lineHeight={24}
              >
                {session.script.title}
              </Text>
              <Text variant="caption" color="secondaryText">
                Case #{session.id.slice(-8).toUpperCase()}
              </Text>
            </Box>
          </Box>

          {/* Case Illustration */}
          <CaseImage
            imageUrl={session.caseImageUrl}
            title={session.script.title}
          />
        </Box>
        {session.conversation.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            onTypewriterComplete={
              index === session.conversation.length - 1
                ? handleTypewriterComplete
                : undefined
            }
            onTextUpdate={
              index === session.conversation.length - 1 &&
              message.type !== "player"
                ? handleTextUpdate
                : undefined
            }
          />
        ))}

        {isLoading && (
          <Box alignItems="center" padding="m">
            <Text variant="caption" color="secondaryText">
              Detective is thinking...
            </Text>
          </Box>
        )}
      </ScrollView>

      {/* Input */}
      <GameInput
        onSend={handleSendMessage}
        onRequestHint={handleRequestHint}
        onGiveUp={handleGiveUp}
        isLoading={isLoading}
        hintsRemaining={gameStats.hintsRemaining}
        questionsAsked={gameStats.questionsAsked}
        isGameOver={session.isSolved || session.completedAt !== undefined}
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
      />
    </Box>
  );
};

export default GameScreen;
