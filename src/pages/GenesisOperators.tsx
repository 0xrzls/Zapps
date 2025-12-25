import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { backend } from "@/services";
import * as LucideIcons from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GenesisOperatorsPage = () => {
  const { data: operators, isLoading } = useQuery({
    queryKey: ['genesis-operators-all'],
    queryFn: async () => {
      const result = await backend.operators.getAll();
      
      return result.data?.filter((op: any) => op.is_active) || [];
    },
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Protocol Operators</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <div className="flex flex-col items-center justify-center p-6 space-y-3">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {operators?.map((operator: any) => {
            const IconComponent = (LucideIcons as any)[operator.icon_name] || Shield;
            return (
              <Card
                key={operator.id}
                className="relative overflow-hidden border hover:border-primary/50 transition-all duration-300 cursor-pointer group gradient-card card-shadow hover:glow-effect"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${operator.gradient}`} />
                <div className="relative flex flex-col items-center justify-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className={`w-8 h-8 ${operator.icon_color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-center leading-tight">{operator.name}</h3>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GenesisOperatorsPage;