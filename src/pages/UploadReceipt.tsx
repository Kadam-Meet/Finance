import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Camera, FileImage, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "fuel", label: "Fuel" },
  { value: "travel", label: "Travel" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "bills", label: "Bills & Utilities" },
  { value: "health", label: "Health & Medical" },
  { value: "education", label: "Education" },
  { value: "office", label: "Office Supplies" },
  { value: "other", label: "Other" },
];

const UploadReceipt = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isReimbursable, setIsReimbursable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select a JPG or PNG image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectedCategory(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectedCategory(null);
    }
  };

  const simulateAIDetection = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? (clearInterval(interval), 90) : p + 15));
    }, 200);

    await new Promise((r) => setTimeout(r, 2000));
    clearInterval(interval);
    setProgress(100);

    // Simulated AI category detection
    const categories = ["food", "transport", "fuel", "travel", "shopping", "bills"];
    const detected = categories[Math.floor(Math.random() * categories.length)];
    setDetectedCategory(detected);
    setCategory(detected);
    setDescription(`Receipt - ${CATEGORIES.find((c) => c.value === detected)?.label || detected}`);
    setIsProcessing(false);

    toast({ title: "AI Detection Complete", description: `Detected category: ${detected}` });
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsSaving(true);
    let imageUrl: string | null = null;

    // Upload image to storage
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(filePath, selectedFile);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setIsSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    // Insert receipt record
    const { error } = await supabase.from("receipts").insert({
      user_id: user.id,
      image_url: imageUrl,
      amount: parseFloat(amount),
      category,
      description,
      date,
      is_reimbursable: isReimbursable,
      ai_detected_category: detectedCategory,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error saving receipt", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Receipt uploaded successfully!", description: `₹${parseFloat(amount).toFixed(2)} expense saved.` });
      navigate("/receipts");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Upload Receipt
            </CardTitle>
            <CardDescription>Upload or take a photo of your receipt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!previewUrl ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Drag & drop receipt image here</p>
                <p className="text-xs text-muted-foreground mb-4">JPG, PNG • Max 5MB</p>
                <Button variant="outline" type="button">
                  <FileImage className="mr-2 h-4 w-4" /> Select Image
                </Button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileSelect} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Receipt" className="w-full h-auto max-h-[350px] object-contain bg-muted" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm font-medium mb-2">Detecting category...</p>
                      <Progress value={progress} className="w-48" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setPreviewUrl(null); setSelectedFile(null); setDetectedCategory(null); }} className="flex-1">
                    Change Image
                  </Button>
                  <Button onClick={simulateAIDetection} disabled={isProcessing} className="flex-1">
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting...</> : <><Sparkles className="mr-2 h-4 w-4" /> Detect Category</>}
                  </Button>
                </div>
                {detectedCategory && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Detected Category:</span>
                    <Badge variant="secondary">{CATEGORIES.find((c) => c.value === detectedCategory)?.label}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Fill in or confirm the receipt details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="reimbursable" checked={isReimbursable} onChange={(e) => setIsReimbursable(e.target.checked)} className="rounded border-input" />
              <Label htmlFor="reimbursable" className="cursor-pointer">Reimbursable expense</Label>
            </div>
            <Button onClick={handleSubmit} disabled={isSaving || !amount} className="w-full mt-4">
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Check className="mr-2 h-4 w-4" /> Save Receipt</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
