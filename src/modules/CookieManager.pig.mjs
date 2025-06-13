const CookieManager = {
  set(name, value, days = 7, path = "/") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`;
  },

  get(name) {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, val] = cookie.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(val);
      return acc;
    }, {});
    return cookies[name] ?? null;
  },

  exists(name) {
    return this.get(name) !== null;
  },

  remove(name, path = "/") {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  },

  update(name, newValue, days = 7, path = "/") {
    if (this.exists(name)) {
      this.set(name, newValue, days, path);
    } else {
      console.warn(`Cookie "${name}" does not exist. Use set() to create it.`);
    }
  },

  getAll() {
    return document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, val] = cookie.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(val);
      return acc;
    }, {});
  },
};

export default CookieManager;
