import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, MessageCircle, Mail, Send, ExternalLink, Lock } from 'lucide-react';
import { FaDiscord, FaXTwitter } from 'react-icons/fa6';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Help() {
  const isLocked = true;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Message Sent!',
      description: 'Our support team will get back to you within 24 hours.',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
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

      <div className="max-w-5xl mx-auto space-y-12">
        {}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Help & Support
          </h1>
          <p className="text-muted-foreground text-lg">
            We're here to help! Find answers or reach out to our team
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-primary/50 transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FaDiscord className="w-5 h-5 text-primary" />
                Join Discord
              </CardTitle>
              <CardDescription>Chat with our community</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://discord.gg/zapps" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Discord
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FaXTwitter className="w-5 h-5 text-primary" />
                Follow on X
              </CardTitle>
              <CardDescription>Get latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://twitter.com/zapps" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open X
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-primary" />
                Email Support
              </CardTitle>
              <CardDescription>Direct email contact</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@zapps.fun">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Zamaverse uses wallet-based authentication. Your wallet's private key serves as your password. 
                  If you need to access your account from a new device, simply connect your wallet again.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger>I can't see my rewards. What should I do?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Check your Profile page to view all earned rewards. If rewards are missing after completing a campaign, 
                  please contact support with your wallet address and campaign details.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger>How long does DApp submission review take?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  DApp submissions are typically reviewed within 24-48 hours. You'll receive an email notification 
                  once your submission is approved or if we need additional information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger>Can I change my connected wallet?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Simply disconnect your current wallet using the wallet menu and connect a different one. 
                  Note that your progress and rewards are tied to each individual wallet address.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger>What are the network fees?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Most interactions on Zamaverse are free. However, claiming certain rewards or participating 
                  in on-chain activities may require small network fees (gas fees) paid to the Solana network.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger>How do I report a bug or issue?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Use the contact form below to report bugs. Please include as much detail as possible, 
                  including screenshots if relevant. You can also report issues on our Discord server.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. We use industry-standard encryption and security practices. We never store your private keys 
                  or seed phrases. For more details, check our Privacy & Security page.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-8">
                <AccordionTrigger>Can I use Zamaverse on mobile?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely! Zamaverse is fully responsive and works great on mobile devices. 
                  For the best mobile experience, we recommend using a mobile wallet browser like Phantom or Solflare.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessageCircle className="w-6 h-6" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message and we'll get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please provide as much detail as possible..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="text-center space-y-4 pt-8 border-t border-border">
          <h3 className="text-xl font-semibold">Additional Resources</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <a href="/docs">Documentation</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/privacy">Privacy & Security</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://docs.zapps.fun" target="_blank" rel="noopener noreferrer">
                Developer Docs
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
