import { useRef, useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { CODE_SNIPPETS } from "../constants";
import { registerCompletionProvider } from "../monacoConfig";
import Output from "./Output";

const CodeEditor = () => {
  const editorRef = useRef();
  const [value, setValue] = useState("");
  const language = "python";

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    // Register autocomplete for predefined functions
    registerCompletionProvider(monaco);
  };

  return (
    <Box>
      <HStack spacing={4}>
        <Box w="50%">
          <Editor
            options={{
              minimap: {
                enabled: false,
                quickSuggestions: true,
              },
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
        <Output editorRef={editorRef} language={language} />
      </HStack>
    </Box>
  );
};
export default CodeEditor;
