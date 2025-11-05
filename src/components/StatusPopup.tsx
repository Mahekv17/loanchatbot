import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
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

export const StatusPopup = ({ data, onClose, autoDismiss = 3000 }: StatusPopupProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (data.status === "progress" && data.progress) {
      setProgress(data.progress);
    } else if (data.status === "complete") {
      setProgress(100);
      if (autoDismiss > 0) {
        const timer = setTimeout(onClose, autoDismiss);
        return () => clearTimeout(timer);
      }
    }
  }, [data, onClose, autoDismiss]);

  const getIcon = () => {
    switch (data.status) {
      case "complete":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="mt-1">{getIcon()}</div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-card-foreground">{data.agent}</h3>
              <p className="text-sm text-muted-foreground">{data.task}</p>
              {data.message && (
                <p className="text-sm text-card-foreground font-medium">{data.message}</p>
              )}
              {data.reroute && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <ArrowRight className="w-4 h-4" />
                  <span>Routing to {data.reroute}</span>
                </div>
              )}
            </div>
          </div>

          {data.status !== "error" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getStatusColor()}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
