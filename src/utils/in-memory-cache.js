class InMemoryCache {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.entries = new Map();
    this.inFlight = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);

    if (!entry || entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key, value, ttlMilliseconds) {
    this.entries.set(key, {
      value,
      expiresAt: this.now() + ttlMilliseconds,
    });
    return value;
  }

  async remember(key, ttlMilliseconds, factory) {
    const cachedValue = this.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const pendingValue = Promise.resolve(factory())
      .then((value) => this.set(key, value, ttlMilliseconds))
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, pendingValue);
    return pendingValue;
  }

  invalidate(key) {
    this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }
}

module.exports = { InMemoryCache };
