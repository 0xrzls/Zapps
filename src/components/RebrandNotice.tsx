import { AlertCircle, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface RebrandNoticeProps {
  isLandingPage?: boolean;
}

export const RebrandNotice = ({ isLandingPage = false }: RebrandNoticeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h1 className="text-3xl font-bold mb-2">We've moved!</h1>
            <p className="text-muted-foreground mb-4">
              Zamaverse is now officially rebranded as <span className="text-primary font-semibold">Zapps</span> and can be accessed at:
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            This change is part of our effort to build a clearer identity, avoid confusion with the Zama brand name, 
            and create a more open, community-driven platform. Zapps reflects our vision more accurately—simple, fun, 
            and focused on enabling developers and users to explore real encrypted and privacy-enhanced dApps.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          {isLandingPage ? (
            <Button asChild size="lg" className="flex-1">
              <a href="https://zapps.fun" className="flex items-center gap-2">
                More
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          ) : (
            <Button asChild size="lg" className="flex-1">
              <a href="https://app.zapps.fun" className="flex items-center gap-2">
                Launch Zapps
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Why the change?
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-foreground mb-4">
                To maintain clarity and transparency for the community:
              </p>
              
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">Zamaverse was an early prototype name</strong>, but it unintentionally 
                    sounded like an official Zama product. We want to respect Zama's branding rules and avoid misunderstandings.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">Zapps gives us a fresh identity</strong> that belongs fully to the 
                    community-driven project we're building.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">No features are removed</strong>—everything continues under Zapps, 
                    with improved UI, clearer direction, and ongoing updates.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">Your progress, data, and experience stay safe</strong>—we simply 
                    moved the home of the project.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-semibold mb-2">What should you do?</p>
              <p className="text-sm text-muted-foreground mb-3">
                Nothing special—just update your bookmark:
              </p>
              <div className="flex items-center gap-2 bg-background rounded p-3 border">
                <ExternalLink className="w-4 h-4 text-primary" />
                <a href="https://zapps.fun" className="text-sm text-primary hover:underline font-mono">
                  https://zapps.fun
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                All future updates, releases, and announcements will happen under the Zapps name.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
