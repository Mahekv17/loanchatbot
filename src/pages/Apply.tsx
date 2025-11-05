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
import customersData from "@/data/customers.json";

const Apply = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoanStep>("greeting");
  const [statusPopup, setStatusPopup] = useState<StatusPopupData | null>(null);
  const [loanData, setLoanData] = useState<any>({});
  const loanDataRef = useRef<any>({});
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sanctionDoc, setSanctionDoc] = useState<any | null>(null);
  const [esignInProgress, setEsignInProgress] = useState(false);

  // new states
  const [consentRequested, setConsentRequested] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [ocrResult, setOcrResult] = useState<{ salaryMonthly?: number; confidence?: number } | null>(null);
  const [docVerified, setDocVerified] = useState(false);
  const [creditScoreObj, setCreditScoreObj] = useState<any | null>(null);

  // missing ref used for autoscroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // helpers for sanction card: view & download (simple HTML/text fallback)
  const downloadSanction = (doc: any) => {
    if (!doc) return;
    const content = `Sanction Letter\n\nID: ${doc.id}\nCustomer: ${doc.customer}\nAmount: ₹${doc.amount.toLocaleString()}\nTenure: ${doc.tenure} months\nInterest: ${doc.interestRate}%\n\nTerms:\n- ${doc.terms.join("\n- ")}\n\nGenerated: ${doc.generatedAt}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const viewSanction = (doc: any) => {
    if (!doc) return;
    const html = `
      <html><head><title>Sanction Letter - ${doc.id}</title>
        <style>body{font-family:system-ui,Arial;padding:24px;color:#111} h1{font-size:18px}</style>
      </head>
      <body>
        <h1>Sanction Letter — ${doc.id}</h1>
        <p><strong>Customer:</strong> ${doc.customer}</p>
        <p><strong>Amount:</strong> ₹${doc.amount.toLocaleString()}</p>
        <p><strong>Tenure:</strong> ${doc.tenure} months</p>
        <p><strong>Interest:</strong> ${doc.interestRate}%</p>
        <h3>Terms</h3>
        <ul>${doc.terms.map((t: string) => `<li>${t}</li>`).join("")}</ul>
        <p style="margin-top:18px;color:#666">Generated: ${doc.generatedAt}</p>
      </body></html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const loanTypes = [
    { id: "personal", label: "Personal Loan", icon: "💰" },
    { id: "home", label: "Home Loan", icon: "🏠" },
    { id: "auto", label: "Auto Loan", icon: "🚗" },
    { id: "education", label: "Education Loan", icon: "🎓" },
    { id: "business", label: "Business Loan", icon: "💼" },
    { id: "gold", label: "Gold Loan", icon: "🪙" },
  ];

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Greeting with Arya and interactive chips
    const name = user.name?.split(" ")[0] ?? "there";
    addBotMessage(`👋 Hi there! Welcome back, ${name}. I’m Arya — your personal loan assistant. Let’s explore how I can help today!`);
    // keep user in greeting step so chips appear
    setCurrentStep("greeting");
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // keep ref in sync whenever we update loanData via helper
  const updateLoanData = (patch: Record<string, any>) => {
    setLoanData((prev) => {
      const next = { ...prev, ...patch };
      loanDataRef.current = next;
      return next;
    });
    // also update ref if called directly
    loanDataRef.current = { ...loanDataRef.current, ...patch };
  };

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
    const text = userInput?.toLowerCase?.() ?? "";
    // handle consent step explicitly
    if (currentStep === "consent") {
      if (text.includes("agree") || text.includes("i agree") || text.includes("yes")) {
        addBotMessage("Thanks — getting your consent recorded and proceeding with a soft credit pull.");
        // emit ticket
        window.dispatchEvent(new CustomEvent("TICKET_RAISED", { detail: { id: "TKT-BUREAU", step: "CONSENT", ts: Date.now() } }));
        setConsentGiven(true);
        setConsentRequested(false);
        // small delay and start credit fetch
        setTimeout(() => {
          runCreditCheck();
        }, 800);
        return;
      } else {
        addBotMessage("I need your consent to fetch a soft credit score. Select 'I agree' to continue.");
        return;
      }
    }

    switch (currentStep) {
      case "greeting":
        {
          const c = userInput?.toLowerCase?.() ?? "";
          if (c.includes("apply")) {
            addBotMessage("Great! What kind of loan are you interested in?");
            setCurrentStep("loanType");
            return;
          }
          if (c.includes("check")) {
            addBotMessage("Opening your loans dashboard...");
            setTimeout(() => navigate("/dashboard"), 600);
            return;
          }
          if (c.includes("improve")) {
            addBotMessage("Here are a few tips to improve your credit: pay EMIs on time, reduce credit utilisation, and avoid unnecessary credit checks.");
            return;
          }
          if (c.includes("statement")) {
            addBotMessage("Preparing your statement... Redirecting to Dashboard.");
            setTimeout(() => navigate("/dashboard"), 600);
            return;
          }
          addBotMessage("I didn't catch that — choose one of the options or type your request.");
        }
        break;
      case "loanType":
        handleLoanType(userInput);
        break;
      case "amount":
        // allow quick intents like "search" while in the amount step
        if (text.includes("search") || text.includes("search offers") || text.includes("searchoffers")) {
          // user wants to search offers for the current amount/tenure
          runPreEligibility();
          return;
        }
        handleAmount(userInput);
        break;
      // user asked explicitly to "search offers" from amount/EMI context
      case "amount_search":
        runPreEligibility();
        break;
      case "tenure":
        handleTenure(userInput);
        break;
      case "offers":
        handleOfferSelection(userInput);
        break;
      case "verification":
        // no-op (verification handled internally)
        addBotMessage("Verification in progress...");
        break;
      case "documents":
        handleDocuments();
        break;
      case "rejected":
        handleRejectionChoice(userInput);
        break;
      default:
        addBotMessage("Let me help you with that...");
    }
  };

  // Pre-eligibility check (uses customers.json)
  const runPreEligibility = () => {
    const user = getStoredUser();
    const cust = customersData.find((c: any) => c.id === user?.id);
    const requested = loanDataRef.current.amount ?? 0;
    
    // emit event
    window.dispatchEvent(new CustomEvent("TICKET_RAISED", { detail: { id: "TKT-INIT", step: "GREET", ts: Date.now() } }));
    window.dispatchEvent(new CustomEvent("AGENT_START", { detail: { agent: "Underwriting", task: "PRECHECK", pct: 0, ts: Date.now() } }));

    setStatusPopup({
      id: "preelig",
      agent: "Underwriting Agent",
      task: "Running pre-check",
      status: "progress",
      progress: 32
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("AGENT_PROGRESS", { detail: { agent: "Underwriting", task: "PRECHECK", pct: 100, ts: Date.now() } }));
      setStatusPopup({
        id: "preelig",
        agent: "Underwriting Agent",
        task: "Pre-check complete",
        status: "complete",
        progress: 100
      });

      const limit = cust?.preApprovedLimit ?? 0;
      addBotMessage(`Pre-check result: your pre-approved limit is ₹${limit.toLocaleString()}.`);

      if (requested <= limit) {
        // instant path
        window.dispatchEvent(new CustomEvent("DECISION", { detail: { status: "PRE_APPROVED", ts: Date.now() } }));
        addBotMessage("🎉 You’re already pre-approved for this amount! I'll proceed to create the sanction.");
        // immediately approve → sanction
        setLoanData(prev => ({ ...prev, status: "approved" }));
        loanDataRef.current.status = "approved";
        setCurrentStep("complete");
        setTimeout(() => {
          setShowConfetti(true);
          addBotMessage("🎉 Congratulations! Your loan has been APPROVED!");
          setTimeout(() => generateSanction(), 900);
        }, 800);
        return;
      }

      // second branch: within 2x limit => require credit pull + docs
      if (requested <= (limit * 2)) {
        addBotMessage("Your request is above pre-approved limit — we need a soft credit pull and may ask for document upload.");
        // ask consent before credit bureau pull
        setConsentRequested(true);
        setCurrentStep("consent");
        addBotMessage("I need your permission to do a soft credit bureau inquiry. Reply 'I agree' to continue.");
        return;
      }

      // otherwise -> manual review / reject
      addBotMessage("This request exceeds our instant eligibility thresholds. I'll create a manual review ticket and our team will contact you.");
      window.dispatchEvent(new CustomEvent("TICKET_RAISED", { detail: { id: `TKT-REVIEW-${Date.now()}`, step: "MANUAL_REVIEW", ts: Date.now() } }));
      setCurrentStep("rejected");
    }, 1100);
  };

  const handleLoanType = (type: string) => {
    const loanType = type.toLowerCase().includes("personal") ? "Personal" 
                   : type.toLowerCase().includes("home") ? "Home" 
                   : type.toLowerCase().includes("auto") ? "Auto"
                   : type.toLowerCase().includes("education") ? "Education"
                   : type.toLowerCase().includes("business") ? "Business"
                   : type.toLowerCase().includes("gold") ? "Gold"
                   : "Personal";
    
    // use helper to update state + ref
    updateLoanData({ type: loanType });
    
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
    const raw = amountStr?.toString?.() ?? "";
    const amount = parseInt(raw.replace(/[^0-9]/g, ""), 10);

    // guard against NaN when user types a non-numeric intent like "Search offers"
    if (Number.isNaN(amount)) {
      // if user entered something non-numeric but intended an action, suggest the correct actions
      addBotMessage("I didn't recognize the amount. Reply with a number (e.g., 150000) or click a quick amount like ₹100,000. Or reply 'Search offers' to continue.");
      return;
    }

    if (amount < 50000 || amount > 1000000) {
      toast.error("Please enter an amount between ₹50,000 and ₹10,00,000");
      return;
    }

    // update via helper so ref is current
    updateLoanData({ amount });
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

    // ensure tenure stored
    updateLoanData({ tenure });

    // Provide live EMI estimate (simple immediate feedback)
    const principal = loanDataRef.current.amount ?? 0;
    const dummyRate = 13.5; // placeholder until offers reprice
    if (principal && tenure) {
      const liveEmi = calculateEMI(principal, dummyRate, tenure);
      addBotMessage(`Estimated EMI for ₹${principal.toLocaleString()} over ${tenure} months (at ~${dummyRate}%): ₹${liveEmi.toLocaleString()}/month.`);
      addBotMessage("Would you like me to search offers for this amount? (Reply 'Search offers' or 'Change amount')");
    }

    setCurrentStep("amount"); // remain in amount so user can pick "Search offers"
  };

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const r = rate / (12 * 100);
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
  };

  // Credit pull flow (must be called after consent)
  const runCreditCheck = () => {
    // ensure consent is given (safety)
    if (!consentGiven) {
      addBotMessage("I need your consent before I can fetch credit score. Please reply 'I agree' to proceed.");
      setCurrentStep("consent");
      return;
    }

    window.dispatchEvent(new CustomEvent("AGENT_START", { detail: { agent: "Underwriting", task: "CREDIT_PULL", pct: 0, ts: Date.now() } }));
    setStatusPopup({
      id: "credit",
      agent: "Underwriting Agent",
      task: "Pulling credit score",
      status: "progress",
      progress: 8,
      reroute: "Credit Bureau"
    });

    setTimeout(() => {
      const user = getStoredUser();
      const creditScore = creditScoresData.find(s => s.customerId === user?.id);
      setCreditScoreObj(creditScore);
      window.dispatchEvent(new CustomEvent("AGENT_PROGRESS", { detail: { agent: "Underwriting", task: "CREDIT_PULL", pct: 64, ts: Date.now() } }));

      setTimeout(() => {
        setStatusPopup({
          id: "credit",
          agent: "Underwriting Agent",
          task: "Credit Check Complete",
          status: "complete",
          progress: 100
        });

        addBotMessage(`Score fetched: ${creditScore?.score}/900 — ${creditScore?.rating}.`);
        window.dispatchEvent(new CustomEvent("AGENT_DONE", { detail: { agent: "Underwriting", task: "CREDIT_PULL", ts: Date.now() } }));

        // After credit pull, lookup offers relevant to the customer's eligibility
        const currentLoan = loanDataRef.current;
        const filteredOffers = offersData.filter(o =>
          o.loanType === currentLoan.type &&
          currentLoan.amount >= o.minAmount &&
          currentLoan.amount <= o.maxAmount
        );

        setAvailableOffers(filteredOffers);

        setTimeout(() => {
          if (filteredOffers.length > 0) {
            addBotMessage(`I found ${filteredOffers.length} offers that fit your request — select one to continue.`);
            const markerId = `offers-${Date.now()}`;
            setMessages(prev => [
              ...prev,
              {
                id: markerId,
                role: "assistant",
                content: "__OFFERS__",
                timestamp: new Date()
              }
            ]);
            // make explicit instruction so user knows how to choose
            setTimeout(() => {
              addBotMessage("Please pick an offer to continue — reply with the offer number (e.g. 1) or click Select Offer on a card.");
            }, 200);
            setCurrentStep("offers");
          } else {
            addBotMessage("No exact offers found for this amount. I can suggest alternatives or you can adjust the amount.");
            setCurrentStep("amount");
          }
        }, 700);
      }, 900);
    }, 1200);
  };

  // Inline: OfferCarousel — displays availableOffers (if any) as selectable cards
  const OfferCarousel = ({ offers }: { offers: any[] }) => {
    if (!offers || offers.length === 0) return null;
    return (
      <div className="px-2 py-3">
        <div className="offer-carousel">
          {offers.map((offer, idx) => (
            <div key={offer.id} className="offer-card relative">
              <div className="absolute left-3 top-3 rounded-full bg-primary px-2 py-1 text-xs text-white font-semibold">#{idx + 1}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Offer</div>
                  <div className="text-lg font-semibold">{offer.loanType} • {offer.id}</div>
                </div>
                <div className="tag">{offer.interestRate}%</div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-sm text-muted-foreground">Amount range</div>
                <div className="font-medium">₹{offer.minAmount.toLocaleString()} - ₹{offer.maxAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Tenure options: {offer.tenure.slice(0,3).join(", ")}{offer.tenure.length>3?"…":""}</div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    // call same handler but via carousel button (selection index as string)
                    handleOfferSelection((idx + 1).toString());
                  }}
                  className="inline-flex items-center gap-2 btn-cta-lg"
                >
                  Select Offer
                </button>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Processing Fee</div>
                  <div className="font-medium">{offer.processingFee}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const greetingChips = [
    { key: "apply", label: "🏦 Apply for a New Loan" },
    { key: "check", label: "💳 Check Existing Loans" },
    { key: "improve", label: "📈 Improve Credit Score" },
    { key: "statement", label: "🧾 Download Statement" }
  ];

  // quick replies: include consent option when consentRequested
  const quickRepliesForStep = () => {
    if (currentStep === "greeting") return greetingChips;
    if (currentStep === "consent") return [{ key: "agree", label: "I agree (soft pull)" }, { key: "no", label: "Not now" }];
    if (currentStep === "loanType") return loanTypes.map(lt => ({ key: lt.id, label: `${lt.icon} ${lt.label}` }));
    if (currentStep === "amount") return [{ key: "100k", label: "₹100,000" }, { key: "200k", label: "₹200,000" }, { key: "500k", label: "₹500,000" }];
    if (currentStep === "tenure") return [{ key: "12", label: "12 months" }, { key: "24", label: "24 months" }, { key: "36", label: "36 months" }];
    if (currentStep === "offers") return [{ key: "1", label: "1" }, { key: "2", label: "2" }];
    if (currentStep === "documents") return [{ key: "upload", label: "Upload Document" }];
    if (currentStep === "rejected") return [{ key: "appeal", label: "Appeal decision" }, { key: "support", label: "Contact support" }, { key: "reapply", label: "Reapply later" }, { key: "coapp", label: "Add co-applicant" }];
    return [];
  };

  return (
    <div className="chat-hero">
      <div className="chat-container">
        {/* header */}
        <div className="chat-header">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">AI Loan Assistant</h1>
            <p className="text-xs text-muted-foreground">Conversational loan underwriting</p>
          </div>
        </div>

        {/* messages area */}
        <div className="chat-messages" role="region" aria-live="polite" aria-atomic="false">
          {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
          {statusPopup && (
            <StatusPopup data={statusPopup} onClose={() => setStatusPopup(null)} autoDismiss={statusPopup.status === "complete" ? 2000 : 0} />
          )}

          <AnimatePresence>
            {messages.map((message, i) => {
              // defensive normalization
              const content = typeof message.content === "string" ? message.content : String(message.content ?? "");
              const tsDate =
                message?.timestamp instanceof Date ? message.timestamp : message?.timestamp ? new Date(message.timestamp) : new Date();

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
                  className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role !== "user" && (
                    <div className="chat-avatar" aria-hidden>
                      {content.startsWith("👋") ? "AI" : "AG"}
                    </div>
                  )}

                  {/* Special inline markers */}
                  {content === "__OFFERS__" ? (
                    <div className="chat-bubble bot w-full">
                      <div className="text-sm mb-2">Here are the offers we found — select one to proceed:</div>
                      <OfferCarousel offers={availableOffers} />
                      <div className="chat-meta">{tsDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ) : content === "__SANCTION__" ? (
                    <div className="chat-bubble bot w-full">
                      <div className="sanction-card">
                        <div className="text-lg font-semibold mb-2">Sanction Letter</div>
                        <div className="text-sm text-muted-foreground mb-3">Your loan has been approved. View or download the sanction letter below.</div>
                        <div className="flex gap-2 justify-center">
                          <button className="btn-cta px-4 py-2" onClick={() => viewSanction(sanctionDoc)}>View</button>
                          <button className="btn-cta px-4 py-2" onClick={() => downloadSanction(sanctionDoc)}>Download</button>
                          <button className="btn-cta px-4 py-2" onClick={() => startESign()}>Proceed to eSign</button>
                        </div>
                        <div className="chat-meta mt-3">{tsDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ) : (
                    <div className={`chat-bubble ${message.role === "user" ? "user" : "bot"}`}>
                      <div className="whitespace-pre-wrap text-sm">{content}</div>
                      <div className="chat-meta">{tsDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  )}

                  {message.role === "user" && (
                    <div className="chat-avatar" aria-hidden>
                      U
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="chat-avatar" aria-hidden>AI</div>
              <div className="chat-bubble bot">
                <div className="typing" aria-hidden>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* quick-replies area (compact) */}
        {quickRepliesForStep().length > 0 && (
          <div className="px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {quickRepliesForStep().map((chip: any, index: number) => (
                <motion.div key={chip.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}>
                  <Button
                    onClick={() => {
                      setInput(chip.label);
                      setTimeout(() => handleSend(), 120);
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-full quick-chip"
                    aria-label={chip.label}
                  >
                    <span className="chip-content text-sm font-medium">{chip.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* input area */}
        <div className="chat-input">
          {currentStep === "documents" && (
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => { toast.success("Document uploaded successfully!"); handleDocuments(); }}>
              <Paperclip className="w-5 h-5" />
            </Button>
          )}
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} placeholder={currentStep === "complete" ? "Application complete!" : "Type your message..."} disabled={currentStep === "complete" || isTyping} className="input" />
          <button onClick={handleSend} className="btn-cta-lg" aria-label="Send">
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Apply;
