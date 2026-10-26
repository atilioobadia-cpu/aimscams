import { resolve } from "node:path";
import { Algorithm, hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import {
  PERMISSION_ACTIONS,
  PERMISSION_ENTITIES,
  ROLE_DEFINITIONS,
  permissionKey,
} from "@aimscams/domain";
import { PrismaClient } from "./generated/prisma/client.js";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  quiet: true,
});

const appEnv = process.env.APP_ENV ?? "local";
if (appEnv !== "local" && appEnv !== "test") {
  console.error(`Refusing to seed APP_ENV=${appEnv}. Synthetic data is local/test only.`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

const password = process.env.SEED_ADMIN_PASSWORD ?? "Aimscams#2026";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const passwordHash = await hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const organisation = await prisma.organisation.upsert({
    where: { code: process.env.INSTITUTION_CODE ?? "AIM-DEMO" },
    update: {
      name: process.env.INSTITUTION_NAME ?? "AIMSCAMS Demo SACCO",
      dialect: process.env.INSTITUTION_DIALECT === "BOT" ? "BOT" : "TCDC",
    },
    create: {
      code: process.env.INSTITUTION_CODE ?? "AIM-DEMO",
      name: process.env.INSTITUTION_NAME ?? "AIMSCAMS Demo SACCO",
      dialect: process.env.INSTITUTION_DIALECT === "BOT" ? "BOT" : "TCDC",
    },
  });

  await prisma.permission.createMany({
    data: PERMISSION_ENTITIES.flatMap((entity) =>
      PERMISSION_ACTIONS.map((action) => ({
        key: permissionKey(entity, action),
        entity,
        action,
        description: `${action} ${entity.toLowerCase()}`,
      })),
    ),
    skipDuplicates: true,
  });

  const permissions = new Map(
    (await prisma.permission.findMany()).map((permission) => [permission.key, permission.key]),
  );

  const roles = new Map<string, string>();
  for (const definition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: {
        organisationId_code: { organisationId: organisation.id, code: definition.code },
      },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
      create: {
        organisationId: organisation.id,
        code: definition.code,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
    });
    roles.set(definition.code, role.id);

    const grantedKeys = [...new Set(definition.permissions)].filter((key) => permissions.has(key));
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (grantedKeys.length > 0) {
      await prisma.rolePermission.createMany({
        data: grantedKeys.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }

  const branch = await prisma.branch.upsert({
    where: {
      organisationId_code: { organisationId: organisation.id, code: "MWZ" },
    },
    update: { name: "Mwanza Branch", region: "Mwanza", isDefault: true, status: "OPEN" },
    create: {
      organisationId: organisation.id,
      code: "MWZ",
      name: "Mwanza Branch",
      region: "Mwanza",
      district: "Nyamagana",
      councilType: "MC",
      isDefault: true,
      status: "OPEN",
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      organisationId_email: { organisationId: organisation.id, email: "admin@aimscams.local" },
    },
    update: {
      branchId: branch.id,
      fullName: "Amina Hassan Mwinyi",
      phone: "+255 754 000 001",
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      organisationId: organisation.id,
      branchId: branch.id,
      email: "admin@aimscams.local",
      fullName: "Amina Hassan Mwinyi",
      phone: "+255 754 000 001",
      passwordHash,
      status: "ACTIVE",
    },
  });

  const adminRoleId = roles.get("ADMIN");
  if (!adminRoleId) {
    throw new Error("ADMIN role was not seeded.");
  }

  await prisma.userRole.deleteMany({ where: { userId: admin.id } });
  await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRoleId } });

  console.log(
    JSON.stringify({
      service: "aimscams-seed",
      status: "ok",
      organisation: organisation.code,
      branch: branch.code,
      user: admin.email,
      roles: ROLE_DEFINITIONS.length,
      permissions: permissions.size,
      passwordSource: process.env.SEED_ADMIN_PASSWORD ? "env" : "local default",
    }),
  );
} finally {
  await prisma.$disconnect();
}
