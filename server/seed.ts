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

  // Create 10 Properties (5 per customer)
  // Properties for John Doe
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
      name: "High Street Phoenix - Shop F-22",
      type: "retail",
      address: "High Street Phoenix, Lower Parel",
      city: "Mumbai",
      description: "Premium fashion retail outlet in iconic mall",
    })
    .returning();

  const [prop5] = await db
    .insert(properties)
    .values({
      name: "Lodha Bellezza - Unit 1501",
      type: "residential",
      address: "Lodha Bellezza, Kukatpally",
      city: "Hyderabad",
      description: "4BHK penthouse with city skyline view",
    })
    .returning();

  // Properties for Jane Smith
  const [prop6] = await db
    .insert(properties)
    .values({
      name: "Select Citywalk - Shop 2F-45",
      type: "retail",
      address: "Select Citywalk Mall, Saket",
      city: "Delhi",
      description: "Second floor retail unit in premium mall",
    })
    .returning();

  const [prop7] = await db
    .insert(properties)
    .values({
      name: "DLF Park Place - Unit 806",
      type: "residential",
      address: "DLF Park Place, Golf Course Road, Sector 54",
      city: "Gurugram",
      description: "4BHK luxury apartment with golf course view",
    })
    .returning();

  const [prop8] = await db
    .insert(properties)
    .values({
      name: "Ambience Mall - Shop GF-18",
      type: "retail",
      address: "Ambience Mall, Vasant Kunj",
      city: "Delhi",
      description: "Ground floor anchor store space",
    })
    .returning();

  const [prop9] = await db
    .insert(properties)
    .values({
      name: "DLF Cyber Hub - Office 401",
      type: "retail",
      address: "DLF Cyber Hub, DLF Cyber City",
      city: "Gurugram",
      description: "Commercial office space in IT hub",
    })
    .returning();

  const [prop10] = await db
    .insert(properties)
    .values({
      name: "Emaar Palm Heights - Unit 2203",
      type: "residential",
      address: "Emaar Palm Heights, Sector 77",
      city: "Gurugram",
      description: "3BHK premium apartment with club facilities",
    })
    .returning();

  // Create 5 Contracts for John Doe
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
      startDate: new Date("2023-04-01"),
      endDate: new Date("2026-03-31"),
      renewalDate: new Date("2025-10-01"),
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

  const [contract4John] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-MUM-2024-004",
      customerId: customer1.id,
      propertyId: prop4.id,
      rmId: rm1.id,
      sqft: 950,
      rentPerMonth: "115000.00",
      securityDeposit: "690000.00",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2027-02-28"),
      renewalDate: new Date("2026-09-01"),
      rentUpliftPercent: "5.00",
      rentUpliftClause: "5% annual escalation",
      status: "active",
    })
    .returning();

  const [contract5John] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-HYD-2024-005",
      customerId: customer1.id,
      propertyId: prop5.id,
      rmId: rm1.id,
      sqft: 2800,
      rentPerMonth: "185000.00",
      securityDeposit: "1110000.00",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2027-05-31"),
      renewalDate: new Date("2026-12-01"),
      rentUpliftPercent: "4.50",
      rentUpliftClause: "4.5% annual escalation",
      status: "active",
    })
    .returning();

  // Create 5 Contracts for Jane Smith
  const [contract1Jane] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-DEL-2023-006",
      customerId: customer2.id,
      propertyId: prop6.id,
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

  const [contract2Jane] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-GUR-2024-007",
      customerId: customer2.id,
      propertyId: prop7.id,
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

  const [contract3Jane] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-DEL-2024-008",
      customerId: customer2.id,
      propertyId: prop8.id,
      rmId: rm2.id,
      sqft: 1500,
      rentPerMonth: "135000.00",
      securityDeposit: "810000.00",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2026-01-14"),
      renewalDate: new Date("2025-07-15"),
      rentUpliftPercent: "4.00",
      rentUpliftClause: "4% annual escalation",
      status: "pending_renewal",
    })
    .returning();

  const [contract4Jane] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-GUR-2024-009",
      customerId: customer2.id,
      propertyId: prop9.id,
      rmId: rm2.id,
      sqft: 3200,
      rentPerMonth: "225000.00",
      securityDeposit: "1350000.00",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2029-03-31"),
      renewalDate: new Date("2028-10-01"),
      rentUpliftPercent: "5.50",
      rentUpliftClause: "5.5% annual escalation",
      status: "active",
    })
    .returning();

  const [contract5Jane] = await db
    .insert(contracts)
    .values({
      leaseNumber: "ABC-GUR-2024-010",
      customerId: customer2.id,
      propertyId: prop10.id,
      rmId: rm2.id,
      sqft: 1950,
      rentPerMonth: "145000.00",
      securityDeposit: "870000.00",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2027-06-30"),
      renewalDate: new Date("2027-01-01"),
      rentUpliftPercent: "4.00",
      rentUpliftClause: "4% annual escalation",
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
    { contract: contract4John, rent: 115000 },
    { contract: contract5John, rent: 185000 },
    { contract: contract1Jane, rent: 95000 },
    { contract: contract2Jane, rent: 175000 },
    { contract: contract3Jane, rent: 135000 },
    { contract: contract4Jane, rent: 225000 },
    { contract: contract5Jane, rent: 145000 },
  ];

  let invoiceCounter = 1001;
  for (const { contract, rent } of allContracts) {
    for (const { month, year } of monthsToSeed) {
      const isPaid = month <= 12 && year === 2024;
      const isPartial = month === 1 && year === 2025;
      const isOverdue = month === 2 && year === 2025;

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

  // Create Documents - Extended list with more document types
  const documentTypes = [
    { category: "contract_letter", name: "Lease Agreement Letter" },
    { category: "contract_letter", name: "Amendment Letter - Rent Revision" },
    { category: "lease_deed", name: "Registered Lease Deed" },
    { category: "lease_deed", name: "Lease Deed - Annexure A" },
    { category: "lessor_kyc", name: "Lessor PAN Card" },
    { category: "lessor_kyc", name: "Lessor Aadhaar Card" },
    { category: "lessor_kyc", name: "Lessor Address Proof" },
    { category: "noc", name: "No Objection Certificate - Fire Safety" },
    { category: "noc", name: "No Objection Certificate - Building" },
    { category: "occupancy_certificate", name: "Occupancy Certificate" },
    { category: "occupancy_certificate", name: "Completion Certificate" },
    { category: "rent_invoice", name: "Rent Invoice - Oct 2024" },
    { category: "rent_invoice", name: "Rent Invoice - Nov 2024" },
    { category: "rent_invoice", name: "Rent Invoice - Dec 2024" },
    { category: "rent_invoice", name: "Rent Invoice - Jan 2025" },
    { category: "utility_invoice", name: "Electricity Bill - Oct 2024" },
    { category: "utility_invoice", name: "Electricity Bill - Nov 2024" },
    { category: "utility_invoice", name: "Electricity Bill - Dec 2024" },
    { category: "utility_invoice", name: "Water Bill - Q4 2024" },
    { category: "other", name: "Property Insurance Policy" },
    { category: "other", name: "Maintenance Agreement" },
    { category: "other", name: "Parking Allotment Letter" },
  ];

  const allContractsForDocs = [
    contract1, contract2, contract3, contract4John, contract5John,
    contract1Jane, contract2Jane, contract3Jane, contract4Jane, contract5Jane
  ];

  for (const contract of allContractsForDocs) {
    for (const docType of documentTypes) {
      await db.insert(documents).values({
        contractId: contract.id,
        category: docType.category as any,
        name: docType.name,
        fileUrl: `/documents/${contract.leaseNumber}/${docType.category}_${docType.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      });
    }
  }

  // Create Notifications for Customer 1 (John)
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

  await db.insert(notifications).values({
    userId: customer1.id,
    contractId: contract4John.id,
    type: "general",
    title: "New Property Onboarded",
    message: `Congratulations! Your new lease at High Street Phoenix has been successfully onboarded. Welcome to the ABC Real Estate family!`,
    isRead: true,
  });

  await db.insert(notifications).values({
    userId: customer1.id,
    contractId: contract5John.id,
    type: "maintenance",
    title: "HVAC Maintenance Scheduled",
    message: `Your property at Lodha Bellezza will have HVAC maintenance on Feb 25, 2025. Our technician will visit between 10 AM - 2 PM.`,
    isRead: false,
  });

  // Create Notifications for Customer 2 (Jane)
  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract1Jane.id,
    type: "rm_introduction",
    title: "Welcome to ABC Real Estate",
    message: `Hi Jane, I'm Sarah Williams, your Relationship Manager. I'll be assisting you with all your leases. Feel free to reach out anytime!`,
    isRead: true,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract2Jane.id,
    type: "maintenance",
    title: "Water Supply Disruption",
    message: `DLF Park Place will have scheduled water supply maintenance on Feb 20, 2025 from 9 AM to 3 PM. Please store water accordingly.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract3Jane.id,
    type: "lease_expiry",
    title: "Lease Renewal Due Soon",
    message: `Your lease for Ambience Mall - Shop GF-18 is approaching renewal. Please contact your RM to initiate the renewal process.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract4Jane.id,
    type: "general",
    title: "Rent Payment Received",
    message: `Thank you! Your rent payment of Rs. 2,25,000 for DLF Cyber Hub - Office 401 has been received.`,
    isRead: true,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    contractId: contract5Jane.id,
    type: "maintenance",
    title: "Pest Control Service",
    message: `Routine pest control service is scheduled for Emaar Palm Heights on March 5, 2025. Please keep the premises accessible.`,
    isRead: false,
  });

  await db.insert(notifications).values({
    userId: customer2.id,
    type: "general",
    title: "Annual Property Review",
    message: `We will be conducting annual property inspections for all our tenants in March 2025. Your RM will coordinate the schedule.`,
    isRead: false,
  });

  // Create Service Requests for John
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
    contractId: contract4John.id,
    customerId: customer1.id,
    type: "credit_request",
    subject: "Credit for Early Payment",
    description: "I made an advance payment for 3 months rent. Please adjust the credit to upcoming invoices.",
    status: "resolved",
    rmNote: "Credit of Rs. 3,45,000 applied to Feb-Apr 2025 invoices.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract5John.id,
    customerId: customer1.id,
    type: "parking_statement",
    subject: "Request Parking Statement",
    description: "Please provide detailed parking charges and allocation details for my Hyderabad property.",
    status: "new",
  });

  // Create Service Requests for Jane
  await db.insert(serviceRequests).values({
    contractId: contract1Jane.id,
    customerId: customer2.id,
    type: "parking_statement",
    subject: "Request for Parking Statement",
    description: "Please provide the parking allocation details and any outstanding parking charges.",
    status: "resolved",
    rmNote: "Parking statement generated and shared. No outstanding charges.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract2Jane.id,
    customerId: customer2.id,
    type: "credit_request",
    subject: "Request for Rent Credit",
    description: "Due to water supply issues in January, requesting partial rent credit for the inconvenience caused.",
    status: "in_progress",
  });

  await db.insert(serviceRequests).values({
    contractId: contract3Jane.id,
    customerId: customer2.id,
    type: "other",
    subject: "Lease Renewal Inquiry",
    description: "I would like to discuss renewal terms for my Ambience Mall lease. Please share the revised rent proposal.",
    status: "new",
  });

  await db.insert(serviceRequests).values({
    contractId: contract4Jane.id,
    customerId: customer2.id,
    type: "maintenance",
    subject: "Office AC Maintenance Required",
    description: "The central AC in our Cyber Hub office needs servicing. It's not cooling efficiently.",
    status: "in_progress",
    rmNote: "Technician visit scheduled for Feb 10, 2025.",
  });

  await db.insert(serviceRequests).values({
    contractId: contract5Jane.id,
    customerId: customer2.id,
    type: "document_request",
    subject: "Request Lease Copy",
    description: "Please provide a certified copy of my lease agreement for bank loan documentation.",
    status: "new",
  });

  console.log("Database seeded successfully!");
}
