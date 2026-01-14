import { useState, useEffect, useRef } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithFallback } from "@/lib/api-fallbacks";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mic, Send, Bot, User, Loader2, RotateCcw, Briefcase } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface Message {
  role: "bot" | "user";
  content: string;
}

const interviewRoles = [
  { value: "Frontend Developer", label: "Frontend Developer", icon: "💻" },
  { value: "Backend Developer", label: "Backend Developer", icon: "⚙️" },
  { value: "Full Stack Developer", label: "Full Stack Developer", icon: "🔧" },
  { value: "Machine Learning Engineer", label: "Machine Learning Engineer", icon: "🤖" },
  { value: "Data Scientist", label: "Data Scientist", icon: "📊" },
  { value: "Cybersecurity Analyst", label: "Cybersecurity Analyst", icon: "🔒" },
];

const InterviewPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Frontend Developer");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messagesToJson = (msgs: Message[]): Json => {
    return msgs.map(m => ({ role: m.role, content: m.content })) as unknown as Json;
  };

  const callAIInterview = async (msgs: Message[], complete: boolean = false): Promise<string> => {
    const response = await invokeWithFallback('ai-interview', {
      body: {
        messages: msgs,
        role: selectedRole,
        userId: user?.id,
        sessionId,
        isComplete: complete,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to get AI response');
    }

    return response.data.response;
  };

  const startInterview = async () => {
    if (!user) return;

    setStarted(true);
    setIsLoading(true);

    try {
      // Create interview session first
      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert([{
          user_id: user.id,
          role: selectedRole,
          company: "AI Practice Session",
          messages: [],
        }])
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);

      // Get initial AI message
      const initialMessage: Message = {
        role: "bot",
        content: `Hello! I'm your AI Interview Coach. I'll be conducting a mock interview for the ${selectedRole} position. I'll ask you relevant technical and behavioral questions, and provide feedback on your responses. Let's begin!`
      };

      const aiResponse = await callAIInterview([initialMessage]);

      const welcomeMessages: Message[] = [
        initialMessage,
        { role: "bot", content: aiResponse }
      ];

      setMessages(welcomeMessages);
      setQuestionCount(1);

      // Update session with initial messages
      await supabase
        .from("interview_sessions")
        .update({ messages: messagesToJson(welcomeMessages) })
        .eq("id", session.id);

      // Add to career memory
      await supabase.from("career_memory").insert([{
        user_id: user.id,
        memory_type: "interview_started",
        content: {
          sessionId: session.id,
          role: selectedRole,
          timestamp: new Date().toISOString(),
        },
      }]);

    } catch (error: any) {
      console.error('Interview start error:', error);
      toast({
        title: "Error starting interview",
        description: error.message,
        variant: "destructive",
      });
      setStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isComplete) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const newQuestionCount = questionCount + 1;
      const shouldComplete = newQuestionCount >= 5;

      const aiResponse = await callAIInterview(updatedMessages, shouldComplete);

      const botMessage: Message = { role: "bot", content: aiResponse };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      setQuestionCount(newQuestionCount);

      if (shouldComplete) {
        setIsComplete(true);

        // Add completion to career memory
        await supabase.from("career_memory").insert([{
          user_id: user?.id,
          memory_type: "interview_completed",
          content: {
            sessionId,
            role: selectedRole,
            questionCount: newQuestionCount,
            timestamp: new Date().toISOString(),
          },
        }]);

        toast({
          title: "Interview Complete!",
          description: "Your performance has been evaluated and saved.",
        });
      }

      // Update session messages
      await supabase
        .from("interview_sessions")
        .update({ messages: messagesToJson(finalMessages) })
        .eq("id", sessionId);

    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setStarted(false);
    setMessages([]);
    setQuestionCount(0);
    setSessionId(null);
    setIsComplete(false);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Mock Interview</h1>
          <p className="text-muted-foreground mb-8">Practice with AI-powered interview simulations using real-time AI feedback.</p>

          {!started ? (
            <Card className="text-center">
              <CardContent className="p-12">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready for your interview?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our AI will ask role-specific questions based on your responses and provide detailed, personalized feedback.
                </p>

                <div className="max-w-xs mx-auto mb-6">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Interview Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interviewRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <span className="flex items-center gap-2">
                            <span>{role.icon}</span>
                            <span>{role.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge variant="secondary">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {selectedRole}
                  </Badge>
                  <Badge variant="secondary">5 questions</Badge>
                  <Badge variant="secondary">~15 min</Badge>
                </div>

                <Button variant="hero" size="lg" onClick={startInterview} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Interview
                      <Mic className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b border-border flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Interview Coach
                  </CardTitle>
                  <CardDescription>{selectedRole} Position</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Q {Math.min(questionCount, 5)}/5
                  </Badge>
                  {isComplete && (
                    <Button variant="outline" size="sm" onClick={resetInterview}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      New Session
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-6">
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "bot" ? "bg-primary/20" : "bg-accent/20"}`}>
                        {m.role === "bot" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-accent" />}
                      </div>
                      <div className={`max-w-[80%] p-4 rounded-xl ${m.role === "bot" ? "bg-secondary" : "bg-primary text-primary-foreground"}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-secondary p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={isComplete ? "Interview complete! Click 'New Session' to try again." : "Type your response..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
                    disabled={isLoading || isComplete}
                    className="flex-1"
                  />
                  <Button
                    variant="hero"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || isComplete}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
