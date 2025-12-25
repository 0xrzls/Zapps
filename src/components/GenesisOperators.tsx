import { Card } from "@/components/ui/card";
import { Shield, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { backend } from "@/services";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const GenesisOperators = () => {
  const { data: operators, isLoading } = useQuery({
    queryKey: ['genesis-operators'],
    queryFn: async () => {
      const { data, error } = await backend.operators.getActive();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !operators) {
    return null;
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Protocol Operators</h2>
        </div>
        <Link to="/dapps?sortBy=genesis_operator">
          <Button variant="ghost" className="text-primary hover:text-primary/80 -mr-3 hover:bg-transparent">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {}
      <div className="md:hidden -mx-4">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3 px-4 snap-x snap-mandatory">
          {operators.map((operator) => {
            const truncatedName = operator.name.length > 10 
              ? operator.name.substring(0, 9) + "..." 
              : operator.name;
            return (
              <Card
                key={operator.id}
                className="min-w-[calc((100vw-4rem-1.5rem)/3)] flex-shrink-0 snap-center relative overflow-hidden border hover:border-primary/50 transition-all duration-300 cursor-pointer group gradient-card card-shadow hover:glow-effect aspect-square"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${operator.gradient}`} />
                <div className="relative flex flex-col items-center justify-center h-full p-2 space-y-1.5">
                  <div className="w-16 h-16 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                    {operator.logo_url ? (
                      <img src={operator.logo_url} alt={operator.name} className="w-full h-full object-cover" />
                    ) : (
                      <ExternalLink className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-center leading-tight px-2" title={operator.name}>
                    {truncatedName}
                  </h3>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {}
      {operators.length > 5 ? (
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {operators.map((operator) => {
                return (
                  <CarouselItem key={operator.id} className="basis-1/5">
                    <Card className="relative overflow-hidden border hover:border-primary/50 transition-all duration-300 cursor-pointer group gradient-card card-shadow hover:glow-effect h-20">
                      <div className={`absolute inset-0 bg-gradient-to-br ${operator.gradient}`} />
                      <div className="relative flex items-center gap-3 p-3 h-full">
                        <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300 flex-shrink-0 overflow-hidden">
                          {operator.logo_url ? (
                            <img src={operator.logo_url} alt={operator.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <ExternalLink className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{operator.name}</h3>
                          <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent rounded-full mt-1" />
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      ) : (
        <div className="hidden md:grid md:grid-cols-5 gap-3">
          {operators.map((operator) => {
            const href = operator.website_url || undefined;
            const CardElement = href ? 'a' : 'div';
            return (
              <Card
                key={operator.id}
                className={`relative overflow-hidden border hover:border-primary/50 transition-all duration-300 group gradient-card card-shadow hover:glow-effect ${href ? "cursor-pointer" : ""}`}
              >
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    <div className={`absolute inset-0 bg-gradient-to-br ${operator.gradient}`} />
                    <div className="relative flex flex-col items-center justify-center p-4 space-y-2">
                      <div className="w-16 h-16 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        {operator.logo_url ? (
                          <img src={operator.logo_url} alt={operator.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <ExternalLink className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-center leading-tight">{operator.name}</h3>
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
                    </div>
                  </a>
                ) : (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${operator.gradient}`} />
                    <div className="relative flex flex-col items-center justify-center p-4 space-y-2">
                      <div className="w-16 h-16 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        {operator.logo_url ? (
                          <img src={operator.logo_url} alt={operator.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <ExternalLink className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-center leading-tight">{operator.name}</h3>
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GenesisOperators;
