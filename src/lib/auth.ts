export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycCompleted: boolean;
}

export const mockAuth = {
  login: async (phone: string, otp: string): Promise<User | null> => {
    // Mock OTP validation
    if (otp === "123456") {
      return {
        id: "CUST001",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: phone,
        kycCompleted: true
      };
    }
    return null;
  },
  
  verifyFaceKyc: async (): Promise<boolean> => {
    // Mock face verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }
};

export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem("loanUser");
  return stored ? JSON.parse(stored) : null;
};

export const storeUser = (user: User) => {
  localStorage.setItem("loanUser", JSON.stringify(user));
};

export const clearUser = () => {
  localStorage.removeItem("loanUser");
};
