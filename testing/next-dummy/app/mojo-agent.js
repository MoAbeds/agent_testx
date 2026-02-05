/**
 * Local Mojo Guardian Agent Fallback
 */
class MojoGuardian {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://agenttestx-production-19d6.up.railway.app/api/agent/manifest';
    this.rules = {};
  }

  async init() {
    try {
      const response = await fetch(this.endpoint, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      const data = await response.json();
      this.rules = data.rules || {};
    } catch (e) {
      console.error('Mojo Init Failed:', e);
    }
  }

  getMetadata(path) {
    return this.rules[path] || null;
  }
}

export default MojoGuardian;
