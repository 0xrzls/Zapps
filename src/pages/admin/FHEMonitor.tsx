import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { FHELog, DAppScore } from '@/services/types';

interface FHELogWithDApp extends FHELog {
  dapps?: { name: string };
}

interface DAppStatus {
  dapp_id: string;
  dapp_name: string;
  vote_score: number;
  updated_at: string;
  pending_since: string | null;
  last_snapshot_req_at: string | null;
  pending_attempts: number;
}

export default function FHEMonitor() {
  const [logs, setLogs] = useState<FHELogWithDApp[]>([]);
  const [dappStatuses, setDappStatuses] = useState<DAppStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    const { data: logsData, error: logsError } = await backend.fheLogs.getAll({ limit: 100, orderBy: 'created_at', ascending: false });
    
    if (logsError || !logsData) {
      console.error('Error fetching logs:', logsError);
      return;
    }

    const dappIds = [...new Set(logsData.map(log => log.dapp_id).filter(Boolean))] as string[];
    if (dappIds.length > 0) {
      const dappNamesMap = new Map<string, string>();
      
      for (const id of dappIds) {
        const { data: dapp } = await backend.dapps.getById(id);
        if (dapp) {
          dappNamesMap.set(id, dapp.name);
        }
      }
      
      setLogs(logsData.map(log => ({
        ...log,
        dapps: log.dapp_id ? { name: dappNamesMap.get(log.dapp_id) || 'Unknown' } : undefined
      })));
    } else {
      setLogs(logsData);
    }
  };

  const fetchDAppStatuses = async () => {
    
    const { data: dapps } = await backend.dapps.getAll();
    if (!dapps) return;

    const statuses: DAppStatus[] = [];
    
    for (const dapp of dapps.slice(0, 20)) { 
      const { data: score } = await backend.scores.getByDApp(dapp.id);
      if (score) {
        statuses.push({
          dapp_id: dapp.id,
          dapp_name: dapp.name,
          vote_score: score.vote_score || 0,
          updated_at: score.updated_at,
          pending_since: score.pending_since || null,
          last_snapshot_req_at: score.last_snapshot_req_at || null,
          pending_attempts: score.pending_attempts || 0
        });
      }
    }
    
    statuses.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setDappStatuses(statuses);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchDAppStatuses()]);
    setLoading(false);
    toast({
      title: 'Refreshed',
      description: 'Latest data loaded'
    });
  };

  useEffect(() => {
    fetchLogs();
    fetchDAppStatuses();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
      fetchDAppStatuses();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    
    const fheLogsSubscription = backend.realtime.subscribe(
      'fhe_logs',
      '*',
      () => {
        fetchLogs();
      }
    );
    
    const scoresSubscription = backend.realtime.subscribe(
      'dapp_scores',
      '*',
      () => {
        fetchDAppStatuses();
      }
    );

    return () => {
      fheLogsSubscription.unsubscribe();
      scoresSubscription.unsubscribe();
    };
  }, []);

  const getStatusIcon = (status: DAppStatus) => {
    if (status.pending_since) {
      const pendingMs = Date.now() - new Date(status.pending_since).getTime();
      if (pendingMs > 60 * 60 * 1000) {
        return <XCircle className="h-4 w-4 text-destructive" />;
      }
      return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    }
    
    if (status.updated_at) {
      const staleMs = Date.now() - new Date(status.updated_at).getTime();
      if (staleMs < 30 * 60 * 1000) {
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      }
    }
    
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: DAppStatus) => {
    if (status.pending_since) {
      const pendingMs = Date.now() - new Date(status.pending_since).getTime();
      if (pendingMs > 60 * 60 * 1000) {
        return <Badge variant="destructive">Stuck ({status.pending_attempts} attempts)</Badge>;
      }
      return <Badge variant="secondary" className="animate-pulse">Decrypting...</Badge>;
    }
    
    if (status.updated_at) {
      const staleMs = Date.now() - new Date(status.updated_at).getTime();
      if (staleMs < 30 * 60 * 1000) {
        return <Badge variant="default" className="bg-success">Fresh</Badge>;
      }
      return <Badge variant="outline">Stale</Badge>;
    }
    
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warn':
        return <Badge variant="secondary">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  const getLogIcon = (message: string) => {
    if (message.includes('DecryptionRequested') || message.includes('Calling requestDecryption')) {
      return <Zap className="h-4 w-4 text-primary animate-pulse" />;
    }
    if (message.includes('complete') || message.includes('success') || message.includes('✅')) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (message.includes('error') || message.includes('failed') || message.includes('❌')) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (message.includes('pending') || message.includes('waiting') || message.includes('polling')) {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FHE Decryption Monitor</h1>
          <p className="text-muted-foreground">Real-time tracking of encrypted vote decryptions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={handleRefresh} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dappStatuses.slice(0, 6).map((status) => (
          <Card key={status.dapp_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{status.dapp_name}</CardTitle>
                {getStatusIcon(status)}
              </div>
              <CardDescription className="text-xs">
                {status.dapp_id.substring(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vote Score:</span>
                <span className="font-bold">{(status.vote_score / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(status)}
              </div>
              {status.updated_at && (
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(status.updated_at).toLocaleString()}
                </div>
              )}
              {status.pending_since && (
                <div className="text-xs text-warning">
                  Pending since: {new Date(status.pending_since).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle>FHE Processing Logs</CardTitle>
          <CardDescription>
            Real-time logs from the FHE auto-relayer tracking decryption lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No logs yet</p>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.message)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getLevelBadge(log.level)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.dapps?.name && (
                          <Badge variant="outline" className="text-xs">
                            {log.dapps.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Show details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Fresh ({"<"}30min)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span>Decrypting...</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span>Stuck ({">"}1h)</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>Stale ({">"}30min)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
