import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { backend } from "@/services";

interface FHELog {
  id: string;
  created_at: string;
  dapp_id: string;
  level: string;
  message: string;
  details: any | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dappId: string | null;
}

export const FHELogsDialog: React.FC<Props> = ({ open, onOpenChange, dappId }) => {
  const [logs, setLogs] = React.useState<FHELog[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchLogs = React.useCallback(async () => {
    if (!dappId) return;
    setLoading(true);
    const { data, error } = await backend.fheLogs.getByDApp(dappId);
    if (!error && data) setLogs(data as unknown as FHELog[]);
    setLoading(false);
  }, [dappId]);

  React.useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>FHE Snapshot Logs</DialogTitle>
          <DialogDescription>
            Riwayat proses dekripsi dan update skor untuk dApp terpilih.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-2">
          <div className="text-sm opacity-80">{dappId}</div>
          <button
            className="text-sm underline"
            onClick={fetchLogs}
            disabled={loading}
          >
            {loading ? "Muat..." : "Refresh"}
          </button>
        </div>
        <ScrollArea className="h-[420px] pr-4">
          <ul className="space-y-3">
            {logs.length === 0 && (
              <li className="text-sm opacity-70">Belum ada log untuk dApp ini.</li>
            )}
            {logs.map((log) => (
              <li key={log.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs opacity-70">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <Badge variant={log.level === "error" ? "destructive" : log.level === "warn" ? "secondary" : "default"}>
                    {log.level}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  {log.message}
                </div>
                {log.details && (
                  <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FHELogsDialog;
