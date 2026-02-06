import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import {
  users,
  properties,
  contracts,
  bills,
  documents,
  notifications,
  serviceRequests,
  type User,
  type InsertUser,
  type Property,
  type InsertProperty,
  type Contract,
  type InsertContract,
  type Bill,
  type InsertBill,
  type Document,
  type InsertDocument,
  type Notification,
  type InsertNotification,
  type ServiceRequest,
  type InsertServiceRequest,
  type ContractWithDetails,
  type BillWithContract,
  type DocumentWithContract,
  type NotificationWithContract,
  type ServiceRequestWithDetails,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  bulkCreateUsers(usersData: InsertUser[]): Promise<User[]>;

  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: string): Promise<void>;
  bulkCreateProperties(propertiesData: InsertProperty[]): Promise<Property[]>;

  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCustomerId(customerId: string): Promise<ContractWithDetails[]>;
  getContractsByRmId(rmId: string): Promise<ContractWithDetails[]>;
  getAllContracts(): Promise<Contract[]>;
  getAllContractsWithDetails(): Promise<(Contract & { property: Property; customer: User; rm?: User })[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  bulkCreateContracts(contractsData: InsertContract[]): Promise<Contract[]>;

  // Bills
  getBillsByContractId(contractId: string): Promise<BillWithContract[]>;
  getBillsByCustomerId(customerId: string): Promise<BillWithContract[]>;
  getBillsByRmId(rmId: string): Promise<BillWithContract[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBillStatus(id: string, status: string): Promise<Bill>;

  // Documents
  getDocumentsByContractId(contractId: string): Promise<DocumentWithContract[]>;
  getDocumentsByCustomerId(customerId: string): Promise<DocumentWithContract[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Notifications
  getNotificationsByUserId(userId: string): Promise<NotificationWithContract[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  // Service Requests
  getServiceRequestsByCustomerId(customerId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByRmId(rmId: string): Promise<ServiceRequestWithDetails[]>;
  getAllServiceRequests(): Promise<ServiceRequestWithDetails[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, status: string, rmNote?: string): Promise<void>;

  // RM Stats
  getRMStats(rmId: string): Promise<{
    totalCustomers: number;
    totalContracts: number;
    activeContracts: number;
    pendingRequests: number;
    inProgressRequests: number;
  }>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalCustomers: number;
    totalRMs: number;
    totalProperties: number;
    totalContracts: number;
    activeContracts: number;
    pendingServiceRequests: number;
  }>;

  // Customers by RM
  getCustomersByRmId(rmId: string): Promise<(User & { contracts: ContractWithDetails[] })[]>;

  // Get RM for contract
  getRMForContract(contractId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async bulkCreateUsers(usersData: InsertUser[]): Promise<User[]> {
    if (usersData.length === 0) return [];
    const created = await db.insert(users).values(usersData).returning();
    return created;
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getAllProperties(): Promise<Property[]> {
    return db.select().from(properties);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property> {
    const [updated] = await db.update(properties).set(property).where(eq(properties.id, id)).returning();
    return updated;
  }

  async deleteProperty(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async bulkCreateProperties(propertiesData: InsertProperty[]): Promise<Property[]> {
    if (propertiesData.length === 0) return [];
    const created = await db.insert(properties).values(propertiesData).returning();
    return created;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async getContractsByCustomerId(customerId: string): Promise<ContractWithDetails[]> {
    const customerContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.customerId, customerId));

    const result: ContractWithDetails[] = [];
    for (const contract of customerContracts) {
      const property = await this.getProperty(contract.propertyId);
      const rm = contract.rmId ? await this.getUser(contract.rmId) : undefined;
      if (property) {
        result.push({ ...contract, property, rm });
      }
    }
    return result;
  }

  async getContractsByRmId(rmId: string): Promise<ContractWithDetails[]> {
    const rmContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.rmId, rmId));

    const result: ContractWithDetails[] = [];
    for (const contract of rmContracts) {
      const property = await this.getProperty(contract.propertyId);
      const rm = await this.getUser(rmId);
      if (property) {
        result.push({ ...contract, property, rm });
      }
    }
    return result;
  }

  async getAllContracts(): Promise<Contract[]> {
    return db.select().from(contracts);
  }

  async getAllContractsWithDetails(): Promise<(Contract & { property: Property; customer: User; rm?: User })[]> {
    const allContracts = await db.select().from(contracts);
    const result: (Contract & { property: Property; customer: User; rm?: User })[] = [];

    for (const contract of allContracts) {
      const property = await this.getProperty(contract.propertyId);
      const customer = await this.getUser(contract.customerId);
      const rm = contract.rmId ? await this.getUser(contract.rmId) : undefined;
      if (property && customer) {
        result.push({ ...contract, property, customer, rm });
      }
    }
    return result;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [created] = await db.insert(contracts).values(contract).returning();
    return created;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract> {
    const [updated] = await db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  async bulkCreateContracts(contractsData: InsertContract[]): Promise<Contract[]> {
    if (contractsData.length === 0) return [];
    const created = await db.insert(contracts).values(contractsData).returning();
    return created;
  }

  async getBillsByContractId(contractId: string): Promise<BillWithContract[]> {
    const contractBills = await db
      .select()
      .from(bills)
      .where(eq(bills.contractId, contractId));

    const result: BillWithContract[] = [];
    for (const bill of contractBills) {
      const contract = await this.getContract(bill.contractId);
      if (contract) {
        const property = await this.getProperty(contract.propertyId);
        if (property) {
          result.push({ ...bill, contract, property });
        }
      }
    }
    return result;
  }

  async getBillsByCustomerId(customerId: string): Promise<BillWithContract[]> {
    const customerContracts = await this.getContractsByCustomerId(customerId);
    const contractIds = customerContracts.map((c) => c.id);

    if (contractIds.length === 0) return [];

    const customerBills = await db
      .select()
      .from(bills)
      .where(inArray(bills.contractId, contractIds));

    const result: BillWithContract[] = [];
    for (const bill of customerBills) {
      const contract = customerContracts.find((c) => c.id === bill.contractId);
      if (contract) {
        result.push({ ...bill, contract, property: contract.property });
      }
    }
    return result;
  }

  async getBillsByRmId(rmId: string): Promise<BillWithContract[]> {
    const rmContracts = await this.getContractsByRmId(rmId);
    const contractIds = rmContracts.map((c) => c.id);

    if (contractIds.length === 0) return [];

    const rmBills = await db
      .select()
      .from(bills)
      .where(inArray(bills.contractId, contractIds));

    const result: BillWithContract[] = [];
    for (const bill of rmBills) {
      const contract = rmContracts.find((c) => c.id === bill.contractId);
      if (contract) {
        result.push({ ...bill, contract, property: contract.property });
      }
    }
    return result;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const [created] = await db.insert(bills).values(bill).returning();
    return created;
  }

  async updateBillStatus(id: string, status: string): Promise<Bill> {
    const [updated] = await db
      .update(bills)
      .set({ status: status as any })
      .where(eq(bills.id, id))
      .returning();
    return updated;
  }

  async getDocumentsByContractId(contractId: string): Promise<DocumentWithContract[]> {
    const contractDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.contractId, contractId));

    const result: DocumentWithContract[] = [];
    for (const doc of contractDocs) {
      const contract = await this.getContract(doc.contractId);
      if (contract) {
        const property = await this.getProperty(contract.propertyId);
        if (property) {
          result.push({ ...doc, contract, property });
        }
      }
    }
    return result;
  }

  async getDocumentsByCustomerId(customerId: string): Promise<DocumentWithContract[]> {
    const customerContracts = await this.getContractsByCustomerId(customerId);
    const contractIds = customerContracts.map((c) => c.id);

    if (contractIds.length === 0) return [];

    const customerDocs = await db
      .select()
      .from(documents)
      .where(inArray(documents.contractId, contractIds));

    const result: DocumentWithContract[] = [];
    for (const doc of customerDocs) {
      const contract = customerContracts.find((c) => c.id === doc.contractId);
      if (contract) {
        result.push({ ...doc, contract, property: contract.property });
      }
    }
    return result;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async getNotificationsByUserId(userId: string): Promise<NotificationWithContract[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const result: NotificationWithContract[] = [];
    for (const notification of userNotifications) {
      if (notification.contractId) {
        const contract = await this.getContract(notification.contractId);
        if (contract) {
          const property = await this.getProperty(contract.propertyId);
          result.push({ ...notification, contract, property });
        } else {
          result.push({ ...notification });
        }
      } else {
        result.push({ ...notification });
      }
    }
    return result;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getServiceRequestsByCustomerId(customerId: string): Promise<ServiceRequest[]> {
    return db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.customerId, customerId));
  }

  async getServiceRequestsByRmId(rmId: string): Promise<ServiceRequestWithDetails[]> {
    const rmContracts = await this.getContractsByRmId(rmId);
    const contractIds = rmContracts.map((c) => c.id);

    if (contractIds.length === 0) return [];

    const requests = await db
      .select()
      .from(serviceRequests)
      .where(inArray(serviceRequests.contractId, contractIds));

    const result: ServiceRequestWithDetails[] = [];
    for (const request of requests) {
      const contract = rmContracts.find((c) => c.id === request.contractId);
      if (contract) {
        const customer = await this.getUser(request.customerId);
        if (customer) {
          result.push({ ...request, contract, property: contract.property, customer });
        }
      }
    }
    return result;
  }

  async getAllServiceRequests(): Promise<ServiceRequestWithDetails[]> {
    const requests = await db.select().from(serviceRequests);
    const result: ServiceRequestWithDetails[] = [];

    for (const request of requests) {
      const contract = await this.getContract(request.contractId);
      const customer = await this.getUser(request.customerId);
      if (contract && customer) {
        const property = await this.getProperty(contract.propertyId);
        if (property) {
          result.push({ ...request, contract, property, customer });
        }
      }
    }
    return result;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [created] = await db.insert(serviceRequests).values(request).returning();
    return created;
  }

  async updateServiceRequest(id: string, status: string, rmNote?: string): Promise<void> {
    await db
      .update(serviceRequests)
      .set({
        status: status as any,
        rmNote: rmNote || null,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id));
  }

  async getRMStats(rmId: string): Promise<{
    totalCustomers: number;
    totalContracts: number;
    activeContracts: number;
    pendingRequests: number;
    inProgressRequests: number;
  }> {
    const rmContracts = await this.getContractsByRmId(rmId);
    const customerIds = Array.from(new Set(rmContracts.map((c) => c.customerId)));
    const requests = await this.getServiceRequestsByRmId(rmId);

    return {
      totalCustomers: customerIds.length,
      totalContracts: rmContracts.length,
      activeContracts: rmContracts.filter((c) => c.status === "active").length,
      pendingRequests: requests.filter((r) => r.status === "new").length,
      inProgressRequests: requests.filter((r) => r.status === "in_progress").length,
    };
  }

  async getAdminStats(): Promise<{
    totalCustomers: number;
    totalRMs: number;
    totalProperties: number;
    totalContracts: number;
    activeContracts: number;
    pendingServiceRequests: number;
  }> {
    const allUsers = await this.getAllUsers();
    const allProperties = await this.getAllProperties();
    const allContracts = await this.getAllContracts();
    const allRequests = await this.getAllServiceRequests();

    return {
      totalCustomers: allUsers.filter((u) => u.role === "customer").length,
      totalRMs: allUsers.filter((u) => u.role === "rm").length,
      totalProperties: allProperties.length,
      totalContracts: allContracts.length,
      activeContracts: allContracts.filter((c) => c.status === "active").length,
      pendingServiceRequests: allRequests.filter((r) => r.status === "new").length,
    };
  }

  async getCustomersByRmId(rmId: string): Promise<(User & { contracts: ContractWithDetails[] })[]> {
    const rmContracts = await this.getContractsByRmId(rmId);
    const customerIds = Array.from(new Set(rmContracts.map((c) => c.customerId)));

    const result: (User & { contracts: ContractWithDetails[] })[] = [];
    for (const customerId of customerIds) {
      const customer = await this.getUser(customerId);
      if (customer) {
        const customerContracts = rmContracts.filter((c) => c.customerId === customerId);
        result.push({ ...customer, contracts: customerContracts });
      }
    }
    return result;
  }

  async getRMForContract(contractId: string): Promise<User | undefined> {
    const contract = await this.getContract(contractId);
    if (contract?.rmId) {
      return this.getUser(contract.rmId);
    }
    return undefined;
  }
}

export const storage = new DatabaseStorage();
