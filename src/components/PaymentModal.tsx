import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Building2, Smartphone } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  loanId: string;
}

export const PaymentModal = ({ open, onClose, amount, loanId }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.success("Payment successful! EMI paid for " + loanId);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay EMI - ₹{amount.toLocaleString()}</DialogTitle>
          <DialogDescription>Choose your payment method</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPaymentMethod("card")}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">Card</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPaymentMethod("upi")}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Smartphone className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">UPI</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPaymentMethod("netbanking")}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === "netbanking" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs font-medium">Net Banking</p>
            </motion.button>
          </div>

          {paymentMethod === "card" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div>
                <Label>Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiry</Label>
                  <Input placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input type="password" placeholder="123" maxLength={3} />
                </div>
              </div>
            </motion.div>
          )}

          {paymentMethod === "upi" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label>UPI ID</Label>
              <Input placeholder="yourname@upi" />
            </motion.div>
          )}

          {paymentMethod === "netbanking" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label>Select Bank</Label>
              <select className="w-full p-2 border rounded-md">
                <option>State Bank of India</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </motion.div>
          )}

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? "Processing..." : `Pay ₹${amount.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
