import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import WelcomeScreen from '../screens/WelcomeScreen';
import Box from '../components/Box';

export default function Index() {
  const router = useRouter();
  
  const handleStart = () => {
    router.push('/game');
  };
  
  return (
    <Box flex={1}>
      <WelcomeScreen onStart={handleStart} />
    </Box>
  );
}
