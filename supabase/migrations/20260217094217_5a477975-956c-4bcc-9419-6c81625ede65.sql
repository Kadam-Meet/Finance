
-- Create receipts table for receipt scanner & allowance claim system
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'rejected')),
  is_reimbursable BOOLEAN NOT NULL DEFAULT true,
  ai_detected_category TEXT,
  ai_confidence NUMERIC(5,2),
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own receipts"
ON public.receipts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
ON public.receipts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
ON public.receipts FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policies for receipt images
CREATE POLICY "Users can upload receipt images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Receipt images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete their receipt images"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
