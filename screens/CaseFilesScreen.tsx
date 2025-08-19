import React from 'react';
import Box from '../components/Box';
import Text from '../components/Text';

const CaseFilesScreen: React.FC = () => {
  return (
    <Box flex={1} backgroundColor="mainBackground" padding="l">
      <Text variant="title">Case Files</Text>
      <Text variant="body" marginTop="m">
        Evidence and clues will be displayed here.
      </Text>
    </Box>
  );
};

export default CaseFilesScreen;