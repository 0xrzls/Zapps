import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backend } from "@/services";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Connecting your account...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const platform = params.get('platform');
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        setStatus("Connection failed");
        if (window.opener) {
          window.opener.postMessage(
            { type: `oauth:${platform}:result`, success: false, error },
            '*'
          );
          setTimeout(() => window.close(), 2000);
        } else {
          navigate('/');
        }
        return;
      }

      if (!code || !state || !platform) {
        setStatus("Invalid callback parameters");
        if (window.opener) {
          window.opener.postMessage(
            { type: `oauth:${platform}:result`, success: false, error: "Invalid parameters" },
            '*'
          );
          setTimeout(() => window.close(), 2000);
        } else {
          navigate('/');
        }
        return;
      }

      try {
        setStatus(`Connecting ${platform}...`);
        
        const originalUrl = (() => {
          try {
            const parts = state.split('|');
            return parts[2] ? decodeURIComponent(parts[2]) : `${window.location.origin}/`;
          } catch {
            return `${window.location.origin}/`;
          }
        })();
        
        const functionName = platform === 'twitter' 
          ? 'twitter-oauth-exchange' 
          : 'discord-oauth-exchange';
        
        const { data, error: exchangeError } = await backend.functions.invoke(functionName, { 
          code, 
          state,
          redirectUri: `${window.location.origin}/oauth-callback?platform=${platform}`
        });

        if (exchangeError) throw exchangeError;
        if (!data?.success) throw new Error(data?.error || 'Exchange failed');

        setStatus("Successfully connected!");
        
        try {
          
          try {
            const bc = new BroadcastChannel('oauth:channel');
            bc.postMessage({ 
              platform, 
              success: true, 
              transferredAchievements: data?.transferredAchievements 
            });
            bc.close();
          } catch {}
          try {
            localStorage.setItem(`oauth:${platform}:result`, JSON.stringify({ 
              success: true, 
              transferredAchievements: data?.transferredAchievements,
              ts: Date.now() 
            }));
          } catch {}
        } catch {}
        
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: `oauth:${platform}:result`, 
              success: true,
              transferredAchievements: data?.transferredAchievements 
            },
            '*'
          );
          
          try { window.close(); } catch {}
          setTimeout(() => {
            try { window.close(); } catch {}
            
          }, 800);
        } else {
          
          window.location.href = originalUrl;
        }
      } catch (err: any) {
        console.error('OAuth exchange error:', err);
        setStatus("Connection failed");
        
        try {
          const bc = new BroadcastChannel('oauth:channel');
          bc.postMessage({ platform, success: false, error: err?.message || 'Exchange failed' });
          bc.close();
        } catch {}
        try {
          localStorage.setItem(`oauth:${platform}:result`, JSON.stringify({ success: false, error: err?.message || 'Exchange failed', ts: Date.now() }));
        } catch {}
        
        if (window.opener) {
          window.opener.postMessage(
            { type: `oauth:${platform}:result`, success: false, error: err.message },
            '*'
          );
          setTimeout(() => window.close(), 2000);
        } else {
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground">{status}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
