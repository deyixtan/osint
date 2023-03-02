import { ChakraProvider } from "@chakra-ui/react";
import MainPage from "./pages/MainPage";

const App = () => {
  return (
    <ChakraProvider>
      <MainPage />
    </ChakraProvider>
  );
};

export default App;
