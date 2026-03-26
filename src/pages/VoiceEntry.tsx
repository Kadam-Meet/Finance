import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Mic, 
  MicOff,
  Sparkles,
  Check,
  Edit,
  Loader2,
  Volume2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceData, ExpenseCategory } from "@/types/models";
import { aiApi, expenseApi } from "@/services/api";

const VoiceEntry = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<VoiceData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");

  // Web Speech API setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Speech recognition not supported",
        description: "Please use Chrome or Edge browser for voice input.",
        variant: "destructive",
      });
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setParsedData(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => prev + " " + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    // Store recognition instance for stopping
    (window as any).currentRecognition = recognition;
  };

  const stopListening = () => {
    const recognition = (window as any).currentRecognition;
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const processVoice = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript",
        description: "Please record your voice first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await aiApi.processVoice(transcript.trim());

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to parse voice input");
      }

      const parsed = result.data;
      const parsedAmount = parsed.parsedExpense?.amount?.toString() || "";
      const parsedDescription = parsed.parsedExpense?.description || transcript.trim();
      const parsedCategory = (parsed.parsedExpense?.category as ExpenseCategory) || "other";

      setParsedData(parsed as VoiceData);
      setAmount(parsedAmount);
      setDescription(parsedDescription);
      setCategory(parsedCategory);
    } catch (error) {
      toast({
        title: "Voice parsing failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    const result = await expenseApi.create({
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "upi",
      isRecurring: false,
    });

    if (!result.success) {
      toast({
        title: "Unable to save expense",
        description: result.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Expense saved",
      description: `₹${parseFloat(amount).toFixed(2)} expense has been recorded.`,
    });
    navigate("/expenses");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Voice Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Entry
            </CardTitle>
            <CardDescription>
              Speak your expense naturally, e.g., "Spent ₹25 on lunch at the cafe"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Microphone Button */}
            <div className="flex flex-col items-center py-8">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`
                  relative w-32 h-32 rounded-full transition-all duration-300
                  ${isListening 
                    ? "bg-destructive animate-pulse" 
                    : "bg-primary hover:bg-primary/90"
                  }
                  flex items-center justify-center
                  shadow-lg hover:shadow-xl
                `}
              >
                {isListening ? (
                  <MicOff className="h-12 w-12 text-destructive-foreground" />
                ) : (
                  <Mic className="h-12 w-12 text-primary-foreground" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-4 border-destructive animate-ping opacity-75" />
                )}
              </button>
              <p className="mt-4 text-sm text-muted-foreground">
                {isListening ? "Tap to stop recording" : "Tap to start recording"}
              </p>
            </div>

            {/* Transcript Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Transcript</Label>
                {isListening && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Volume2 className="mr-1 h-3 w-3" />
                    Listening...
                  </Badge>
                )}
              </div>
              <div className="min-h-[100px] p-4 rounded-md border bg-muted/50">
                {transcript ? (
                  <p className="text-sm">{transcript}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Your speech will appear here...
                  </p>
                )}
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={processVoice}
              disabled={!transcript.trim() || isProcessing || isListening}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse with AI
                </>
              )}
            </Button>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Tips for better recognition:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Speak clearly and at a normal pace</li>
                <li>Include the amount (e.g., "50 dollars")</li>
                <li>Mention what it was for</li>
                <li>Use a quiet environment</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Parsed Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Parsed Expense
            </CardTitle>
            <CardDescription>
              Review and edit the AI-parsed expense details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Record and process your voice to see parsed data</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(parsedData.confidence * 100)}% confidence
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={!isEditing}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val as ExpenseCategory)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="bills">Bills</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                  <Check className="mr-2 h-4 w-4" />
                  Save Expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceEntry;
