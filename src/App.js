import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import DictionaryGame from './components/DictionaryGame';

function App() {
  return (
    <ChakraProvider>
      <DictionaryGame />
    </ChakraProvider>
  );
}

export default App;