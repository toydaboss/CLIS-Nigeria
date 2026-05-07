import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { pool } from "./index";

async function seed() {
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // Generate TOTP secrets for demo users
  const aishaSecret = authenticator.generateSecret();
  const oluSecret = authenticator.generateSecret();

  // Users
  const aishaPw = await hash("Password123!");
  const oluPw = await hash("Password123!");

  await pool.query(
    `
    INSERT INTO users (email, password_hash, name, role, jurisdiction_state, user_code, mfa_secret)
    VALUES
      ($1, $2, 'Aisha Bello', 'registrar', 'Lagos', 'USR-LSR-0241', $3),
      ($4, $5, 'Olu Adeyemi', 'admin', NULL, 'USR-ADM-0001', $6)
    ON CONFLICT (email) DO NOTHING
  `,
    [
      "a.bello@lagosstate.gov.ng",
      aishaPw,
      aishaSecret,
      "o.adeyemi@clis.gov.ng",
      oluPw,
      oluSecret,
    ],
  );

  // Titles
  await pool.query(`
    INSERT INTO titles (title_ref, owner_nin_last4, owner_name_masked, jurisdiction_state, lga,
      latitude, longitude, document_ref, registration_date, status, registered_by)
    VALUES
      ('LAGOS-2024-00142','1234','ADE•••••• ••••••','Lagos','Ikoyi',
       6.4527,3.4327,'LSR/IKY/2024/A-00142','2024-03-14','registered','USR-LSR-0241'),
      ('ABUJA-2022-08891','7711','CHI•••••• ••••••','FCT Abuja','Maitama',
       9.0765,7.3986,'ABJ/CEN/2022/B-08891','2022-08-09','disputed','USR-ABJ-0118'),
      ('LAGOS-2026-04193','5588','EME•••••• ••••••','Lagos','Yaba',
       6.5244,3.3792,'LSR/YAB/2026/A-04193','2026-05-05','registered','USR-LSR-0241'),
      ('LAGOS-2026-04192','3391','NGO•••••• ••••••','Lagos','Lekki',
       6.4698,3.5852,'LSR/LEK/2026/A-04192','2026-05-05','disputed','USR-LSR-0241'),
      ('LAGOS-2026-04191','2247','OBI•••••• ••••••','Lagos','Yaba',
       6.4811,3.4022,'LSR/YAB/2026/A-04191','2026-05-05','registered','USR-LSR-0241'),
      ('KANO-2025-02211','9912','AHM•••••• ••••••','Kano','Fagge',
       12.0022,8.5920,'KAN/FAG/2025/A-02211','2025-07-18','registered','USR-KAN-0094'),
      ('RIVERS-2026-00871','4456','CHU•••••• ••••••','Rivers','Port Harcourt City',
       4.8496,7.0134,'RIV/PHC/2026/A-00871','2026-05-04','registered','USR-RIV-0007')
    ON CONFLICT (title_ref) DO NOTHING
  `);

  // Update dispute_case for disputed title
  await pool.query(`
    UPDATE titles SET dispute_case = 'DSP-2026-0418' WHERE title_ref = 'ABUJA-2022-08891'
  `);

  // Audit log entries
  await pool.query(`
    INSERT INTO audit_log (timestamp, user_code, operation, record_ref, before_state, after_state)
    VALUES
      ('2026-05-05 08:42:17+01','USR-LSR-0241','INSERT','LAGOS-2026-04193',NULL,
       '{"status":"REGISTERED","parcel":"6.5244,3.3792"}'),
      ('2026-05-05 08:24:08+01','USR-LSR-0241','UPDATE','LAGOS-2026-04192',
       '{"status":"REGISTERED"}','{"status":"DISPUTED"}'),
      ('2026-05-05 08:01:33+01','USR-LSR-0118','INSERT','LAGOS-2026-04191',NULL,
       '{"status":"REGISTERED","parcel":"6.4811,3.4022"}'),
      ('2026-05-05 07:48:51+01','USR-ABJ-0118','FLAG_DISPUTE','ABUJA-2022-08891',
       '{"disputed":false}','{"disputed":true,"case":"DSP-2026-0418"}'),
      ('2026-05-05 07:14:20+01','USR-LSR-0241','INSERT','LAGOS-2026-04190',NULL,
       '{"status":"PENDING","parcel":"6.4671,3.5910"}'),
      ('2026-05-05 06:52:09+01','USR-KAN-0094','UPDATE','KANO-2025-02211',
       '{"doc_ref":"K1"}','{"doc_ref":"K1-rev2"}'),
      ('2026-05-04 17:31:46+01','USR-LSR-0241','INSERT','LAGOS-2026-04189',NULL,
       '{"status":"REGISTERED","parcel":"6.5024,3.3544"}'),
      ('2026-05-04 16:09:11+01','USR-RIV-0007','INSERT','RIVERS-2026-00871',NULL,
       '{"status":"REGISTERED","parcel":"4.8496,7.0134"}')
  `);

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

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
