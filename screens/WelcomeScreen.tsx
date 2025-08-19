import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import Box from '../components/Box';
import Text from '../components/Text';
import Button from '../components/Button';

const { height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const typewriterAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(typewriterAnim, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center" padding="l">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Box alignItems="center" marginBottom="xxl">
          <Text variant="hero" textAlign="center" marginBottom="s">
            INFINITE
          </Text>
          <Text variant="hero" textAlign="center" color="accentText">
            MYSTERY
          </Text>
        </Box>
        
        <Box alignItems="center" marginBottom="xl">
          <Text variant="subtitle" textAlign="center" color="secondaryText" marginBottom="m">
            A NOIR DETECTIVE STORY
          </Text>
          <Box width={100} height={1} backgroundColor="accent" marginVertical="m" />
          <Text variant="typewriter" textAlign="center" color="secondaryText" paddingHorizontal="l">
            Every case is unique.{'\n'}
            Every mystery runs deep.{'\n'}
            Every choice matters.
          </Text>
        </Box>
      </Animated.View>
      
      <Animated.View
        style={{
          opacity: typewriterAnim,
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
        }}
      >
        <Box alignItems="center">
          <Button
            label="Begin Investigation"
            variant="primary"
            size="large"
            onPress={onStart}
          />
        </Box>
        
        <Box marginTop="m" alignItems="center">
          <Text variant="caption" color="secondaryText">
            Powered by AI-Generated Mysteries
          </Text>
        </Box>
      </Animated.View>
    </Box>
  );
};

export default WelcomeScreen;