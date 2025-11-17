/**
 * Purpose: Start Admin, Client, and LLM Microservices concurrently.
 * This script allows you to run "node start-services.js" from our /backend
 * to start three servers at once
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const dotenv = require("dotenv");

const services = [
  { name: "Admin Service", path: "./admin-service/server.js" },
  { name: "Client Service", path: "./client-service/server.js" },
  { name: "Auth Service", path: "./user-authentication/server.js" },
];

// Conditionally start llm-service if the env is configured
const llmService = {
  name: "LLM Service",
  path: "./llm-service/server.js",
  requiredEnv: ["GEMINI_API_KEY"],
};

// Load LLM service env from its .env file WITHOUT mutating process.env
const llmEnvPath = path.join(__dirname, "llm-service", ".env");
let llmEnv = {};
if (fs.existsSync(llmEnvPath)) {
  try {
    const parsed = dotenv.parse(fs.readFileSync(llmEnvPath));
    llmEnv = { ...process.env, ...parsed };
  } catch (err) {
    console.error("Failed to parse llm-service .env:", err.message);
  }
} else {
  // no .env present for llm-service; fall back to process.env
  llmEnv = { ...process.env };
}

// Check if all required environment variables exist for LLM service
const hasRequiredEnv = llmService.requiredEnv.every((envVar) =>
  Boolean(llmEnv[envVar])
);

if (hasRequiredEnv) {
  // attach env for the llm child process only
  llmService.env = llmEnv;
  services.push(llmService);
  console.log("LLM Service will be started (env configured)");
} else {
  console.log(
    `Skipping LLM Service (missing: ${llmService.requiredEnv
      .filter((v) => !llmEnv[v])
      .join(", ")})`
  );
}

services.forEach((service) => {
  // Build env per-service to avoid leaking LLM PORT into Admin/Client
  let childEnv = { ...process.env };

  if (service.name === "Admin Service") {
    // Ensure admin uses its intended port regardless of other envs
    childEnv = { ...childEnv, PORT: process.env.ADMIN_PORT || "5001" };
  } else if (service.name === "Client Service") {
    // Client-service has a hardcoded port in its server.js, no change needed
    childEnv = { ...childEnv };
  } else if (service.name === "Auth Service") {
    // Auth service uses port 3001 (hardcoded in server.js)
    childEnv = { ...childEnv };
  } else if (service.name === "LLM Service") {
    // Use the parsed llm env (which may contain PORT=7001 and keys)
    childEnv = { ...(service.env || childEnv) };
  }

  console.log(`Starting ${service.name}...`);
  const child = spawn("node", [service.path], {
    stdio: "inherit",
    env: childEnv,
  });

  child.on("error", (err) => {
    console.error(`Error starting ${service.name}:`, err);
  });

  child.on("exit", (code, signal) => {
    if (code !== null) console.log(`${service.name} exited with code ${code}`);
    else if (signal)
      console.log(`${service.name} was killed with signal ${signal}`);
  });
});
