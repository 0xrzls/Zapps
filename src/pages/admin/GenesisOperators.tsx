import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backend } from "@/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GenesisOperatorDialog } from "@/components/admin/GenesisOperatorDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GenesisOperator {
  id: string;
  name: string;
  logo_url: string | null;
  gradient: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

const GenesisOperatorsAdmin = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<GenesisOperator | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<string | null>(null);

  const { data: operators, isLoading, refetch } = useQuery({
    queryKey: ["admin-genesis-operators"],
    queryFn: async () => {
      const result = await backend.operators.getAll();
      return (result.data || []) as GenesisOperator[];
    },
  });

  const handleDelete = async () => {
    if (!operatorToDelete) return;

    try {
      await backend.operators.delete(operatorToDelete);
      toast.success("Protocol operator deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setOperatorToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (operator: GenesisOperator) => {
    setSelectedOperator(operator);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedOperator(null);
    setDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setOperatorToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Protocol Operators</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Operator
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators?.map((operator) => (
          <Card key={operator.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{operator.name}</h3>
                <p className="text-sm text-muted-foreground">Order: {operator.display_order}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(operator)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => confirmDelete(operator.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              {operator.logo_url && (
                <div className="mb-2">
                  <img src={operator.logo_url} alt={operator.name} className="w-12 h-12 object-contain" />
                </div>
              )}
              {operator.website_url && (
                <p className="truncate">URL: {operator.website_url}</p>
              )}
              <p>Status: {operator.is_active ? "Active" : "Inactive"}</p>
            </div>
          </Card>
        ))}
      </div>

      <GenesisOperatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operator={selectedOperator}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the protocol operator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GenesisOperatorsAdmin;