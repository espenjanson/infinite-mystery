import React, { useState, useEffect, useRef } from "react";
import { ConversationEntry } from "../types/mystery";
import Box from "./Box";
import Text from "./Text";

interface MessageBubbleProps {
  message: ConversationEntry;
  onTypewriterComplete?: () => void;
  onTextUpdate?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onTypewriterComplete, onTextUpdate }) => {
  const isPlayer = message.type === "player";
  const isCharacter = message.type === "character";
  const isNarrator = message.type === "narrator";
  
  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState(isPlayer ? message.message : "");
  const [isTyping, setIsTyping] = useState(!isPlayer);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasTypedRef = useRef(false);
  const isSuggestions = message.message.includes('**Suggestions to get started:**');
  
  useEffect(() => {
    if (isPlayer || isSuggestions) {
      // Player messages and suggestions appear immediately
      setDisplayedText(message.message);
      setIsTyping(false);
      hasTypedRef.current = true;
      return;
    }
    
    // Only start typewriter effect if we haven't typed this message before
    if (hasTypedRef.current) {
      setDisplayedText(message.message);
      setIsTyping(false);
      return;
    }
    
    // AI messages use typewriter effect (except suggestions)
    setDisplayedText("");
    setIsTyping(true);
    
    const words = message.message.split(" ");
    let currentIndex = 0;
    
    const typeNextWord = () => {
      if (currentIndex < words.length) {
        const word = words[currentIndex];
        if (word !== undefined) {
          setDisplayedText(prev => {
            const newText = currentIndex === 0 ? word : prev + " " + word;
            return newText;
          });
          // Trigger scroll update as text is being typed
          if (onTextUpdate) {
            setTimeout(onTextUpdate, 10);
          }
        }
        currentIndex++;
        typewriterTimeoutRef.current = setTimeout(typeNextWord, 100) as unknown as NodeJS.Timeout; // Adjust speed here
      } else {
        setIsTyping(false);
        hasTypedRef.current = true;
        if (onTypewriterComplete) {
          onTypewriterComplete();
        }
      }
    };
    
    // Start typing after a small delay
    typewriterTimeoutRef.current = setTimeout(typeNextWord, 300) as unknown as NodeJS.Timeout;
    
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, [message.id]); // Only depend on message.id, not the full message or callback

  const getBubbleStyle = () => {
    if (isPlayer) {
      return {
        alignSelf: "flex-end" as const,
        borderTopRightRadius: "s" as const,
      };
    } else {
      return {
        alignSelf: "flex-start" as const,
        borderTopLeftRadius: "s" as const,
      };
    }
  };

  const getTextColor = () => {
    if (isPlayer) return "primaryText" as const;
    if (isCharacter) return "accentText" as const;
    return "primaryText" as const;
  };

  const getSpeakerText = () => {
    if (isPlayer) return "You";
    if (isCharacter && message.speaker) return message.speaker;
    return "Narrator";
  };

  return (
    <Box
      marginVertical="m"
      paddingHorizontal="m"
      {...getBubbleStyle()}
      style={{ maxWidth: isPlayer ? "80%" : "90%" }}
    >
      <Box borderRadius="m">
        {/* Speaker label */}
        <Text
          variant="caption"
          color="secondaryText"
          marginBottom="xs"
          fontFamily="CourierPrime-Bold"
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {getSpeakerText()}
        </Text>

        {/* Message content */}
        {displayedText.includes('**Suggestions to get started:**') ? (
          <Box>
            {displayedText.split('\n').map((line, index) => {
              if (line.includes('**Suggestions to get started:**')) {
                return (
                  <Text key={index} variant="body" color="accentText" fontFamily="CourierPrime-Bold" marginBottom="s">
                    💡 Suggestions to get started:
                  </Text>
                );
              } else if (line.startsWith('•')) {
                const parts = line.split(' - ');
                const action = parts[0].replace('•', '').replace(/\*\*/g, '').trim();
                const description = parts[1] || '';
                return (
                  <Box key={index} marginBottom="xs">
                    <Text variant="body" color={getTextColor()} fontFamily="CourierPrime-Bold">
                      • {action}
                    </Text>
                    {description && (
                      <Text variant="caption" color="secondaryText" marginLeft="m">
                        {description}
                      </Text>
                    )}
                  </Box>
                );
              } else if (line.trim()) {
                return (
                  <Text key={index} variant="caption" color="secondaryText" marginTop="s">
                    {line}
                  </Text>
                );
              }
              return null;
            })}
            {isTyping && <Text color={getTextColor()}>|</Text>}
          </Box>
        ) : (
          <Text variant="body" color={getTextColor()} lineHeight={22}>
            {displayedText}
            {isTyping && <Text color={getTextColor()}>|</Text>}
          </Text>
        )}

        {/* Timestamp */}
        <Text
          variant="caption"
          color="secondaryText"
          marginTop="xs"
          fontSize={11}
          opacity={0.7}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

      </Box>
    </Box>
  );
};

export default MessageBubble;
