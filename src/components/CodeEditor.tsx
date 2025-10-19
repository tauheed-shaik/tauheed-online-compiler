import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LANGUAGE_CONFIGS = {
  javascript: { id: 63, name: "JavaScript", template: 'console.log("Hello, World!");' },
  python: { id: 71, name: "Python", template: 'print("Hello, World!")' },
  java: { 
    id: 62, 
    name: "Java", 
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}` 
  },
  c: { 
    id: 50, 
    name: "C", 
    template: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}` 
  },
};

type Language = keyof typeof LANGUAGE_CONFIGS;

export const CodeEditor = () => {
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState(LANGUAGE_CONFIGS.javascript.template);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setCode(LANGUAGE_CONFIGS[value].template);
    setOutput("");
  };

  const executeCode = async () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: language === "javascript" ? "javascript" : language,
          version: "*",
          files: [
            {
              name: language === "java" ? "Main.java" : `main.${language}`,
              content: code,
            },
          ],
        }),
      });

      const result = await response.json();
      
      if (result.run) {
        const output = result.run.output || result.run.stderr || "No output";
        setOutput(output);
        
        if (result.run.stderr) {
          toast.error("Execution completed with errors");
        } else {
          toast.success("Code executed successfully!");
        }
      } else {
        setOutput("Error: Unable to execute code");
        toast.error("Execution failed");
      }
    } catch (error) {
      console.error("Execution error:", error);
      setOutput(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Code Compiler</h1>
          <p className="text-muted-foreground">Execute C, Java, Python, and JavaScript online</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={executeCode} disabled={isRunning} size="lg" className="gap-2">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Execute
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <Card className="flex flex-col bg-editor-bg border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Editor</h2>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-4 bg-editor-bg text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-none"
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </Card>

        <Card className="flex flex-col bg-output-bg border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Output</h2>
          </div>
          <pre className="flex-1 p-4 bg-output-bg text-foreground font-mono text-sm overflow-auto whitespace-pre-wrap">
            {output || "Output will appear here..."}
          </pre>
        </Card>
      </div>
    </div>
  );
};
