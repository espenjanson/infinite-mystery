import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme';
import Box from './Box';
import Text from './Text';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  loading = false,
  size = 'medium',
  disabled,
  ...props
}) => {
  const theme = useTheme<Theme>();
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return 'mainForeground';
      case 'secondary':
        return 'cardPrimaryBackground';
      case 'accent':
        return 'accent';
      case 'ghost':
        return 'transparent';
      default:
        return 'mainForeground';
    }
  };
  
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return 'mainBackground';
      case 'secondary':
        return 'primaryText';
      case 'accent':
        return 'primaryText';
      case 'ghost':
        return 'primaryText';
      default:
        return 'mainBackground';
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 's' as const, paddingVertical: 'xs' as const };
      case 'medium':
        return { paddingHorizontal: 'm' as const, paddingVertical: 's' as const };
      case 'large':
        return { paddingHorizontal: 'l' as const, paddingVertical: 'm' as const };
      default:
        return { paddingHorizontal: 'm' as const, paddingVertical: 's' as const };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <Box
        backgroundColor={getBackgroundColor() as any}
        borderRadius="m"
        {...getPadding()}
        borderWidth={variant === 'ghost' ? 1 : 0}
        borderColor={variant === 'ghost' ? 'border' : undefined}
        opacity={disabled ? 0.5 : 1}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors[getTextColor() as keyof typeof theme.colors] as string} size="small" />
        ) : (
          <Text
            color={getTextColor() as any}
            fontSize={getFontSize()}
            fontFamily="CourierPrime-Bold"
            letterSpacing={0.5}
            textTransform="uppercase"
          >
            {label}
          </Text>
        )}
      </Box>
    </TouchableOpacity>
  );
};

export default Button;