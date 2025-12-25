import { Sparkles, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaXTwitter } from "react-icons/fa6";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const ComingSoon = ({ 
  title = "Coming Soon", 
  description = "This feature is currently under development. Stay tuned for updates!",
  icon: Icon = Sparkles
}: ComingSoonProps) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[70vh] flex items-center justify-center">
      <Card className="relative overflow-hidden max-w-2xl w-full">
        {}
        <div className="absolute inset-0 backdrop-blur-3xl bg-background/80 z-10" />
        
        {}
        <div className="absolute inset-0 opacity-20" style={{ 
          background: 'var(--gradient-primary)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        
        {}
        <div className="relative z-20 p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-primary/10 border border-primary/20">
              <Icon className="w-16 h-16 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {description}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
              variant="default" 
              className="gap-2"
              onClick={() => window.open('https://x.com/zapps', '_blank')}
            >
              <FaXTwitter className="w-4 h-4" />
              Follow @zapps
            </Button>
            <Button variant="outline" disabled className="gap-2">
              <Bell className="w-4 h-4" />
              Get Launch Updates
            </Button>
          </div>
          
          <div className="pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-500">Launching Soon</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ComingSoon;