import { useEffect } from "react";
import { useToast, Box } from "@chakra-ui/react";
import StalkOutput from "../components/StalkOutput";
import UsernameForm from "../components/UsernameForm";

const MainPage = () => {
  const toast = useToast();
  const ws = new WebSocket("ws://127.0.0.1:8000/");

  useEffect(() => {
    const messageHandler = (event) => {
      const { topic } = JSON.parse(event.data);

      if (topic == "stalkDone") {
        toast({
          title: "Success",
          description: "Stalk Completed.",
          status: "success",
          isClosable: true,
        });
      } else if (topic == "stalkCancelled") {
        toast({
          title: "Info",
          description: "Stalk Cancelled.",
          status: "info",
          isClosable: true,
        });
      }
    };

    ws.addEventListener("message", messageHandler);

    return () => {
      ws.removeEventListener("message", messageHandler);
    };
  }, []);

  return (
    <Box px="2" m={2}>
      <UsernameForm ws={ws} />
      <StalkOutput ws={ws} />
    </Box>
  );
};

export default MainPage;
