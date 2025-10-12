import { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  useToast,
  Select,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Editor } from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { CODE_SNIPPETS } from '../utils/constants';
import { PREDEFINED_FUNCTIONS } from '../utils/predefinedFunctions';
import { getTestCode, validateBotCode } from '../utils/chessBridge';
import { TEST_POSITIONS, DEFAULT_TEST_POSITION } from '../utils/testPositions';
import { executeCode, createModel, updateModel } from '../services/api';
import { initPyodide, isPyodideReady } from '../services/pyodideService';

function ModelEditor({ onModelSaved, onCancel, existingModel, isEditing }) {
  const { user } = useAuth();
  const editorRef = useRef();
  const toast = useToast();

  const [value, setValue] = useState('');
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(DEFAULT_TEST_POSITION);
  const [modelName, setModelName] = useState('');

  // Still need saving state for tracking API calls
  const [isSaving, setIsSaving] = useState(false);

  // Pyodide loading state
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [pyodideError, setPyodideError] = useState(null);

  const language = 'python';

  // Pre-initialize Pyodide when component mounts
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setPyodideLoading(true);
        await initPyodide();
        setPyodideLoading(false);
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        setPyodideError('Failed to load Python environment. Please refresh the page.');
        setPyodideLoading(false);
      }
    };

    loadPyodide();
  }, []);

  // Load existing model code if we're editing
  useEffect(() => {
    if (existingModel) {
      setValue(existingModel.model); // The model code is stored in the 'model' field
      setModelName(existingModel.name);
    }
  }, [existingModel]);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const testBot = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    // Validate bot code first
    const validation = validateBotCode(sourceCode);
    if (!validation.isValid) {
      setOutput(validation.error.split('\n'));
      setIsError(true);
      toast({
        title: 'Validation Error',
        description: "Your bot code is missing the required getMove() function",
        status: 'error',
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
      const outputLines = result.output.split('\n');
      setOutput(outputLines);

      // Check if there was an error
      if (result.stderr) {
        setIsError(true);
      }
    } catch (error) {
      console.log(error);
      setIsError(true);
      toast({
        title: 'An error occurred.',
        description: error.message || 'Unable to test bot',
        status: 'error',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) {
      toast({
        title: 'No code to save',
        description: 'Please write some code first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate bot code
    const validation = validateBotCode(sourceCode);
    if (!validation.isValid) {
      toast({
        title: 'Invalid bot code',
        description: validation.error,
        status: 'error',
        duration: 6000,
      });
      return;
    }

    // If editing an existing model, use its name, otherwise prompt for a name
    let name = modelName;
    if (!existingModel) {
      name = window.prompt('Enter a name for your model:');
    }

    if (name) {
      handleSaveModel(name);
    }
  };

  const handleSaveModel = async (name) => {
    if (!name || !name.trim()) {
      toast({
        title: 'Model name required',
        description: 'Please enter a name for your model',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const sourceCode = editorRef.current.getValue();
    const trimmedName = name.trim();

    try {
      setIsSaving(true);

      if (existingModel) {
        // Update existing model
        await updateModel(existingModel.id, {
          name: trimmedName,
          model: sourceCode,  // Changed from modelCode to model to match the backend
        });

        toast({
          title: 'Model updated!',
          description: `Your model "${trimmedName}" has been updated successfully`,
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new model
        await createModel({
          user_id: user.id,
          name: trimmedName,
          model: sourceCode,
        });

        toast({
          title: 'Model saved!',
          description: `Your model "${trimmedName}" has been created successfully`,
          status: 'success',
          duration: 3000,
        });
      }

      setTimeout(() => {
        onModelSaved();
      }, 500);
    } catch (error) {
      toast({
        title: existingModel ? 'Update failed' : 'Save failed',
        description: error.response?.data?.error || `Failed to ${existingModel ? 'update' : 'save'} model`,
        status: 'error',
        duration: 6000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
      <VStack align="stretch" spacing={4} mb={4}>
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            {existingModel ? `Edit Model: ${existingModel.name}` : 'Create Your Chess AI Model'}
          </Text>
          <HStack>
            <Button colorScheme="green" onClick={handleSaveClick} isLoading={isSaving}>
              {existingModel ? 'Update Model' : 'Save Model'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </HStack>
        </HStack>
        <Text fontSize="sm" color="gray.400">
          Write your chess bot by implementing the getMove() function. Test it with different positions before saving.
        </Text>

        {/* Pyodide Loading/Error States */}
        {pyodideLoading && (
          <Alert status="info" bg="#181818" borderColor="#333" border="1px solid">
            <Spinner size="sm" mr={3} />
            <Text color="white">Loading Python environment (first time may take 10-15 seconds)...</Text>
          </Alert>
        )}
        {pyodideError && (
          <Alert status="error">
            <AlertIcon />
            {pyodideError}
          </Alert>
        )}
      </VStack>

      <HStack spacing={4} align="start">
        <Box w="50%">
          <Editor
            options={{
              minimap: {
                enabled: false,
              },
              quickSuggestions: true,
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            defaultValue={CODE_SNIPPETS[language]}
            onMount={onMount}
            value={value}
            onChange={(value) => setValue(value)}
          />
        </Box>

        <Box w="50%">
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text mb={2} fontSize="lg" fontWeight="bold" color="white">
                Bot Testing
              </Text>

              <Text mb={2} fontSize="sm" color="gray.400">
                Test Position:
              </Text>
              <Select
                mb={2}
                value={selectedPosition.id}
                onChange={(e) => {
                  const position = TEST_POSITIONS.find(
                    (p) => p.id === e.target.value
                  );
                  setSelectedPosition(position);
                }}
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

              <Button
                colorScheme="blue"
                isLoading={isLoading}
                onClick={testBot}
                width="100%"
                isDisabled={pyodideLoading}
              >
                {pyodideLoading ? 'Loading Python...' : 'Test Bot'}
              </Button>
            </Box>

            <Box>
              <Text mb={2} fontSize="lg" fontWeight="bold" color="white">
                Output
              </Text>
              <Box
                height="58vh"
                p={4}
                color={isError ? 'red.400' : 'gray.300'}
                bg="#0a0810"
                border="1px solid"
                borderRadius={4}
                borderColor={isError ? 'red.500' : '#333'}
                overflowY="auto"
                fontFamily="monospace"
                fontSize="sm"
              >
                {output ? (
                  output.map((line, i) => <Text key={i}>{line}</Text>)
                ) : (
                  <Text color="gray.500">
                    Select a test position and click "Test Bot" to see your bot's move
                  </Text>
                )}
              </Box>
            </Box>
          </VStack>
        </Box>
      </HStack>

    </Box>
  );
}

export default ModelEditor;
