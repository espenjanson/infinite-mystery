import React from 'react';
import Box from '../components/Box';
import Text from '../components/Text';

const InterrogationScreen: React.FC = () => {
  return (
    <Box flex={1} backgroundColor="mainBackground" padding="l">
      <Text variant="title">Interrogation Room</Text>
      <Text variant="body" marginTop="m">
        Question suspects and witnesses here.
      </Text>
    </Box>
  );
};

export default InterrogationScreen;