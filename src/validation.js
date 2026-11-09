// PART 4 - VALIDATION
// Each function returns an error message string, or null when the input is fine.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInt(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function validateCostume(body) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON';
  if (!isNonEmptyString(body.name)) return 'name is required and must be a non-empty string';
  if (body.name.trim().length > 100) return 'name must be 100 characters or fewer';
  if (!isNonEmptyString(body.era)) return 'era is required and must be a non-empty string';
  if (body.size !== undefined && body.size !== null && !['XS', 'S', 'M', 'L', 'XL'].includes(body.size)) {
    return 'size must be one of XS, S, M, L, XL';
  }
  return null;
}

function validateActor(body) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON';
  if (!isNonEmptyString(body.name)) return 'name is required and must be a non-empty string';
  if (body.email !== undefined && body.email !== null) {
    if (typeof body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email)) {
      return 'email must be a valid email address';
    }
  }
  return null;
}

function validateHire(body) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON';
  if (!isPositiveInt(body.actor_id)) return 'actor_id is required and must be a positive whole number';
  if (!isPositiveInt(body.costume_id)) return 'costume_id is required and must be a positive whole number';
  if (!isNonEmptyString(body.due_date) || !DATE_RE.test(body.due_date)) {
    return 'due_date is required in the format YYYY-MM-DD';
  }
  return null;
}

// Checks that :id in the URL is a positive whole number
function validateId(id) {
  return isPositiveInt(id) ? null : 'id must be a positive whole number';
}

module.exports = { validateCostume, validateActor, validateHire, validateId };
