/**
 * Purpose: Start both Admin and Client Microservices concurrently.
 * This script allows you to run "node start-services.js" from our /backend
 * to start both servers at once
 */

const { spawn } = require('child_process');

const services = [
  { name: 'Admin Service', path: './admin-service/server.js' },
  { name: 'Client Service', path: './client-service/server.js' },
  { name: 'LLM Service', path: './llm-service/server.js' }
];

services.forEach(service => {
  const process = spawn('node', [service.path], { stdio: 'inherit' });
  console.log(`Starting ${service.name}...`);
});