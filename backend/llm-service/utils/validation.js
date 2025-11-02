/**
 * Validation Utilities for LLM-Service
 * 
 * Provides input validation (before processing) and sanitization functions (prevent XSS attacks)
 * used throughout the LLM microservice to ensure data types 
 * are correct before database operations
 * 
 * Used by:
 * - controllers/llmController.js - Validates request data before processing
 * - services/llmParser.js - Sanitizes user text input before parsing 
 * - any component that needs to validate ticket counts or event IDs
 */

/**
 * Validate ticket count is a positive integer
 * @param {*} tickets - Ticket count to validate
 * @returns {boolean} True if valid
 */
function validateTicketCount(tickets) {
  return Number.isInteger(tickets) && tickets > 0;
}

/**
 * Validate event ID is a positive integer
 * @param {*} eventId - Event ID to validate
 * @returns {boolean} True if valid
 */
function validateEventId(eventId) {
  return Number.isInteger(eventId) && eventId > 0;
}

/**
 * Sanitize user input to prevent injection attacks
 * Removes HTML tags and potentially dangerous characters from user text
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  
  // Remove potentially dangerous characters and patterns
  return text
    .replace(/<[^>]*>/g, '') // This removes everything between < and >
    .trim();
}

module.exports = {
  validateTicketCount,
  validateEventId,
  sanitizeInput
};