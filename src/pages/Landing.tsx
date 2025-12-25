import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, FileCheck, Code2, TrendingUp, Vote, Key, Users, Moon, Sun, Eye, CheckCircle2, Layers } from "lucide-react";
import zamaLogo from "@/assets/zama-logo.png";
import ParticleBackground from "@/components/ParticleBackground";
import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Helmet } from "react-helmet-async";

const Landing = () => {
  const { theme, setTheme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const totalDApps = 50;
  const activeCampaigns = 12;
  const formattedUsers = "10M+";

  const features = [
    {
      icon: Vote,
      title: "Private Voting",
      description: "Interact with encrypted ballots where only aggregated results are revealed.",
      color: "from-primary/20 to-primary/5"
    },
    {
      icon: Lock,
      title: "Encrypted Actions",
      description: "Ratings, follows, and other interactions remain private while still being verifiable.",
      color: "from-accent/20 to-accent/5"
    },
    {
      icon: Code2,
      title: "EVM Compatible",
      description: "Works seamlessly on supported networks enabling encrypted compute experiences.",
      color: "from-primary-glow/20 to-primary/5"
    },
    {
      icon: FileCheck,
      title: "Verifiable Outputs",
      description: "Final tallies and public proofs ensure transparency without exposing individual data.",
      color: "from-primary/20 to-primary-glow/5"
    }
  ];

  const highlights = [
    { icon: Vote, label: "Encrypted votes processed", value: "25K+" },
    { icon: Lock, label: "Privacy-enhanced dApps", value: "8+" },
    { icon: Shield, label: "Exposed user data", value: "0" },
    { icon: Layers, label: "Supported chains", value: "3" }
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative min-h-screen bg-background">
      <Helmet>
        <title>Zapps — Encrypted dApps with FHE</title>
        <meta name="description" content="Discover and build confidential dApps with Fully Homomorphic Encryption (FHE). Private inputs, auditable outcomes, EVM-compatible." />
        <meta name="keywords" content="FHE dApps, confidential smart contracts, encrypted voting, FHEVM, privacy-preserving blockchain" />
      </Helmet>
      <ParticleBackground />
      
      {}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-glow/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/30 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={zamaLogo} alt="Zapps" className="w-[46px] h-[46px]" />
            <span className="text-lg md:text-2xl font-bold text-gradient">
              Zapps
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 md:w-10 md:h-10"
            >
              <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button 
              size="sm"
              className="glow-effect text-xs md:text-sm px-3 md:px-4 h-8 md:h-10"
              onClick={() => window.location.href = 'https://app.zapps.fun'}
            >
              Launch Encrypted App
            </Button>
          </div>
        </div>
      </header>

      {}
      <section className="relative container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6 animate-fade-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Discover the Future of{" "}
            <span className="text-gradient animate-shimmer">
              Encrypted dApps
            </span>
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Build and explore applications with end-to-end privacy using <span className="font-semibold text-foreground">Fully Homomorphic Encryption (FHE)</span>.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/80 max-w-xl mx-auto">
            Privacy by default. Compute on encrypted data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 md:pt-4">
            <Button 
              size="default"
              className="glow-effect text-sm md:text-base px-6 md:px-8 h-10 md:h-12 group w-full sm:w-auto"
              onClick={() => window.location.href = 'https://app.zapps.fun'}
            >
              Launch Encrypted App
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button 
              size="default"
              variant="outline" 
              className="glass-card-subtle text-sm md:text-base px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
              onClick={() => window.location.href = 'https://app.zapps.fun'}
            >
              How Privacy Works
            </Button>
          </div>
        </div>
      </section>

      {}
      <section className="relative py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8 text-gradient">
            Why Choose Zamaverse?
          </h2>
        </div>
        
        {}
        <div className="hidden md:block container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-4 hover:glass-card-strong transition-smooth group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-smooth`}>
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing pb-4 px-4"
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-4 w-[calc(100vw-2rem)] snap-center flex-shrink-0"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="relative py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-center text-gradient">Platform Highlights</h3>
        </div>
        
        {}
        <div className="hidden md:block container mx-auto px-4">
          <div className="glass-card-strong p-4 md:p-6 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {highlights.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-smooth"
                >
                  <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gradient">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="md:hidden overflow-hidden px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className="glass-card p-3 min-w-[calc(33.333%-0.45rem)] snap-center flex-shrink-0 flex flex-col items-center text-center"
              >
                <item.icon className="w-4 h-4 text-primary flex-shrink-0 mb-2" />
                <div className="text-base font-bold text-gradient leading-tight">{item.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient">
              How Privacy Works
            </h2>
            
            {}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Client-Side Encryption</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Users encrypt inputs on their devices before sending to the blockchain
                </p>
              </div>
              <div className="glass-card p-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold">On-Chain FHE Compute</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Smart contracts operate directly over ciphertexts using FHEVM
                </p>
              </div>
              <div className="glass-card p-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-glow/20 to-primary/5 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="text-lg font-semibold">Verifiable Results</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Aggregates are auditable; individual data stays private
                </p>
              </div>
            </div>

            {}
            <div className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
              <div className="glass-card p-6 w-[calc(100vw-2rem)] snap-center flex-shrink-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold">Client-Side Encryption</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Users encrypt inputs on their devices before sending to the blockchain
                </p>
              </div>
              <div className="glass-card p-6 w-[calc(100vw-2rem)] snap-center flex-shrink-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-base font-semibold">On-Chain FHE Compute</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Smart contracts operate directly over ciphertexts using FHEVM
                </p>
              </div>
              <div className="glass-card p-6 w-[calc(100vw-2rem)] snap-center flex-shrink-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-glow/20 to-primary/5 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="text-base font-semibold">Verifiable Results</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aggregates are auditable; individual data stays private
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative py-8 md:py-12 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <p className="text-xs md:text-sm font-semibold">End-to-End Encryption (FHE)</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <Lock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <p className="text-xs md:text-sm font-semibold">No Plaintext on Servers</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <p className="text-xs md:text-sm font-semibold">Auditable Final Results</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4">
                <Code2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <p className="text-xs md:text-sm font-semibold">Open-Source Components</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass-card-subtle rounded-2xl p-6 md:p-12 text-center space-y-4 md:space-y-6 animate-fade-in">
            <h2 className="text-xl md:text-3xl font-bold text-gradient">
              Ready to Build Confidential dApps?
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join developers building the future of privacy-preserving applications with Zama FHE.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Button 
                size="default"
                className="glow-effect text-sm md:text-base px-6 md:px-8 h-10 md:h-12 group w-full sm:w-auto"
                onClick={() => window.location.href = 'https://app.zapps.fun'}
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button 
                size="default"
                variant="outline" 
                className="glass-card-subtle text-sm md:text-base px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
                onClick={() => window.open('https://docs.zama.ai', '_blank')}
              >
                View Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="relative container mx-auto px-4 py-6 md:py-8 border-t border-border/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={zamaLogo} alt="Zamaverse" className="w-[46px] h-[46px]" />
            <span className="text-sm md:text-base font-semibold">© 2025 Zamaverse</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Building the future of <span className="font-semibold">confidential</span> on-chain discovery, powered by <span className="font-semibold">Zama FHE</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
