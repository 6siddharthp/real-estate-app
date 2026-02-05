import { createContext, useContext, useState, ReactNode } from "react";

interface ContractContextType {
  selectedContractId: string | null;
  setSelectedContractId: (id: string | null) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  return (
    <ContractContext.Provider value={{ selectedContractId, setSelectedContractId }}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
}
