import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ContractProvider } from "@/lib/contract-context";
import { CustomerLayout } from "@/components/customer-layout";
import { StaffLayout } from "@/components/staff-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerBills from "@/pages/customer/bills";
import CustomerDocuments from "@/pages/customer/documents";
import CustomerNotifications from "@/pages/customer/notifications";
import CustomerContact from "@/pages/customer/contact";
import CustomerContractDetail from "@/pages/customer/contract-detail";
import RMDashboard from "@/pages/rm/dashboard";
import RMCustomers from "@/pages/rm/customers";
import RMServiceRequests from "@/pages/rm/service-requests";
import RMBills from "@/pages/rm/bills";
import RMProperties from "@/pages/rm/properties";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminProperties from "@/pages/admin/properties";
import AdminContracts from "@/pages/admin/contracts";
import AdminServiceRequests from "@/pages/admin/service-requests";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function CustomerRoutes() {
  return (
    <ContractProvider>
      <CustomerLayout>
        <Switch>
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/customer/contract/:id" component={CustomerContractDetail} />
          <Route path="/customer/bills" component={CustomerBills} />
          <Route path="/customer/documents" component={CustomerDocuments} />
          <Route path="/customer/notifications" component={CustomerNotifications} />
          <Route path="/customer/contact" component={CustomerContact} />
          <Route>
            <Redirect to="/customer/dashboard" />
          </Route>
        </Switch>
      </CustomerLayout>
    </ContractProvider>
  );
}

function RMRoutes() {
  return (
    <StaffLayout>
      <Switch>
        <Route path="/rm/dashboard" component={RMDashboard} />
        <Route path="/rm/customers" component={RMCustomers} />
        <Route path="/rm/bills" component={RMBills} />
        <Route path="/rm/properties" component={RMProperties} />
        <Route path="/rm/service-requests" component={RMServiceRequests} />
        <Route>
          <Redirect to="/rm/dashboard" />
        </Route>
      </Switch>
    </StaffLayout>
  );
}

function AdminRoutes() {
  return (
    <StaffLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/properties" component={AdminProperties} />
        <Route path="/admin/contracts" component={AdminContracts} />
        <Route path="/admin/service-requests" component={AdminServiceRequests} />
        <Route>
          <Redirect to="/admin/dashboard" />
        </Route>
      </Switch>
    </StaffLayout>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    if (location !== "/login") {
      return <Redirect to="/login" />;
    }
    return <Login />;
  }

  if (location === "/login" || location === "/") {
    if (user.role === "customer") {
      return <Redirect to="/customer/dashboard" />;
    } else if (user.role === "rm") {
      return <Redirect to="/rm/dashboard" />;
    } else if (user.role === "admin") {
      return <Redirect to="/admin/dashboard" />;
    }
  }

  return (
    <Switch>
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      <Route path="/customer/*">
        {user.role === "customer" ? <CustomerRoutes /> : <Redirect to="/" />}
      </Route>
      <Route path="/rm/*">
        {user.role === "rm" ? <RMRoutes /> : <Redirect to="/" />}
      </Route>
      <Route path="/admin/*">
        {user.role === "admin" ? <AdminRoutes /> : <Redirect to="/" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
