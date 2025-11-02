

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