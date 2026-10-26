/**
 * Synthetic seed entry point. Phase 0 skeleton: business fixtures arrive with the
 * Phase 2 identity models. Refuses to run outside local development so a real
 * installation can never be seeded by accident.
 */
const appEnv = process.env.APP_ENV ?? "local";

if (appEnv !== "local" && appEnv !== "test") {
  console.error(`Refusing to seed APP_ENV=${appEnv}. Synthetic data is local/test only.`);
  process.exit(1);
}

console.log(
  JSON.stringify({
    service: "aimscams-seed",
    status: "skeleton",
    appEnv,
    note: "Fixtures are added with the Phase 2 identity models.",
  }),
);
