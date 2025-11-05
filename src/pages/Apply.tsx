import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPopup, StatusPopupData } from "@/components/StatusPopup";
import { AnimatedLoader } from "@/components/AnimatedLoader";
import { ArrowLeft, Send, Paperclip, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-confetti";
import offersData from "@/data/offers.json";
import creditScoresData from "@/data/credit_scores.json";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type LoanStep = "greeting" | "loanType" | "amount" | "tenure" | "offers" | "verification" | "creditCheck" | "documents" | "decision" | "sanction" | "complete";

const Apply = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoanStep>("greeting");
  const [statusPopup, setStatusPopup] = useState<StatusPopupData | null>(null);
  const [loanData, setLoanData] = useState<any>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate("/login");
      return;
    }
    
    addBotMessage("👋 Hi! I'm your AI loan assistant. Ready to explore loan options?");
    setTimeout(() => {
      addBotMessage("What type of loan are you looking for?");
      setCurrentStep("loanType");
    }, 1000);
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 800);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    addUserMessage(input);
    processInput(input);
    setInput("");
  };

  const processInput = (userInput: string) => {
    switch (currentStep) {
      case "loanType":
        handleLoanType(userInput);
        break;
      case "amount":
        handleAmount(userInput);
        break;
      case "tenure":
        handleTenure(userInput);
        break;
      case "offers":
        handleOfferSelection(userInput);
        break;
      case "documents":
        handleDocuments();
        break;
      default:
        addBotMessage("Let me help you with that...");
    }
  };

  const handleLoanType = (type: string) => {
    const loanType = type.toLowerCase().includes("personal") ? "Personal" 
                   : type.toLowerCase().includes("home") ? "Home" 
                   : "Personal";
    
    setLoanData({ ...loanData, type: loanType });
    
    setStatusPopup({
      id: "ticket",
      agent: "System",
      task: "Creating ticket",
      status: "progress",
      progress: 50,
      message: `Ticket #OFFER-${Math.floor(1000 + Math.random() * 9000)} raised`
    });

    setTimeout(() => {
      setStatusPopup({
        id: "ticket",
        agent: "System",
        task: "Ticket Created",
        status: "complete",
        progress: 100
      });
      
      addBotMessage(`Great! You've selected a ${loanType} loan. How much would you like to borrow?`);
      addBotMessage("You can enter an amount between ₹50,000 to ₹10,00,000");
      setCurrentStep("amount");
    }, 1500);
  };

  const handleAmount = (amountStr: string) => {
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ""));
    
    if (amount < 50000 || amount > 1000000) {
      toast.error("Please enter an amount between ₹50,000 and ₹10,00,000");
      return;
    }

    setLoanData({ ...loanData, amount });
    addBotMessage(`Perfect! ₹${amount.toLocaleString()} it is.`);
    
    setTimeout(() => {
      addBotMessage("What tenure are you comfortable with? (in months, e.g., 12, 24, 36)");
      setCurrentStep("tenure");
    }, 1000);
  };

  const handleTenure = (tenureStr: string) => {
    const tenure = parseInt(tenureStr);
    
    if (tenure < 12 || tenure > 72) {
      toast.error("Please enter a tenure between 12 and 72 months");
      return;
    }

    setLoanData({ ...loanData, tenure });
    
    setStatusPopup({
      id: "offers",
      agent: "Sales Agent",
      task: "Fetching offers from Offer-Mart",
      status: "progress",
      progress: 63
    });

    setTimeout(() => {
      setStatusPopup({
        id: "offers",
        agent: "Sales Agent",
        task: "Offers Retrieved",
        status: "complete",
        progress: 100
      });

      const filteredOffers = offersData.filter(o => 
        o.loanType === loanData.type &&
        o.minAmount <= loanData.amount &&
        o.maxAmount >= loanData.amount
      );

      setTimeout(() => {
        addBotMessage(`I found ${filteredOffers.length} offers for you:`);
        filteredOffers.forEach((offer, i) => {
          const emi = calculateEMI(loanData.amount, offer.interestRate, tenure);
          setTimeout(() => {
            addBotMessage(
              `\n📊 Offer ${i + 1}\n` +
              `Interest Rate: ${offer.interestRate}%\n` +
              `Processing Fee: ${offer.processingFee}%\n` +
              `EMI: ₹${emi.toLocaleString()}/month\n` +
              `Features: ${offer.features.join(", ")}`
            );
          }, i * 500);
        });

        setTimeout(() => {
          addBotMessage("Which offer would you like to proceed with? (Reply 1, 2, etc.)");
          setCurrentStep("offers");
        }, filteredOffers.length * 500 + 1000);
      }, 1000);
    }, 2000);
  };

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const r = rate / (12 * 100);
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
  };

  const handleOfferSelection = (selection: string) => {
    const offerIndex = parseInt(selection) - 1;
    
    if (offerIndex < 0 || offerIndex >= offersData.length) {
      toast.error("Please select a valid offer number");
      return;
    }

    const selectedOffer = offersData[offerIndex];
    setLoanData({ ...loanData, offer: selectedOffer });
    
    addBotMessage(`Excellent choice! Let me verify your details...`);
    
    // Verification step
    setStatusPopup({
      id: "verification",
      agent: "Verification Agent",
      task: "Confirming KYC from CRM",
      status: "progress",
      progress: 88
    });

    setTimeout(() => {
      setStatusPopup({
        id: "verification",
        agent: "Verification Agent",
        task: "KYC Confirmed",
        status: "complete",
        progress: 100,
        message: "✅ All details verified"
      });

      setTimeout(() => {
        runCreditCheck();
      }, 2000);
    }, 2000);
  };

  const runCreditCheck = () => {
    setStatusPopup({
      id: "credit",
      agent: "Underwriting Agent",
      task: "Fetching credit score",
      status: "progress",
      progress: 54,
      reroute: "Credit Bureau"
    });

    setTimeout(() => {
      const user = getStoredUser();
      const creditScore = creditScoresData.find(s => s.customerId === user?.id);
      
      setStatusPopup({
        id: "credit",
        agent: "Underwriting Agent",
        task: "Credit Check Complete",
        status: "complete",
        progress: 100
      });

      setTimeout(() => {
        addBotMessage(`Your credit score is ${creditScore?.score}/900 - ${creditScore?.rating}! 🎉`);
        
        setTimeout(() => {
          addBotMessage("Please upload your income proof document to continue.");
          setCurrentStep("documents");
        }, 1500);
      }, 1500);
    }, 3000);
  };

  const handleDocuments = () => {
    setStatusPopup({
      id: "ocr",
      agent: "Document Service",
      task: "Parsing document with OCR",
      status: "progress",
      progress: 42
    });

    setTimeout(() => {
      setStatusPopup({
        id: "ocr",
        agent: "Document Service",
        task: "Document Verified",
        status: "complete",
        progress: 100,
        message: "Income verified: EMI < 50% of salary ✅"
      });

      setTimeout(() => {
        makeDecision();
      }, 2000);
    }, 2500);
  };

  const makeDecision = () => {
    const user = getStoredUser();
    const creditScore = creditScoresData.find(s => s.customerId === user?.id);
    
    if (creditScore && creditScore.score >= 700) {
      setStatusPopup({
        id: "decision",
        agent: "Underwriting Agent",
        task: "Final Decision",
        status: "complete",
        progress: 100,
        message: "✅ APPROVED"
      });

      setTimeout(() => {
        setShowConfetti(true);
        addBotMessage("🎉 Congratulations! Your loan has been APPROVED!");
        
        setTimeout(() => {
          generateSanction();
        }, 2000);
      }, 1500);
    } else {
      setStatusPopup({
        id: "decision",
        agent: "Underwriting Agent",
        task: "Decision",
        status: "error",
        message: "❌ Rejected - Credit score below threshold"
      });

      setTimeout(() => {
        addBotMessage("Unfortunately, your application couldn't be approved at this time due to credit score requirements.");
        setCurrentStep("complete");
      }, 2000);
    }
  };

  const generateSanction = () => {
    setStatusPopup({
      id: "sanction",
      agent: "Sanction Agent",
      task: "Generating sanction letter",
      status: "progress",
      progress: 75
    });

    setTimeout(() => {
      setStatusPopup({
        id: "sanction",
        agent: "Sanction Agent",
        task: "Sanction Letter Ready",
        status: "complete",
        progress: 100
      });

      setTimeout(() => {
        addBotMessage("📄 Your sanction letter is ready!");
        addBotMessage(
          `Loan Amount: ₹${loanData.amount?.toLocaleString()}\n` +
          `Tenure: ${loanData.tenure} months\n` +
          `Interest Rate: ${loanData.offer?.interestRate}%\n` +
          `Processing Fee: ${loanData.offer?.processingFee}%`
        );
        
        setTimeout(() => {
          disburseLoan();
        }, 2000);
      }, 1500);
    }, 2000);
  };

  const disburseLoan = () => {
    setStatusPopup({
      id: "disburse",
      agent: "Disbursement Service",
      task: "Transferring funds to your account",
      status: "progress",
      progress: 65
    });

    setTimeout(() => {
      setStatusPopup({
        id: "disburse",
        agent: "Disbursement Service",
        task: "Funds Disbursed",
        status: "complete",
        progress: 100,
        message: "💸 ₹" + loanData.amount?.toLocaleString() + " credited successfully"
      });

      setTimeout(() => {
        setShowConfetti(false);
        addBotMessage("✅ Funds have been credited to your account successfully!");
        addBotMessage("You can view your loan details in the dashboard.");
        setCurrentStep("complete");
      }, 2000);
    }, 3000);
  };

  const quickReplies = currentStep === "loanType" 
    ? ["Personal Loan", "Home Loan", "Auto Loan"]
    : currentStep === "amount"
    ? ["₹100,000", "₹200,000", "₹500,000"]
    : currentStep === "tenure"
    ? ["12 months", "24 months", "36 months"]
    : currentStep === "offers"
    ? ["1", "2"]
    : currentStep === "documents"
    ? ["Upload Document"]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex flex-col">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      {statusPopup && (
        <StatusPopup
          data={statusPopup}
          onClose={() => setStatusPopup(null)}
          autoDismiss={statusPopup.status === "complete" ? 2000 : 0}
        />
      )}

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border p-4 flex items-center gap-4">
        <Button onClick={() => navigate("/dashboard")} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">AI Loan Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by smart agents</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, x: message.role === "user" ? 20 : -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-primary to-secondary text-white ml-12"
                    : "bg-card border border-border text-card-foreground mr-12"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <AnimatedLoader type="dots" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <motion.div
                key={reply}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={() => {
                    setInput(reply);
                    setTimeout(() => handleSend(), 100);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {reply}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-card/80 backdrop-blur-lg border-t border-border">
        <div className="flex gap-2">
          {currentStep === "documents" && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => {
                toast.success("Document uploaded successfully!");
                handleDocuments();
              }}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              currentStep === "complete" 
                ? "Application complete!" 
                : "Type your message..."
            }
            disabled={currentStep === "complete" || isTyping}
            className="flex-1 h-12 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || currentStep === "complete" || isTyping}
            size="icon"
            className="shrink-0 h-12 w-12 rounded-xl"
          >
            {currentStep === "complete" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {currentStep === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl"
            >
              Return to Dashboard
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Apply;
