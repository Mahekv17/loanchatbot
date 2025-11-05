import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface StatusPopupData {
  id: string;
  agent: string;
  task: string;
  status: "pending" | "progress" | "complete" | "error";
  progress?: number;
  message?: string;
  reroute?: string;
}

interface StatusPopupProps {
  data: StatusPopupData;
  onClose: () => void;
  autoDismiss?: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const StatusPopup = ({ data, onClose, autoDismiss = 3000 }: StatusPopupProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (data.status === "progress" && data.progress !== undefined) {
      setProgress(data.progress);
    } else if (data.status === "complete") {
      setProgress(100);
      if (autoDismiss > 0) {
        const t = setTimeout(onClose, autoDismiss);
        return () => clearTimeout(t);
      }
    }
  }, [data, onClose, autoDismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const Icon = () => {
    if (data.status === "complete") return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (data.status === "error") return <AlertCircle className="w-6 h-6 text-rose-500" />;
    return <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />;
  };

  return (
    <AnimatePresence mode="wait">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/28 backdrop-blur-sm z-[100]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="fixed inset-0 z-[101] flex items-center justify-center px-4"
      >
        <div className="relative w-full max-w-lg">
          <div className="rounded-2xl p-[2px] bg-gradient-to-r from-sky-500/20 to-indigo-500/18">
            <div className="glass-card soft-elevate w-full overflow-hidden relative flex">
              {/* subtle top accent */}
              <div className="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
              <div className="flex-1 px-6 py-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-muted/12 ring-1 ring-border flex items-center justify-center text-sm font-semibold text-card-foreground float-slow">
                        {getInitials(data.agent)}
                      </div>
                      <span
                        className={`absolute -right-1 -top-1 block h-3 w-3 rounded-full ring-1 ring-white ${
                          data.status === "complete" ? "bg-emerald-400" : data.status === "error" ? "bg-rose-500" : "bg-sky-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 id={`status-${data.id}-title`} className="text-lg font-semibold text-card-foreground">
                          {data.agent}
                        </h3>
                        <p id={`status-${data.id}-desc`} className="text-sm text-muted-foreground">
                          {data.task}
                        </p>
                      </div>

                      <div className="ml-2">{Icon()}</div>
                    </div>

                    {data.message && <p className="mt-3 text-sm text-card-foreground">{data.message}</p>}

                    {data.reroute && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1 bg-muted/10 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4" />
                        <span className="font-medium">Routing to {data.reroute}</span>
                      </div>
                    )}

                    {/* progress */}
                    {data.status !== "error" && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span className="font-semibold text-muted-foreground">{progress}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted/25 border border-border overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500"
                          />
                          <div className="absolute inset-0 progress-shimmer pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* actions */}
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => onClose()}
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
