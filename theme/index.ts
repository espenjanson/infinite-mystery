import { createTheme } from '@shopify/restyle';

const palette = {
  black: '#0A0A0A',
  white: '#F5F5F5',
  noirRed: '#B22222',  // Brighter red (Firebrick)
  
  // Additional shades for depth
  shadowBlack: '#000000',
  offWhite: '#FAFAFA',
  darkRed: '#8B0000',
  lightRed: '#DC143C',
  
  // Grays for film noir atmosphere
  charcoal: '#1A1A1A',
  smoke: '#404040',
  ash: '#808080',
  fog: '#B0B0B0',
  mist: '#D0D0D0',
};

const theme = createTheme({
  colors: {
    mainBackground: palette.black,
    mainForeground: palette.white,
    accent: palette.noirRed,
    
    cardPrimaryBackground: palette.charcoal,
    cardSecondaryBackground: palette.smoke,
    
    primaryText: palette.white,
    secondaryText: palette.fog,
    accentText: palette.noirRed,
    
    border: palette.smoke,
    borderLight: palette.ash,
    
    shadow: palette.shadowBlack,
    overlay: palette.charcoal,
    transparent: 'transparent',
    
    danger: palette.noirRed,
    success: palette.white,
    warning: palette.lightRed,
  },
  
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadii: {
    none: 0,
    s: 4,
    m: 8,
    l: 16,
    xl: 24,
    round: 999,
  },
  
  textVariants: {
    defaults: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: 'primaryText',
    },
    
    hero: {
      fontFamily: 'CourierPrime-Bold',
      fontSize: 48,
      lineHeight: 56,
      color: 'primaryText',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    
    title: {
      fontFamily: 'CourierPrime-Bold',
      fontSize: 32,
      lineHeight: 40,
      color: 'primaryText',
      letterSpacing: 1,
    },
    
    subtitle: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 24,
      lineHeight: 32,
      color: 'primaryText',
    },
    
    body: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: 'primaryText',
    },
    
    bodySecondary: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: 'secondaryText',
    },
    
    caption: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'secondaryText',
    },
    
    accent: {
      fontFamily: 'CourierPrime-Bold',
      fontSize: 18,
      lineHeight: 26,
      color: 'accentText',
      letterSpacing: 0.5,
    },
    
    typewriter: {
      fontFamily: 'CourierPrime-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'primaryText',
      letterSpacing: -0.5,
    },
  },
  
  cardVariants: {
    defaults: {
      padding: 'm',
      borderRadius: 'm',
    },
    primary: {
      backgroundColor: 'cardPrimaryBackground',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      shadowColor: 'shadow',
      elevation: 5,
    },
    secondary: {
      backgroundColor: 'cardSecondaryBackground',
      borderWidth: 1,
      borderColor: 'border',
    },
    outline: {
      borderWidth: 2,
      borderColor: 'border',
      backgroundColor: 'mainBackground',
    },
  },
});

export type Theme = typeof theme;
export default theme;