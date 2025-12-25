import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { backend } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ImageInput } from "./ImageInput";

interface GenesisOperator {
  id: string;
  name: string;
  logo_url: string | null;
  gradient: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface GenesisOperatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator?: GenesisOperator | null;
}

const gradientOptions = [
  "from-primary/20 via-primary/10 to-transparent",
  "from-accent/20 via-accent/10 to-transparent",
  "from-blue-500/20 via-blue-500/10 to-transparent",
  "from-green-500/20 via-green-500/10 to-transparent",
];

export const GenesisOperatorDialog = ({ open, onOpenChange, operator }: GenesisOperatorDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    website_url: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (operator) {
      setFormData({
        name: operator.name,
        logo_url: operator.logo_url || "",
        gradient: operator.gradient,
        website_url: operator.website_url || "",
        display_order: operator.display_order,
        is_active: operator.is_active,
      });
    } else {
      setFormData({
        name: "",
        logo_url: "",
        gradient: "from-primary/20 via-primary/10 to-transparent",
        website_url: "",
        display_order: 0,
        is_active: true,
      });
    }
  }, [operator, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (operator) {
        const { error } = await backend.operators.update(operator.id, formData);

        if (error) throw error;
        toast.success("Protocol operator updated successfully");
      } else {
        const { error } = await backend.operators.create(formData);

        if (error) throw error;
        toast.success("Protocol operator created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["genesis-operators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-genesis-operators"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{operator ? "Edit" : "Add"} Protocol Operator</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageInput
              label=""
              value={formData.logo_url}
              onChange={(url) => setFormData({ ...formData, logo_url: url })}
              id="genesis-logo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient">Gradient</Label>
            <Select
              value={formData.gradient}
              onValueChange={(value) => setFormData({ ...formData, gradient: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradientOptions.map((gradient) => (
                  <SelectItem key={gradient} value={gradient}>
                    {gradient}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL (Optional)</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {operator ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
