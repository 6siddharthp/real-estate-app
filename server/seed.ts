import { db } from "./db";
import {
  users,
  properties,
  contracts,
  bills,
  documents,
  notifications,
  serviceRequests,
} from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  // Create RMs
  const [rm1] = await db
    .insert(users)
    .values({
      username: "rm.michael",
      password: "demo123",
      role: "rm",
      name: "Michael Johnson",
      email: "michael.johnson@abcrealestate.com",
      phone: "+91 98765 11111",
    })
    .returning();

  const [rm2] = await db
    .insert(users)
    .values({
      username: "rm.sarah",
      password: "demo123",
      role: "rm",
      name: "Sarah Williams",
      email: "sarah.williams@abcrealestate.com",
      phone: "+91 98765 22222",
    })
    .returning();

  // Create Admin
  await db.insert(users).values({
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Admin",
    email: "admin@abcrealestate.com",
    phone: "+91 98765 00000",
  });

  // Create Customers
  const [customer1] = await db
    .insert(users)
    .values({
      username: "john.doe",
      password: "demo123",
      role: "customer",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91 98765 33333",
      assignedRmId: rm1.id,
    })
    .returning();

  const [customer2] = await db
    .insert(users)
    .values({
      username: "jane.smith",
      password: "demo123",
      role: "customer",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+91 98765 44444",
      assignedRmId: rm2.id,
    })
    .returning();

  // Create Properties
  const [prop1] = await db
    .insert(properties)
    .values({
      name: "Phoenix MarketCity - Shop G-15",
      type: "retail",
      address: "Phoenix MarketCity, LBS Marg, Kurla West",
      city: "Mumbai",
      description: "Premium retail space in high-traffic shopping mall",
    })
    .returning();

  const [prop2] = await db
    .insert(properties)
    .values({
      name: "Inorbit Mall - Kiosk K-08",
      type: "retail",
      address: "Inorbit Mall, Link Road, Malad West",
      city: "Mumbai",
      description: "Kiosk space in popular suburban mall",
    })
    .returning();

  const [prop3] = await db
    .insert(properties)
    .values({
      name: "Hiranandani Gardens - Unit 1204",
      type: "residential",
      address: "Tower B, Hiranandani Gardens, Powai",
      city: "Mumbai",
      description: "3BHK apartment with lake view",
    })
    .returning();

  const [prop4] = await db
    .insert(properties)
    .values({
      name: "Select Citywalk - Shop 2F-45",
      type: "retail",
      address: "Select Citywalk Mall, Saket",
      city: "Delhi",
      description: "Second floor retail unit in premium mall",
    })
    .returning();

  const [prop5] = await db
    .insert(properties)
    .values({
      name: "DLF Park Place - Unit 806",
      type: "residential",
      address: "DLF Park Place, Golf Course Road, Sector 54",
      city: "Gurugram",
      description: "4BHK luxury apartment",
    })
    .returning();

  // Create Contracts for Customer 1 (2 retail + 1 residential)
  const startDate1 = new Date("2023-04-01");
  const endDate1 = new Date("2026-03-31");
  const renewalDate1 = new Date("2025-10-01");

  const [contract1] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-MUM-2023-001",
      customerId: customer1.id,
      propertyId: prop1.id,
      rmId: rm1.id,
      sqft: 1200,
      rentPerMonth: "85000.00",
      securityDeposit: "510000.00",
      startDate: startDate1,
      endDate: endDate1,
      renewalDate: renewalDate1,
      rentUpliftPercent: "5.00",
      rentUpliftClause: "5% annual escalation on lease anniversary",
      status: "active",
    })
    .returning();

  const [contract2] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-MUM-2023-002",
      customerId: customer1.id,
      propertyId: prop2.id,
      rmId: rm1.id,
      sqft: 450,
      rentPerMonth: "45000.00",
      securityDeposit: "270000.00",
      startDate: new Date("2023-07-01"),
      endDate: new Date("2025-06-30"),
      renewalDate: new Date("2025-03-01"),
      rentUpliftPercent: "3.50",
      rentUpliftClause: "3.5% annual escalation",
      status: "pending_renewal",
    })
    .returning();

  const [contract3] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-MUM-2024-003",
      customerId: customer1.id,
      propertyId: prop3.id,
      rmId: rm1.id,
      sqft: 1850,
      rentPerMonth: "125000.00",
      securityDeposit: "750000.00",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2027-12-31"),
      renewalDate: new Date("2027-06-01"),
      rentUpliftPercent: "4.00",
      rentUpliftClause: "4% annual escalation starting Year 2",
      status: "active",
    })
    .returning();

  // Create Contracts for Customer 2 (1 retail + 1 residential)
  const [contract4] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-DEL-2023-004",
      customerId: customer2.id,
      propertyId: prop4.id,
      rmId: rm2.id,
      sqft: 800,
      rentPerMonth: "95000.00",
      securityDeposit: "570000.00",
      startDate: new Date("2023-06-01"),
      endDate: new Date("2026-05-31"),
      renewalDate: new Date("2025-11-01"),
      rentUpliftPercent: "6.00",
      rentUpliftClause: "6% annual escalation",
      status: "active",
    })
    .returning();

  const [contract5] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-GUR-2024-005",
      customerId: customer2.id,
      propertyId: prop5.id,
      rmId: rm2.id,
      sqft: 2400,
      rentPerMonth: "175000.00",
      securityDeposit: "1050000.00",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2027-01-31"),
      renewalDate: new Date("2026-08-01"),
      rentUpliftPercent: "5.00",
      rentUpliftClause: "5% annual escalation",
      status: "active",
    })
    .returning();

  // Create Bills for all contracts
  const monthsToSeed = [
    { month: 10, year: 2024 },
    { month: 11, year: 2024 },
    { month: 12, year: 2024 },
    { month: 1, year: 2025 },
    { month: 2, year: 2025 },
  ];

  const allContracts = [
    { contract: contract1, rent: 85000 },
    { contract: contract2, rent: 45000 },
    { contract: contract3, rent: 125000 },
    { contract: contract4, rent: 95000 },
    { contract: contract5, rent: 175000 },
  ];

  let invoiceCounter = 1001;
  for (const { contract, rent } of allContracts) {
    for (const { month, year } of monthsToSeed) {
      const isPaid = month <= 12 && year === 2024; // Oct, Nov, Dec 2024 are paid
      const isPartial = month === 1 && year === 2025; // Jan 2025 is partial for variety
      const isOverdue = month === 2 && year === 2025; // Feb 2025 is overdue

      await db.insert(bills).values({
        contractId: contract.id,
        invoiceNumber: `INV-${year}-${invoiceCounter++}`,
        month,
        year,
        amountDue: rent.toFixed(2),
        amountPaid: isPaid
          ? rent.toFixed(2)
          : isPartial
          ? (rent * 0.5).toFixed(2)
          : "0.00",
        dueDate: new Date(year, month - 1, 5),
        status: isPaid ? "paid" : isPartial ? "partial" : isOverdue ? "overdue" : "unpaid",
      });
    }
  }

  // Create Documents
  const documentTypes = [
    { category: "contract_letter", name: "Lease Agreement Letter" },
    { category: "lease_deed", name: "Registered Lease Deed" },
    { category: "lessor_kyc", name: "Lessor PAN Card" },
    { category: "noc", name: "No Objection Certificate" },
    { category: "occupancy_certificate", name: "Occupancy Certificate" },
    { category: "rent_invoice", name: "Rent Invoice - Jan 2025" },
    { category: "utility_invoice", name: "Electricity Bill - Jan 2025" },
  ];

  for (const contract of [contract1, contract2, contract3, contract4, contract5]) {
    for (const docType of documentTypes) {
      await db.insert(documents).values({
        contractId: contract.id,
        category: docType.category as any,
        name: docType.name,
        fileUrl: `/documents/${contract.leaseNumber}/${docType.category}.pdf`,
      });
    }
  }

  // Create Notifications for Customer 1
  await db.insert(notifications).values({
    userId: customer1.id,
    contractId: contract1.id,
    type: "rm_introduction",
    title: "Meet Your Relationship Manager",
    message: `Hi John, I'm Michael Johnson, your dedicated Relationship Manager for your Phoenix MarketCity lease. Feel free to reach out to me for any queries or assistance.`,
    isRead: true,
  });

  await db.insert(notifications).values({
    userId: customer1.id,
    contractId: contract2.id,
    type: "lease_expiry",
    title: "Lease Renewal Reminder",
    message: `Your lease for Inorbit Mall - Kiosk K-08 (${contract2.leaseNumber}) is due for renewal in 6 months. Please contact your RM to discuss renewal terms.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer1.id,
    contractId: contract1.id,
    type: "maintenance",
    title: "Scheduled Maintenance Notice",
    message: `Phoenix MarketCity will undergo scheduled elevator maintenance on Feb 15, 2025 from 10 PM to 6 AM. Please plan accordingly.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer1.id,
    type: "general",
    title: "Holiday Office Hours",
    message: `Our offices will be closed on Feb 26, 2025 for Mahashivratri. For urgent matters, please use the emergency helpline.`,
    isRead: false,
  });

  // Create Notifications for Customer 2
  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract4.id,
    type: "rm_introduction",
    title: "Welcome to ABC Real Estate",
    message: `Hi Jane, I'm Sarah Williams, your Relationship Manager. I'll be assisting you with your Select Citywalk and DLF Park Place leases.`,
    isRead: true,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract5.id,
    type: "maintenance",
    title: "Water Supply Disruption",
    message: `DLF Park Place will have scheduled water supply maintenance on Feb 20, 2025 from 9 AM to 3 PM. Please store water accordingly.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract4.id,
    type: "termination",
    title: "Lease Termination Terms",
    message: `As per your request, please find attached the lease termination terms and conditions for your review. Contact your RM for further discussion.`,
    isRead: false,
  });

  // Create Service Requests
  await db.insert(serviceRequests).values({
    contractId: contract1.id,
    customerId: customer1.id,
    type: "document_request",
    subject: "Request for Rent Receipts",
    description: "Please provide rent receipts for the period Oct 2024 to Dec 2024 for tax filing purposes.",
    status: "resolved",
    rmNote: "Rent receipts generated and shared via email on 15 Jan 2025.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract2.id,
    customerId: customer1.id,
    type: "billing_clarification",
    subject: "Query on CAM Charges",
    description: "I noticed an increase in CAM charges for December. Could you please provide a breakdown?",
    status: "in_progress",
    rmNote: "Requested breakdown from property management. Will update once received.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract3.id,
    customerId: customer1.id,
    type: "maintenance",
    subject: "AC Not Working",
    description: "The air conditioning unit in the living room has stopped working. Please arrange for repair.",
    status: "new",
  });

  await db.insert(serviceRequests).values({
    contractId: contract4.id,
    customerId: customer2.id,
    type: "parking_statement",
    subject: "Request for Parking Statement",
    description: "Please provide the parking allocation details and any outstanding parking charges.",
    status: "resolved",
    rmNote: "Parking statement generated and shared. No outstanding charges.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract5.id,
    customerId: customer2.id,
    type: "credit_request",
    subject: "Request for Rent Credit",
    description: "Due to water supply issues in January, requesting partial rent credit for the inconvenience caused.",
    status: "in_progress",
  });

  console.log("Database seeded successfully!");
}
