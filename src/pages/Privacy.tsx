import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, Cookie, UserCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Privacy() {
  const isLocked = true;
  const [requestSent, setRequestSent] = useState(false);
  const { toast } = useToast();

  const handleDataRequest = (type: string) => {
    setRequestSent(true);
    toast({
      title: 'Request Submitted',
      description: `Your ${type} request has been submitted. We'll respond within 30 days.`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      {}
      {isLocked && (
        <>
          <div className="fixed top-16 left-0 right-0 bottom-16 md:top-20 md:bottom-0 bg-background/80 backdrop-blur-md z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
            <div className="flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Coming Soon</h2>
            </div>
          </div>
        </>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Privacy & Security
          </h1>
          <p className="text-muted-foreground text-lg">
            Your privacy and security are our top priorities
          </p>
        </div>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Privacy Policy
            </CardTitle>
            <CardDescription>How we collect and use your information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Information We Collect</h3>
              <p>
                We collect minimal information necessary to provide our services:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Wallet addresses (public blockchain data)</li>
                <li>Email addresses (when you voluntarily provide them)</li>
                <li>Usage data and analytics (anonymized)</li>
                <li>Social media handles (when you connect social accounts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">How We Use Your Information</h3>
              <p>
                Your information is used to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and improve our services</li>
                <li>Process campaign participation and rewards</li>
                <li>Send important updates and notifications</li>
                <li>Analyze platform usage for improvements</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Data Sharing</h3>
              <p>
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Campaign organizers (only when you participate)</li>
                <li>Service providers who help operate our platform</li>
                <li>Law enforcement when legally required</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Measures
            </CardTitle>
            <CardDescription>How we protect your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Encryption
                </h4>
                <p className="text-sm text-muted-foreground">
                  All data is encrypted in transit using industry-standard TLS/SSL protocols.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Access Control
                </h4>
                <p className="text-sm text-muted-foreground">
                  Strict access controls limit who can view or modify your data.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Regular Audits
                </h4>
                <p className="text-sm text-muted-foreground">
                  We conduct regular security audits and penetration testing.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  No Private Keys
                </h4>
                <p className="text-sm text-muted-foreground">
                  We never store or have access to your wallet's private keys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies & Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookies & Tracking
            </CardTitle>
            <CardDescription>How we use cookies and similar technologies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              We use cookies and similar tracking technologies to improve your experience:
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">Essential Cookies</h4>
                <p className="text-sm">Required for the platform to function properly (wallet connections, sessions).</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Analytics Cookies</h4>
                <p className="text-sm">Help us understand how users interact with the platform (anonymized).</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Preference Cookies</h4>
                <p className="text-sm">Remember your settings and preferences (theme, language).</p>
              </div>
            </div>

            <p className="text-sm">
              You can control cookie preferences through your browser settings. Note that disabling certain cookies may limit platform functionality.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
            <CardDescription>Control over your personal data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
            
            <div className="pt-4 space-y-2">
              <p className="font-semibold text-foreground">Exercise Your Rights</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDataRequest('data access')}
                  disabled={requestSent}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Request My Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDataRequest('data deletion')}
                  disabled={requestSent}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Delete My Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDataRequest('data export')}
                  disabled={requestSent}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
              </div>
            </div>
            
            <p className="mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@zapps.fun" className="text-primary hover:underline inline-flex items-center gap-1">
                <Mail className="w-3 h-3" />
                privacy@zapps.fun
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Web3 Specific */}
        <Card>
          <CardHeader>
            <CardTitle>Web3 & Blockchain Privacy</CardTitle>
            <CardDescription>Understanding blockchain transparency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              When using blockchain-based features, please be aware:
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">Public Blockchain Data</h4>
                <p className="text-sm">
                  All transactions and wallet addresses on the blockchain are publicly visible and permanent.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Pseudonymity</h4>
                <p className="text-sm">
                  While wallet addresses are pseudonymous, they may be linkable to your identity through various means.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground">Smart Contracts</h4>
                <p className="text-sm">
                  Interactions with smart contracts are permanent and recorded on the blockchain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center space-y-4 pt-8 border-t border-border">
          <h3 className="text-xl font-semibold">Questions About Privacy?</h3>
          <p className="text-muted-foreground">
            Contact our privacy team at{' '}
            <a href="mailto:privacy@zapps.fun" className="text-primary hover:underline">
              privacy@zapps.fun
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>
      </div>
    </div>
  );
}
