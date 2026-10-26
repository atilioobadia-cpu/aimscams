import { resolve } from "node:path";
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  quiet: true,
});

const REQUIRED_ENV = [
  "DATABASE_URL",
  "REDIS_URL",
  "PUBLIC_BASE_URL",
  "TZ",
  "INSTITUTION_CODE",
  "INSTITUTION_DIALECT",
  "TOTP_ENCRYPTION_KEY",
] as const;

function assertConfiguration(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `AIMSCAMS API cannot start; missing required configuration: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const dialect = process.env.INSTITUTION_DIALECT;
  if (dialect !== "TCDC" && dialect !== "BOT") {
    console.error(
      `AIMSCAMS API cannot start; INSTITUTION_DIALECT must be TCDC or BOT (got ${dialect ?? "empty"})`,
    );
    process.exit(1);
  }

  if (process.env.AUTH_BYPASS === "true" && process.env.APP_ENV !== "local") {
    console.error("AIMSCAMS API cannot start; AUTH_BYPASS is permitted only when APP_ENV=local.");
    process.exit(1);
  }

  const totpKey = process.env.TOTP_ENCRYPTION_KEY ?? "";
  const totpKeyBytes = /^[0-9a-f]{64}$/i.test(totpKey)
    ? Buffer.from(totpKey, "hex")
    : Buffer.from(totpKey, "base64");
  if (totpKeyBytes.length !== 32) {
    console.error(
      "AIMSCAMS API cannot start; TOTP_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.",
    );
    process.exit(1);
  }
}

async function bootstrap() {
  assertConfiguration();

  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.log(`AIMSCAMS API listening on http://localhost:${port}`);
}

await bootstrap();
