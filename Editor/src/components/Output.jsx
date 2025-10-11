import { useState } from "react";
import {
  Box,
  Button,
  Text,
  useToast,
  Select,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { executeCode } from "../api";
import { PREDEFINED_FUNCTIONS } from "../predefinedFunctions";
import { TEST_POSITIONS, DEFAULT_TEST_POSITION } from "../testPositions";
import { getTestCode, validateBotCode } from "../chessBridge";

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(
    DEFAULT_TEST_POSITION
  );

  const testBot = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    // Validate bot code first
    const validation = validateBotCode(sourceCode);
    if (!validation.isValid) {
      setOutput(validation.error.split("\n"));
      setIsError(true);
      toast({
        title: "Validation Error",
        description: "Your bot code is missing the required getMove() function",
        status: "error",
        duration: 6000,
      });
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);

      // Generate complete test code with mock board
      const completeCode = getTestCode(
        sourceCode,
        selectedPosition.fen,
        PREDEFINED_FUNCTIONS
      );

      // Execute via Piston API
      const { run: result } = await executeCode(language, completeCode);

      // Display output
      const outputLines = result.output.split("\n");
      setOutput(outputLines);

      // Check if there was an error
      if (result.stderr) {
        setIsError(true);
      }
    } catch (error) {
      console.log(error);
      setIsError(true);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to test bot",
        status: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="50%">
      <VStack align="stretch" spacing={4}>
        <Box>
          <Text mb={2} fontSize="lg" fontWeight="bold">
            Bot Testing
          </Text>

          <Text mb={2} fontSize="sm" color="gray.400">
            Test Position:
          </Text>
          <Select
            value={selectedPosition.id}
            onChange={(e) => {
              const position = TEST_POSITIONS.find(
                (p) => p.id === e.target.value
              );
              setSelectedPosition(position);
            }}
            mb={2}
            bg="#110c1b"
            borderColor="#333"
          >
            {TEST_POSITIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </Select>

          <Text fontSize="xs" color="gray.500" mb={4}>
            {selectedPosition.description}
          </Text>

          <HStack spacing={2}>
            <Button
              variant="solid"
              colorScheme="blue"
              isLoading={isLoading}
              onClick={testBot}
              flex={1}
            >
              Test Bot
            </Button>
          </HStack>
        </Box>

        <Box>
          <Text mb={2} fontSize="lg" fontWeight="bold">
            Output
          </Text>
          <Box
            height="58vh"
            p={4}
            color={isError ? "red.400" : ""}
            bg="#0a0810"
            border="1px solid"
            borderRadius={4}
            borderColor={isError ? "red.500" : "#333"}
            overflowY="auto"
            fontFamily="monospace"
            fontSize="sm"
          >
            {output ? (
              output.map((line, i) => <Text key={i}>{line}</Text>)
            ) : (
              <Text color="gray.500">
                Select a test position and click "Test Bot" to see your bot's
                move
              </Text>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};
export default Output;
