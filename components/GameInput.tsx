import { useTheme } from "@shopify/restyle";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Theme } from "../theme";
import Box from "./Box";
import Button from "./Button";
import Text from "./Text";

interface GameInputProps {
  onSend: (message: string) => void;
  onRequestHint: () => void;
  onGiveUp: () => void;
  isLoading?: boolean;
  hintsRemaining: number;
  questionsAsked: number;
  isGameOver?: boolean;
  showScrollButton: boolean;
  scrollToBottom: () => void;
}

const GameInput: React.FC<GameInputProps> = ({
  onSend,
  onRequestHint,
  onGiveUp,
  isLoading = false,
  hintsRemaining,
  questionsAsked,
  isGameOver = false,
  showScrollButton,
  scrollToBottom,
}) => {
  const [input, setInput] = useState("");
  const theme = useTheme<Theme>();

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleHint = () => {
    if (hintsRemaining > 0 && !isLoading) {
      onRequestHint();
    }
  };

  if (isGameOver) {
    return (
      <Box
        backgroundColor="cardPrimaryBackground"
        padding="m"
        borderTopWidth={1}
        borderColor="border"
      >
        <Box alignItems="center">
          <Button
            label="Start New Case"
            variant="primary"
            size="large"
            onPress={() => {
              /* Navigate to new game */
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Box
        backgroundColor="cardPrimaryBackground"
        padding="m"
        borderTopWidth={1}
        borderColor="border"
      >
        {/* Game stats */}
        <Box
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="s"
          paddingHorizontal="s"
        >
          <Box flexDirection="row" alignItems="center">
            <Box
              width={6}
              height={6}
              borderRadius="round"
              backgroundColor="accent"
              marginRight="xs"
            />
            <Box>
              <Text variant="caption" color="secondaryText" fontSize={10}>
                Questions: {questionsAsked}
              </Text>
            </Box>
          </Box>

          <Box flexDirection="row" alignItems="center">
            <Box
              width={6}
              height={6}
              borderRadius="round"
              backgroundColor={hintsRemaining > 0 ? "accent" : "secondaryText"}
              marginRight="xs"
            />
            <Box>
              <Text variant="caption" color="secondaryText" fontSize={10}>
                Hints: {hintsRemaining}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Action buttons */}
        <Box flexDirection="row" gap="s" marginBottom="m">
          <Button
            label={`Hint (${hintsRemaining})`}
            variant="secondary"
            size="small"
            onPress={handleHint}
            disabled={hintsRemaining === 0 || isLoading}
          />

          <Button
            label="Give Up"
            variant="ghost"
            size="small"
            onPress={onGiveUp}
            disabled={isLoading}
          />
        </Box>

        {/* Input area */}
        <Box flexDirection="row" gap="s" alignItems="flex-end">
          <Box flex={1}>
            <TextInput
              style={{
                backgroundColor: theme.colors.mainBackground,
                color: theme.colors.primaryText,
                fontFamily: "CourierPrime-Regular",
                fontSize: 16,
                padding: theme.spacing.m,
                borderRadius: theme.borderRadii.m,
                borderWidth: 1,
                borderColor: theme.colors.border,
                maxHeight: 100,
                minHeight: 44,
              }}
              value={input}
              onChangeText={setInput}
              placeholder="What would you like to do, detective?"
              placeholderTextColor={theme.colors.secondaryText}
              multiline
              textAlignVertical="top"
              editable={!isLoading}
            />
          </Box>

          <Button
            label={isLoading ? "..." : "Send"}
            variant="primary"
            size="medium"
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
          />
        </Box>
        {/* Floating scroll to bottom button */}
        {showScrollButton && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{
              position: "absolute",
              top: -76,
              alignSelf: "center",

              elevation: 5,
              zIndex: 1000,
            }}
          >
            <TouchableOpacity
              onPress={scrollToBottom}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <Box
                style={{
                  backgroundColor: "white",
                  borderRadius: 30,
                  width: 60,
                  height: 60,
                }}
                alignItems="center"
                justifyContent="center"
              >
                <Text style={{ color: "black" }} fontSize={24}>
                  ↓
                </Text>
              </Box>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Box>
    </KeyboardAvoidingView>
  );
};

export default GameInput;
