// Validate event payload according to assignment requirements
export const validateEvent = (data) => {
  const errors = [];

  // Required fields check
  if (!data.site_id || typeof data.site_id !== 'string') {
    errors.push('site_id is required and must be a string');
  }

  if (!data.event_type || typeof data.event_type !== 'string') {
    errors.push('event_type is required and must be a string');
  }

  // Optional fields type checking
  if (data.path && typeof data.path !== 'string') {
    errors.push('path must be a string');
  }

  if (data.user_id && typeof data.user_id !== 'string') {
    errors.push('user_id must be a string');
  }

  // Timestamp validation (optional but should be valid if provided)
  if (data.timestamp) {
    const date = new Date(data.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('timestamp must be a valid ISO 8601 date string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
