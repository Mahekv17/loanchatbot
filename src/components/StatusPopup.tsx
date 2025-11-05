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
    <AnimatePresence mode="wait">
      {/* Backdrop blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      
      {/* Status popup with card slide animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 100, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -50, rotateX: -5 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          duration: 0.4 
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl px-4"
      >
        <div className="bg-card/80 backdrop-blur-2xl border-2 border-primary/20 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 space-y-6 relative overflow-hidden">
          {/* Glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl" />
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="mt-1 bg-primary/10 p-4 rounded-2xl">{getIcon()}</div>
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-bold text-card-foreground">{data.agent}</h3>
              <p className="text-base text-muted-foreground">{data.task}</p>
              {data.message && (
                <p className="text-lg text-card-foreground font-semibold mt-3">{data.message}</p>
              )}
              {data.reroute && (
                <div className="flex items-center gap-3 text-base text-primary mt-3 bg-primary/5 px-4 py-2 rounded-xl">
                  <ArrowRight className="w-5 h-5" />
                  <span>Routing to {data.reroute}</span>
                </div>
              )}
            </div>
          </div>

          {data.status !== "error" && (
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-sm text-muted-foreground font-medium">
                <span>Progress</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/50">
                <motion.div
                  className={`h-full ${getStatusColor()} relative overflow-hidden`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
