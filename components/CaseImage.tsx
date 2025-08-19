import { useTheme } from "@shopify/restyle";
import React, { useState } from "react";
import { ActivityIndicator, Image } from "react-native";
import { Theme } from "../theme";
import Box from "./Box";
import Text from "./Text";

interface CaseImageProps {
  imageUrl?: string;
  title: string;
}

const CaseImage: React.FC<CaseImageProps> = ({ imageUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const theme = useTheme<Theme>();

  if (!imageUrl) {
    return null;
  }

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Box
      marginVertical="m"
      borderRadius="m"
      overflow="hidden"
      backgroundColor="cardPrimaryBackground"
      position="relative"
    >
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          backgroundColor="cardPrimaryBackground"
          zIndex={1}
          height={200}
        >
          <ActivityIndicator color={theme.colors.accent} size="large" />
          <Text
            variant="caption"
            color="secondaryText"
            marginTop="m"
            textAlign="center"
          >
            Generating case illustration...
          </Text>
        </Box>
      )}

      {hasError ? (
        <Box
          padding="l"
          justifyContent="center"
          alignItems="center"
          backgroundColor="cardSecondaryBackground"
          height={200}
        >
          <Text variant="caption" color="secondaryText" textAlign="center">
            Unable to load case illustration
          </Text>
        </Box>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: 200,
            resizeMode: "cover",
          }}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
    </Box>
  );
};

export default CaseImage;
