import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { authenticator } from "otplib";
import { AuditLog } from "./models/AuditLog";
import { Title } from "./models/Title";
import { User } from "./models/User";

dotenv.config();

async function seed() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin";
  await mongoose.connect(uri);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  const aishaSecret = authenticator.generateSecret();
  const oluSecret = authenticator.generateSecret();

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Title.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // Users
  await User.insertMany([
    {
      email: "a.bello@lagosstate.gov.ng",
      passwordHash: await hash("Password123!"),
      name: "Aisha Bello",
      role: "registrar",
      jurisdictionState: "Lagos",
      userCode: "USR-LSR-0241",
      mfaSecret: aishaSecret,
    },
    {
      email: "o.adeyemi@clis.gov.ng",
      passwordHash: await hash("Password123!"),
      name: "Olu Adeyemi",
      role: "admin",
      jurisdictionState: null,
      userCode: "USR-ADM-0001",
      mfaSecret: oluSecret,
    },
  ]);

  // Titles
  await Title.insertMany([
    {
      titleRef: "LAGOS-2024-00142",
      ownerNinLast4: "1234",
      ownerNameMasked: "ADE•••••• ••••••",
      jurisdictionState: "Lagos",
      lga: "Ikoyi",
      latitude: 6.4527,
      longitude: 3.4327,
      documentRef: "LSR/IKY/2024/A-00142",
      registrationDate: new Date("2024-03-14"),
      status: "registered",
      registeredBy: "USR-LSR-0241",
    },
    {
      titleRef: "ABUJA-2022-08891",
      ownerNinLast4: "7711",
      ownerNameMasked: "CHI•••••• ••••••",
      jurisdictionState: "FCT Abuja",
      lga: "Maitama",
      latitude: 9.0765,
      longitude: 7.3986,
      documentRef: "ABJ/CEN/2022/B-08891",
      registrationDate: new Date("2022-08-09"),
      status: "disputed",
      disputeCase: "DSP-2026-0418",
      registeredBy: "USR-ABJ-0118",
    },
    {
      titleRef: "LAGOS-2026-04193",
      ownerNinLast4: "5588",
      ownerNameMasked: "EME•••••• ••••••",
      jurisdictionState: "Lagos",
      lga: "Yaba",
      latitude: 6.5244,
      longitude: 3.3792,
      documentRef: "LSR/YAB/2026/A-04193",
      registrationDate: new Date("2026-05-05"),
      status: "registered",
      registeredBy: "USR-LSR-0241",
    },
    {
      titleRef: "LAGOS-2026-04192",
      ownerNinLast4: "3391",
      ownerNameMasked: "NGO•••••• ••••••",
      jurisdictionState: "Lagos",
      lga: "Lekki",
      latitude: 6.4698,
      longitude: 3.5852,
      documentRef: "LSR/LEK/2026/A-04192",
      registrationDate: new Date("2026-05-05"),
      status: "disputed",
      registeredBy: "USR-LSR-0241",
    },
    {
      titleRef: "LAGOS-2026-04191",
      ownerNinLast4: "2247",
      ownerNameMasked: "OBI•••••• ••••••",
      jurisdictionState: "Lagos",
      lga: "Yaba",
      latitude: 6.4811,
      longitude: 3.4022,
      documentRef: "LSR/YAB/2026/A-04191",
      registrationDate: new Date("2026-05-05"),
      status: "registered",
      registeredBy: "USR-LSR-0241",
    },
    {
      titleRef: "KANO-2025-02211",
      ownerNinLast4: "9912",
      ownerNameMasked: "AHM•••••• ••••••",
      jurisdictionState: "Kano",
      lga: "Fagge",
      latitude: 12.0022,
      longitude: 8.592,
      documentRef: "KAN/FAG/2025/A-02211",
      registrationDate: new Date("2025-07-18"),
      status: "registered",
      registeredBy: "USR-KAN-0094",
    },
    {
      titleRef: "RIVERS-2026-00871",
      ownerNinLast4: "4456",
      ownerNameMasked: "CHU•••••• ••••••",
      jurisdictionState: "Rivers",
      lga: "Port Harcourt City",
      latitude: 4.8496,
      longitude: 7.0134,
      documentRef: "RIV/PHC/2026/A-00871",
      registrationDate: new Date("2026-05-04"),
      status: "registered",
      registeredBy: "USR-RIV-0007",
    },
  ]);

  // Audit log
  await AuditLog.insertMany([
    {
      timestamp: new Date("2026-05-05T08:42:17+01:00"),
      userCode: "USR-LSR-0241",
      operation: "INSERT",
      recordRef: "LAGOS-2026-04193",
      beforeState: null,
      afterState: { status: "REGISTERED", parcel: "6.5244,3.3792" },
    },
    {
      timestamp: new Date("2026-05-05T08:24:08+01:00"),
      userCode: "USR-LSR-0241",
      operation: "UPDATE",
      recordRef: "LAGOS-2026-04192",
      beforeState: { status: "REGISTERED" },
      afterState: { status: "DISPUTED" },
    },
    {
      timestamp: new Date("2026-05-05T08:01:33+01:00"),
      userCode: "USR-LSR-0118",
      operation: "INSERT",
      recordRef: "LAGOS-2026-04191",
      beforeState: null,
      afterState: { status: "REGISTERED", parcel: "6.4811,3.4022" },
    },
    {
      timestamp: new Date("2026-05-05T07:48:51+01:00"),
      userCode: "USR-ABJ-0118",
      operation: "FLAG_DISPUTE",
      recordRef: "ABUJA-2022-08891",
      beforeState: { disputed: false },
      afterState: { disputed: true, case: "DSP-2026-0418" },
    },
    {
      timestamp: new Date("2026-05-05T07:14:20+01:00"),
      userCode: "USR-LSR-0241",
      operation: "INSERT",
      recordRef: "LAGOS-2026-04190",
      beforeState: null,
      afterState: { status: "PENDING", parcel: "6.4671,3.5910" },
    },
    {
      timestamp: new Date("2026-05-05T06:52:09+01:00"),
      userCode: "USR-KAN-0094",
      operation: "UPDATE",
      recordRef: "KANO-2025-02211",
      beforeState: { doc_ref: "K1" },
      afterState: { doc_ref: "K1-rev2" },
    },
    {
      timestamp: new Date("2026-05-04T17:31:46+01:00"),
      userCode: "USR-LSR-0241",
      operation: "INSERT",
      recordRef: "LAGOS-2026-04189",
      beforeState: null,
      afterState: { status: "REGISTERED", parcel: "6.5024,3.3544" },
    },
    {
      timestamp: new Date("2026-05-04T16:09:11+01:00"),
      userCode: "USR-RIV-0007",
      operation: "INSERT",
      recordRef: "RIVERS-2026-00871",
      beforeState: null,
      afterState: { status: "REGISTERED", parcel: "4.8496,7.0134" },
    },
  ]);

  console.log("✅ Seed data inserted");
  console.log("");
  console.log("Demo credentials:");
  console.log("  Registrar: a.bello@lagosstate.gov.ng / Password123!");
  console.log("  Admin:     o.adeyemi@clis.gov.ng     / Password123!");
  console.log("");
  console.log("TOTP secrets (add to your authenticator app):");
  console.log("  Aisha Bello (Registrar):", aishaSecret);
  console.log("  Olu Adeyemi (Admin):    ", oluSecret);
  console.log("");
  console.log("OTP URIs for QR code:");
  console.log(
    "  Aisha:",
    authenticator.keyuri(
      "a.bello@lagosstate.gov.ng",
      "CLIS Nigeria",
      aishaSecret,
    ),
  );
  console.log(
    "  Olu:  ",
    authenticator.keyuri("o.adeyemi@clis.gov.ng", "CLIS Nigeria", oluSecret),
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
