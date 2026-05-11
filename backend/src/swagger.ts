import type { OpenAPIV3 } from "openapi-types";

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Access token obtained from `POST /api/auth/mfa`",
};

const errorSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    error: { type: "string", example: "Human-readable error message" },
  },
  required: ["error"],
};

const paginationParams: OpenAPIV3.ParameterObject[] = [
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", default: 20, maximum: 100 },
    description: "Results per page",
  },
  {
    name: "offset",
    in: "query",
    schema: { type: "integer", default: 0 },
    description: "Number of records to skip",
  },
];

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "CLIS Nigeria API",
    version: "1.0.0",
    description:
      "Cloud-Based Centralized Land Information System — REST API for land title registration, public verification, and dispute management in Nigeria.\n\n" +
      "## Authentication\n" +
      "Login is a two-step flow:\n" +
      "1. `POST /api/auth/login` — submit email + password → receive `tempToken` (5 min)\n" +
      "2. `POST /api/auth/mfa` — submit `tempToken` + TOTP code → receive `accessToken` (8 h)\n\n" +
      "Include the access token as `Authorization: Bearer <token>` on all protected requests.\n\n" +
      "## Access Levels\n" +
      "- **Registrar+** — any authenticated user\n" +
      '- **Admin only** — users with `role: "admin"`',
    contact: { name: "CLIS Nigeria Support" },
  },
  servers: [
    { url: "http://localhost:3001", description: "Local development" },
    {
      url: "https://<your-backend>.onrender.com",
      description: "Production (Render)",
    },
  ],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      Error: errorSchema,

      TitleStatus: {
        type: "string",
        enum: ["registered", "disputed", "pending"],
      },

      Operation: {
        type: "string",
        enum: ["INSERT", "UPDATE", "FLAG_DISPUTE"],
      },

      Role: {
        type: "string",
        enum: ["admin", "registrar"],
      },

      PublicTitle: {
        type: "object",
        properties: {
          found: { type: "boolean", example: true },
          titleRef: { type: "string", example: "LAGOS-2024-00142" },
          jurisdictionState: { type: "string", example: "Lagos" },
          registrationDate: { type: "string", format: "date-time" },
          status: { $ref: "#/components/schemas/TitleStatus" },
          disputeCase: {
            type: "string",
            nullable: true,
            example: "CASE-LAG-2025-0041",
          },
          lastVerified: { type: "string", format: "date-time" },
        },
      },

      AdminTitle: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f1c2b3e4a5d6f7890abc12" },
          titleRef: { type: "string", example: "LAGOS-2024-00142" },
          ownerNinLast4: { type: "string", example: "7823" },
          ownerNameMasked: { type: "string", example: "A**** B***" },
          jurisdictionState: { type: "string", example: "Lagos" },
          lga: { type: "string", example: "Ikeja" },
          latitude: { type: "number", example: 6.6018 },
          longitude: { type: "number", example: 3.3515 },
          documentRef: { type: "string", example: "DOC-LAG-2024-00142" },
          registrationDate: { type: "string", format: "date-time" },
          registeredBy: { type: "string", example: "USR-LAG-4821" },
          status: { $ref: "#/components/schemas/TitleStatus" },
          disputeCase: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      TitleListItem: {
        type: "object",
        properties: {
          titleRef: { type: "string", example: "LAGOS-2024-00142" },
          jurisdictionState: { type: "string", example: "Lagos" },
          lga: { type: "string", example: "Ikeja" },
          registrationDate: { type: "string", format: "date-time" },
          status: { $ref: "#/components/schemas/TitleStatus" },
          registeredBy: { type: "string", example: "USR-LAG-4821" },
          disputeCase: { type: "string", nullable: true },
        },
      },

      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f1c2b3e4a5d6f7890abc12" },
          email: {
            type: "string",
            format: "email",
            example: "a.bello@lagosstate.gov.ng",
          },
          name: { type: "string", example: "Aisha Bello" },
          role: { $ref: "#/components/schemas/Role" },
          userCode: { type: "string", example: "USR-LAG-4821" },
          jurisdictionState: {
            type: "string",
            nullable: true,
            example: "Lagos",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      AuditEntry: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f1c2b3e4a5d6f7890abc12" },
          timestamp: { type: "string", format: "date-time" },
          userCode: { type: "string", example: "USR-LAG-4821" },
          operation: { $ref: "#/components/schemas/Operation" },
          recordRef: { type: "string", example: "LAGOS-2024-00142" },
          beforeState: { type: "object", nullable: true },
          afterState: { type: "object" },
        },
      },

      Jurisdiction: {
        type: "object",
        properties: {
          state: { type: "string", example: "Lagos" },
          totalTitles: { type: "integer", example: 482 },
          registeredTitles: { type: "integer", example: 461 },
          disputedTitles: { type: "integer", example: 12 },
          pendingTitles: { type: "integer", example: 9 },
          registrars: { type: "integer", example: 4 },
          lastActivity: { type: "string", format: "date-time" },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: "Missing, invalid, or expired token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description:
          "Authenticated but insufficient role (admin only endpoint)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },

  tags: [
    { name: "Health", description: "Service availability" },
    { name: "Public", description: "Unauthenticated title verification" },
    { name: "Auth", description: "Two-step login flow and logout" },
    {
      name: "Dashboard",
      description: "Summary stats and recent activity (Registrar+)",
    },
    {
      name: "Titles",
      description: "Title registration and lookup (Registrar+)",
    },
    { name: "Users", description: "User account management (Admin only)" },
    { name: "Jurisdictions", description: "Per-state statistics (Admin only)" },
    {
      name: "Audit Log",
      description: "Immutable operation history (Admin only)",
    },
  ],

  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    ts: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/titles/{ref}": {
      get: {
        tags: ["Public"],
        summary: "Verify a land title",
        description:
          "Public lookup by title reference. No authentication required.",
        operationId: "verifyTitle",
        parameters: [
          {
            name: "ref",
            in: "path",
            required: true,
            description:
              "Title reference in the format `STATE-YEAR-NNNNN` (case-insensitive)",
            schema: { type: "string", example: "LAGOS-2024-00142" },
          },
        ],
        responses: {
          "200": {
            description: "Lookup result (found or not found)",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/PublicTitle" },
                    {
                      type: "object",
                      properties: {
                        found: { type: "boolean", example: false },
                        searched: {
                          type: "string",
                          example: "LAGOS-2024-99999",
                        },
                      },
                    },
                  ],
                },
                examples: {
                  found: {
                    summary: "Title found",
                    value: {
                      found: true,
                      titleRef: "LAGOS-2024-00142",
                      jurisdictionState: "Lagos",
                      registrationDate: "2024-03-10T00:00:00.000Z",
                      status: "registered",
                      disputeCase: null,
                      lastVerified: "2025-01-15T10:30:00.000Z",
                    },
                  },
                  notFound: {
                    summary: "Title not found",
                    value: { found: false, searched: "LAGOS-2024-99999" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid reference format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Step 1 — submit credentials",
        description:
          "Validates email and password. Returns a short-lived `tempToken` (5 min) to be used in the MFA step.",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "o.adeyemi@clis.gov.ng",
                  },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Credentials accepted — proceed to MFA",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tempToken: {
                      type: "string",
                      description: "Short-lived JWT (5 min)",
                    },
                    name: { type: "string", example: "Olu Adeyemi" },
                    email: { type: "string", example: "o.adeyemi@clis.gov.ng" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing email or password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/auth/mfa": {
      post: {
        tags: ["Auth"],
        summary: "Step 2 — submit TOTP code",
        description:
          "Validates the TOTP code against the user's MFA secret. Returns a long-lived `accessToken` (8 h) on success.",
        operationId: "verifyMfa",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tempToken", "code"],
                properties: {
                  tempToken: {
                    type: "string",
                    description: "Token from POST /api/auth/login",
                  },
                  code: {
                    type: "string",
                    example: "481203",
                    description: "6-digit TOTP code",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "MFA passed — session token issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: {
                      type: "string",
                      description: "Bearer token (8 h)",
                    },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { $ref: "#/components/schemas/Role" },
                        userCode: { type: "string" },
                        jurisdictionState: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing tempToken or code",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Invalid/expired tempToken or wrong TOTP code",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description:
          "Signals logout. The client is responsible for discarding the stored token.",
        operationId: "logout",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
        },
      },
    },

    "/api/admin/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Summary statistics",
        operationId: "getDashboardStats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Aggregate title counts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalTitles: { type: "integer", example: 1482 },
                    titlesThisMonth: { type: "integer", example: 37 },
                    activeDisputes: { type: "integer", example: 12 },
                    pendingReviews: { type: "integer", example: 5 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/dashboard/recent": {
      get: {
        tags: ["Dashboard"],
        summary: "Recent activity",
        description:
          "The 10 most recent audit log entries, enriched with title metadata.",
        operationId: "getDashboardRecent",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Array of recent entries",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _id: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      userCode: { type: "string", example: "USR-LAG-4821" },
                      operation: { $ref: "#/components/schemas/Operation" },
                      recordRef: {
                        type: "string",
                        example: "LAGOS-2025-00193",
                      },
                      jurisdictionState: { type: "string", example: "Lagos" },
                      lga: { type: "string", example: "Ikeja" },
                      status: { $ref: "#/components/schemas/TitleStatus" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/dashboard/chart": {
      get: {
        tags: ["Dashboard"],
        summary: "Registration trend",
        description:
          "Daily registration counts for the last 14 days. Days with zero registrations are omitted.",
        operationId: "getDashboardChart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Array of day + count pairs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", example: "2025-01-15" },
                      count: { type: "integer", example: 7 },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/titles": {
      get: {
        tags: ["Titles"],
        summary: "List titles",
        operationId: "listTitles",
        security: [{ bearerAuth: [] }],
        parameters: [
          ...paginationParams,
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/TitleStatus" },
            description: "Filter by status",
          },
          {
            name: "state",
            in: "query",
            schema: { type: "string", example: "Lagos" },
            description:
              "Filter by jurisdiction state (case-insensitive partial match)",
          },
        ],
        responses: {
          "200": {
            description: "Paginated title list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    titles: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TitleListItem" },
                    },
                    total: { type: "integer", example: 1482 },
                    limit: { type: "integer", example: 20 },
                    offset: { type: "integer", example: 0 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },

      post: {
        tags: ["Titles"],
        summary: "Register a new title",
        operationId: "createTitle",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "titleRef",
                  "ownerNinLast4",
                  "jurisdictionState",
                  "registrationDate",
                ],
                properties: {
                  titleRef: {
                    type: "string",
                    example: "LAGOS-2025-00194",
                    description: "Must be unique. Format: STATE-YEAR-NNNNN",
                  },
                  ownerNinLast4: {
                    type: "string",
                    example: "4491",
                    description: "Last 4 digits of the owner's NIN",
                  },
                  ownerNameMasked: { type: "string", example: "C**** O***" },
                  jurisdictionState: { type: "string", example: "Lagos" },
                  lga: { type: "string", example: "Surulere" },
                  latitude: { type: "number", example: 6.5008 },
                  longitude: { type: "number", example: 3.3543 },
                  documentRef: {
                    type: "string",
                    example: "DOC-LAG-2025-00194",
                  },
                  registrationDate: {
                    type: "string",
                    format: "date",
                    example: "2025-01-15",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Title registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { $ref: "#/components/schemas/AdminTitle" },
                    nearby: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Up to 3 existing title refs within ~20 m. Empty if no conflicts.",
                      example: ["LAGOS-2024-00138"],
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": {
            description: "Title reference already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/titles/{ref}": {
      get: {
        tags: ["Titles"],
        summary: "Look up a title",
        description:
          "Full title record including owner details. Admin internal use.",
        operationId: "getTitle",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "ref",
            in: "path",
            required: true,
            schema: { type: "string", example: "LAGOS-2024-00142" },
          },
        ],
        responses: {
          "200": {
            description: "Lookup result",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        found: { type: "boolean", example: true },
                        title: { $ref: "#/components/schemas/AdminTitle" },
                      },
                    },
                    {
                      type: "object",
                      properties: {
                        found: { type: "boolean", example: false },
                        searched: {
                          type: "string",
                          example: "LAGOS-2024-99999",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/titles/{ref}/dispute": {
      patch: {
        tags: ["Titles"],
        summary: "Flag a dispute",
        operationId: "flagDispute",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "ref",
            in: "path",
            required: true,
            schema: { type: "string", example: "LAGOS-2024-00142" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["disputeCase"],
                properties: {
                  disputeCase: {
                    type: "string",
                    example: "CASE-LAG-2025-0041",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Dispute flagged",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        description:
          "Passwords and MFA secrets are excluded from the response.",
        operationId: "listUsers",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "All user accounts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },

      post: {
        tags: ["Users"],
        summary: "Create a user",
        description:
          "Creates a new user account and generates their TOTP secret. The `totpSecret` and `totpUri` are only returned once — share them with the user immediately.",
        operationId: "createUser",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "name", "role", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "k.ibrahim@kadstate.gov.ng",
                  },
                  name: { type: "string", example: "Kemi Ibrahim" },
                  role: { $ref: "#/components/schemas/Role" },
                  jurisdictionState: {
                    type: "string",
                    example: "Kaduna",
                    description: 'Required when role is "registrar"',
                  },
                  password: { type: "string", example: "TempPass456!" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    totpSecret: {
                      type: "string",
                      example: "JBSWY3DPEHPK3PXP",
                      description:
                        "Base32 TOTP secret — share with the new user",
                    },
                    totpUri: {
                      type: "string",
                      example:
                        "otpauth://totp/CLIS%20Nigeria:k.ibrahim%40kadstate.gov.ng?secret=JBSWY3DPEHPK3PXP&issuer=CLIS%20Nigeria",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing/invalid fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/users/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Change a user's role",
        description:
          "Updates the role and jurisdiction state for a user. Admins cannot change their own role.",
        operationId: "updateUserRole",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "MongoDB `_id` of the user",
            schema: { type: "string", example: "64f1c2b3e4a5d6f7890abc12" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { $ref: "#/components/schemas/Role" },
                  jurisdictionState: {
                    type: "string",
                    example: "Ogun",
                    description: 'Required when role is "registrar"',
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Role updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
          "400": {
            description: "Invalid role or attempting to change own role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/users/{id}": {
      delete: {
        tags: ["Users"],
        summary: "Delete a user",
        description:
          "Permanently removes a user account. Admins cannot delete their own account.",
        operationId: "deleteUser",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "MongoDB `_id` of the user",
            schema: { type: "string", example: "64f1c2b3e4a5d6f7890abc12" },
          },
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
          "400": {
            description: "Attempting to delete own account",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/jurisdictions": {
      get: {
        tags: ["Jurisdictions"],
        summary: "Per-state statistics",
        description:
          "Aggregates title counts and registrar counts per Nigerian state. Sorted by total titles descending.",
        operationId: "getJurisdictions",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Jurisdiction stats and totals",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    jurisdictions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Jurisdiction" },
                    },
                    totals: {
                      type: "object",
                      properties: {
                        states: { type: "integer", example: 12 },
                        titles: { type: "integer", example: 1482 },
                        disputes: { type: "integer", example: 38 },
                        registrars: { type: "integer", example: 27 },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },

    "/api/admin/audit": {
      get: {
        tags: ["Audit Log"],
        summary: "Paginated audit log",
        description:
          "Immutable record of all INSERT, UPDATE, and FLAG_DISPUTE operations. Sorted newest first.",
        operationId: "getAuditLog",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 25, maximum: 100 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
          {
            name: "operation",
            in: "query",
            schema: {
              type: "string",
              enum: ["INSERT", "UPDATE", "FLAG_DISPUTE", "all"],
            },
            description:
              "Filter by operation type. Pass `all` or omit to return all.",
          },
          {
            name: "user",
            in: "query",
            schema: { type: "string", example: "USR-LAG" },
            description: "Filter by userCode prefix (case-insensitive)",
          },
          {
            name: "state",
            in: "query",
            schema: { type: "string", example: "LAGOS" },
            description: "Filter by state name within recordRef",
          },
          {
            name: "from",
            in: "query",
            schema: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T00:00:00Z",
            },
            description: "Start timestamp (inclusive)",
          },
          {
            name: "to",
            in: "query",
            schema: {
              type: "string",
              format: "date-time",
              example: "2025-01-31T23:59:59Z",
            },
            description: "End timestamp (inclusive)",
          },
        ],
        responses: {
          "200": {
            description: "Paginated audit entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AuditEntry" },
                    },
                    total: { type: "integer", example: 3841 },
                    limit: { type: "integer", example: 25 },
                    offset: { type: "integer", example: 0 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
};
