import React, { useEffect, useState } from 'react';
import { Stack } from "expo-router";
import { ThemeProvider } from '@shopify/restyle';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import theme from '../theme';
import { loadFonts } from '../utils/fonts';
import audioService from '../services/audioService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadFonts();
        setFontsLoaded(true);
        // Initialize and start background music
        await audioService.initializeAudio();
        await audioService.playBackgroundMusic();
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.mainBackground,
          },
        }}
      />
    </ThemeProvider>
  );
}
