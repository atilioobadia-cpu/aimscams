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
}

async function bootstrap() {
  assertConfiguration();

  const app = await NestFactory.create(AppModule);
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
