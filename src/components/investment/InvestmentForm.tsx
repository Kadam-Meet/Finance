import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Calendar, IndianRupee, Hash, Building2 } from 'lucide-react';
import { InvestmentFormData, TAX_SLABS } from '@/types/investment';

interface InvestmentFormProps {
  onSubmit: (data: InvestmentFormData) => void;
  isLoading?: boolean;
}

export const InvestmentForm = ({ onSubmit, isLoading }: InvestmentFormProps) => {
  const [formData, setFormData] = useState<InvestmentFormData>({
    stockName: '',
    buyPrice: 0,
    quantity: 1,
    sellPrice: 0,
    buyDate: new Date().toISOString().split('T')[0],
    sellDate: new Date().toISOString().split('T')[0],
    taxSlab: 15,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof InvestmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Investment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Name */}
          <div className="space-y-2">
            <Label htmlFor="stockName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Stock Name
            </Label>
            <Input
              id="stockName"
              placeholder="e.g., Reliance, TCS, HDFC Bank"
              value={formData.stockName}
              onChange={(e) => handleInputChange('stockName', e.target.value)}
              required
            />
          </div>

          {/* Buy Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice" className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                Buy Price (₹)
              </Label>
              <Input
                id="buyPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.buyPrice || ''}
                onChange={(e) => handleInputChange('buyPrice', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          {/* Sell/Current Price */}
          <div className="space-y-2">
            <Label htmlFor="sellPrice" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              Sell / Current Price (₹)
            </Label>
            <Input
              id="sellPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.sellPrice || ''}
              onChange={(e) => handleInputChange('sellPrice', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Buy Date
              </Label>
              <Input
                id="buyDate"
                type="date"
                value={formData.buyDate}
                onChange={(e) => handleInputChange('buyDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Sell Date (Optional)
              </Label>
              <Input
                id="sellDate"
                type="date"
                value={formData.sellDate}
                onChange={(e) => handleInputChange('sellDate', e.target.value)}
              />
            </div>
          </div>

          {/* Tax Slab */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Tax Slab (%)</Label>
            <Select
              value={formData.taxSlab.toString()}
              onValueChange={(value) => handleInputChange('taxSlab', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tax slab" />
              </SelectTrigger>
              <SelectContent>
                {TAX_SLABS.map((slab) => (
                  <SelectItem key={slab.value} value={slab.value.toString()}>
                    {slab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Investment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
