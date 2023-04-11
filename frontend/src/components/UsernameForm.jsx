import { useEffect, useState } from "react";
import { Button, ButtonGroup, FormControl, Input } from "@chakra-ui/react";

const UsernameForm = ({ ws }) => {
  const [username, setUsername] = useState("");
  const [isStalking, setIsStalking] = useState(false);

  useEffect(() => {
    const messageHandler = (event) => {
      const { topic } = JSON.parse(event.data);
      if (topic == "stalkDone") {
        setIsStalking(false);
      }
    };
    ws.addEventListener("message", messageHandler);

    return () => {
      ws.removeEventListener("message", messageHandler);
    };
  });

  const handleUsernameChange = (event) => {
    const value = event.target.value;
    setUsername(value);
  };

  const handleStalk = () => {
    setIsStalking(true);
    const message = {
      topic: "stalk",
      obj: {
        username: username,
      },
    };
    ws.send(JSON.stringify(message));
  };

  const handleStalkCancel = () => {
    ws.send(JSON.stringify({ topic: "cancelStalk" }));
    setIsStalking(false);
  };

  return (
    <FormControl>
      <Input
        type="text"
        placeholder="Please specify target username"
        onChange={handleUsernameChange}
      />
      <br />
      <br />
      <ButtonGroup>
        <Button
          variant="solid"
          size="md"
          colorScheme="facebook"
          isDisabled={username.length > 0 ? false : true}
          isLoading={isStalking ? true : false}
          loadingText="Stalking"
          onClick={handleStalk}
        >
          Stalk
        </Button>
        <Button
          variant="outline"
          size="md"
          colorScheme="facebook"
          isDisabled={isStalking > 0 ? false : true}
          onClick={handleStalkCancel}
        >
          Cancel
        </Button>
      </ButtonGroup>
    </FormControl>
  );
};

export default UsernameForm;
