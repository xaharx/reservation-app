function serializeForJson(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value.toJSON === 'function') {
    return serializeForJson(value.toJSON());
  }

  if (Array.isArray(value)) {
    return value.map(serializeForJson);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeForJson(item)]),
    );
  }

  return value;
}

module.exports = { serializeForJson };
