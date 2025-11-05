import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockAuth, storeUser } from "@/lib/auth";
import { StatusPopup, StatusPopupData } from "@/components/StatusPopup";
import { Smartphone, Shield } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "face">("phone");
  const [statusPopup, setStatusPopup] = useState<StatusPopupData | null>(null);

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setStatusPopup({
        id: "otp-send",
        agent: "Authentication Service",
        task: "Sending OTP",
        status: "progress",
        progress: 45,
      });

      setTimeout(() => {
        setStatusPopup({
          id: "otp-send",
          agent: "Authentication Service",
          task: "OTP Sent Successfully",
          status: "complete",
          progress: 100,
          message: "Check your phone for OTP (use 123456)",
        });
        setStep("otp");
      }, 1500);
    } else {
      toast.error("Please enter a valid 10-digit phone number");
    }
  };

  const handleVerifyOtp = async () => {
    setStatusPopup({
      id: "otp-verify",
      agent: "Verification Agent",
      task: "Verifying OTP",
      status: "progress",
      progress: 65,
    });

    const user = await mockAuth.login(phone, otp);
    
    if (user) {
      setStatusPopup({
        id: "otp-verify",
        agent: "Verification Agent",
        task: "OTP Verified",
        status: "complete",
        progress: 100,
      });
      setTimeout(() => setStep("face"), 2000);
    } else {
      setStatusPopup({
        id: "otp-verify",
        agent: "Verification Agent",
        task: "Invalid OTP",
        status: "error",
        message: "Please try again with correct OTP",
      });
      toast.error("Invalid OTP. Use 123456 for demo");
    }
  };

  const handleFaceKyc = async () => {
    setStatusPopup({
      id: "face-kyc",
      agent: "Face KYC Service",
      task: "Scanning face biometrics",
      status: "progress",
      progress: 50,
    });

    const verified = await mockAuth.verifyFaceKyc();
    
    if (verified) {
      setStatusPopup({
        id: "face-kyc",
        agent: "Face KYC Service",
        task: "Face Verified Successfully",
        status: "complete",
        progress: 100,
        message: "✅ Identity Confirmed",
      });

      const user = await mockAuth.login(phone, otp);
      if (user) {
        storeUser(user);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      {statusPopup && (
        <StatusPopup
          data={statusPopup}
          onClose={() => setStatusPopup(null)}
          autoDismiss={statusPopup.status === "complete" ? 2000 : 0}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-xl p-8 space-y-6 border border-border">
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">Secure Login</h1>
            <p className="text-muted-foreground">Access your loan portal</p>
          </div>

          {step === "phone" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-12 h-12 rounded-xl"
                    maxLength={10}
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOtp}
                className="w-full h-12 rounded-xl text-base"
                disabled={phone.length !== 10}
              >
                Send OTP
              </Button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 rounded-xl text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Use 123456 for demo
                </p>
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full h-12 rounded-xl text-base"
                disabled={otp.length !== 6}
              >
                Verify OTP
              </Button>
              <Button
                onClick={() => setStep("phone")}
                variant="ghost"
                className="w-full"
              >
                Change Number
              </Button>
            </motion.div>
          )}

          {step === "face" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="w-48 h-48 mx-auto rounded-full border-4 border-primary/20 relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  <motion.div
                    className="absolute inset-0 border-4 border-primary rounded-full"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      borderTopColor: "transparent",
                      borderRightColor: "transparent",
                    }}
                  />
                  <div className="absolute inset-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Shield className="w-16 h-16 text-white" />
                  </div>
                </div>
                <p className="text-center text-muted-foreground">
                  Position your face in the circle
                </p>
              </div>
              <Button
                onClick={handleFaceKyc}
                className="w-full h-12 rounded-xl text-base"
              >
                Start Face Verification
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
