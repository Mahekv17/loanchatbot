import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getStoredUser, clearUser, User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, MessageSquare, TrendingUp, CreditCard, Calendar, IndianRupee } from "lucide-react";
import customersData from "@/data/customers.json";
import loansData from "@/data/loans.json";
import creditScoresData from "@/data/credit_scores.json";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);

    const customer = customersData.find(c => c.id === storedUser.id);
    setCustomerData(customer);

    const score = creditScoresData.find(s => s.customerId === storedUser.id);
    setCreditScore(score);

    const loans = loansData.filter(l => l.customerId === storedUser.id);
    setActiveLoans(loans);
  }, [navigate]);

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  if (!user || !customerData) return null;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LoanPortal</h1>
              <p className="text-xs text-muted-foreground">Smart Finance</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="icon">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-foreground">Welcome back, {user.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground">Here's your financial overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="border-border bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Credit Score</CardDescription>
                <CardTitle className="text-3xl font-bold text-primary">
                  {creditScore?.score || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${((creditScore?.score || 0) / 900) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">/{creditScore?.maxScore || 900}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{creditScore?.rating || "Good"}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="border-border bg-gradient-to-br from-card to-secondary/5 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Pre-Approved Limit
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-secondary">
                  ₹{(customerData.preApprovedLimit / 100000).toFixed(1)}L
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Available for instant loans
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="border-border bg-gradient-to-br from-card to-accent/5 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-2">
                  <CreditCard className="w-3 h-3" />
                  Active Loans
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-foreground">
                  {activeLoans.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {activeLoans.length > 0 ? "Loans in progress" : "No active loans"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="border-border bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Next EMI
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {activeLoans.length > 0 ? `₹${activeLoans[0].emi.toLocaleString()}` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {activeLoans.length > 0 ? activeLoans[0].nextEmiDate : "No dues"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-shimmer" 
                 style={{ backgroundSize: "200% 100%" }} />
            <CardHeader>
              <CardTitle className="text-2xl">Need a loan?</CardTitle>
              <CardDescription>
                Get instant approval with our AI-powered loan assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/apply")}
                size="lg"
                className="rounded-xl gap-2 animate-pulse-glow"
              >
                <MessageSquare className="w-5 h-5" />
                Apply via AI Assistant
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground">Your Loans</h3>
            <div className="grid gap-4">
              {activeLoans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <Card className="border-border hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{loan.type} Loan</p>
                          <p className="text-sm text-muted-foreground">Loan ID: {loan.id}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-2xl font-bold text-primary">₹{loan.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{loan.tenure} months @ {loan.interestRate}%</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-semibold">₹{loan.outstandingAmount.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
