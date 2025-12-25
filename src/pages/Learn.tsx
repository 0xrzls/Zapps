import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LearnContent from "@/components/LearnContent";
import { BookOpen, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const Learn = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("guides");

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
      {}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 p-4 md:p-6">
        {}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-sm">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              Learn Hub
              <Sparkles className="w-4 h-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">Learn how Confidential Web3 works</p>
          </div>
        </div>
      </div>

      {}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="guides" className="text-xs md:text-sm">FHE Basics</TabsTrigger>
          <TabsTrigger value="articles" className="text-xs md:text-sm">Zama Integration</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs md:text-sm">Private Voting 101</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="mt-4">
          <LearnContent type="guides" />
        </TabsContent>

        <TabsContent value="articles" className="mt-4">
          <LearnContent type="articles" />
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <LearnContent type="videos" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learn;