import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'CourierPrime-Regular': require('../assets/fonts/CourierPrime-Regular.ttf'),
    'CourierPrime-Bold': require('../assets/fonts/CourierPrime-Bold.ttf'),
    'CourierPrime-Italic': require('../assets/fonts/CourierPrime-Italic.ttf'),
    'CourierPrime-BoldItalic': require('../assets/fonts/CourierPrime-BoldItalic.ttf'),
  });
};