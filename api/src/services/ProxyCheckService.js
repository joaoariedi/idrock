/**
 * ProxyCheck.io API Integration Service
 * Handles IP reputation analysis using ProxyCheck.io service
 * 
 * @author Grupo idRock
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ProxyCheckService {
  constructor() {
    this.apiKey = process.env.PROXYCHECK_API_KEY;
    this.baseURL = 'https://proxycheck.io/v2';
    this.timeout = 5000;
    
    // Cache for IP results (simple in-memory cache)
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Check IP address reputation and characteristics
   * @param {string} ipAddress - IP address to check
   * @returns {Promise<Object>} IP analysis result
   */
  async checkIP(ipAddress) {
    try {
      // Check cache first
      const cachedResult = this.getCachedResult(ipAddress);
      if (cachedResult) {
        logger.debug(`Using cached result for IP: ${ipAddress}`);
        return cachedResult;
      }

      // Build API URL
      const url = this.buildAPIUrl(ipAddress);
      
      logger.debug(`Checking IP reputation: ${ipAddress}`);

      // Make API request
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'idRock-MVP/1.0.0'
        }
      });

      const data = response.data;
      const result = this.parseAPIResponse(data, ipAddress);

      // Cache the result
      this.cacheResult(ipAddress, result);

      logger.debug(`IP check completed for ${ipAddress}: ${result.risk}`);
      return result;

    } catch (error) {
      logger.warn(`ProxyCheck API error for ${ipAddress}:`, error.message);
      
      // Return fallback result
      return this.getFallbackResult(ipAddress, error);
    }
  }

  /**
   * Build ProxyCheck.io API URL
   * @param {string} ipAddress - IP address to check
   * @returns {string} Complete API URL
   */
  buildAPIUrl(ipAddress) {
    let url = `${this.baseURL}/${ipAddress}`;
    
    const params = new URLSearchParams();
    
    if (this.apiKey) {
      params.append('key', this.apiKey);
    }
    
    // Request additional information
    params.append('vpn', '1');
    params.append('asn', '1');
    params.append('node', '1');
    params.append('time', '1');
    params.append('inf', '1');
    params.append('risk', '1');
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    return url;
  }

  /**
   * Parse ProxyCheck.io API response
   * @param {Object} data - API response data
   * @param {string} ipAddress - Original IP address
   * @returns {Object} Parsed result
   */
  parseAPIResponse(data, ipAddress) {
    const ipData = data[ipAddress] || {};
    
    return {
      ip: ipAddress,
      proxy: ipData.proxy || 'no',
      type: ipData.type || 'unknown',
      risk: ipData.risk || 'low',
      country: ipData.country || 'unknown',
      region: ipData.region || 'unknown',
      city: ipData.city || 'unknown',
      isocode: ipData.isocode || 'unknown',
      provider: ipData.provider || 'unknown',
      organisation: ipData.organisation || 'unknown',
      asn: ipData.asn || 'unknown',
      continent: ipData.continent || 'unknown',
      latitude: ipData.latitude || null,
      longitude: ipData.longitude || null,
      timezone: ipData.timezone || 'unknown',
      currency: ipData.currency || 'unknown',
      disposable: ipData.disposable || 'no',
      vpn: ipData.vpn || 'no',
      lastSeen: ipData['last seen human'] || 'unknown',
      threats: ipData.threats || [],
      raw: ipData
    };
  }

  /**
   * Get cached result if available and not expired
   * @param {string} ipAddress - IP address
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(ipAddress) {
    const cached = this.cache.get(ipAddress);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(ipAddress);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Cache API result
   * @param {string} ipAddress - IP address
   * @param {Object} result - API result to cache
   */
  cacheResult(ipAddress, result) {
    // Limit cache size to prevent memory issues
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 100 entries
      entries.slice(0, 100).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
    
    this.cache.set(ipAddress, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Get fallback result when API fails
   * @param {string} ipAddress - IP address
   * @param {Error} error - Error that occurred
   * @returns {Object} Fallback result
   */
  getFallbackResult(ipAddress, error) {
    const isLocalhost = ['127.0.0.1', '::1', 'localhost'].includes(ipAddress);
    
    return {
      ip: ipAddress,
      proxy: isLocalhost ? 'no' : 'unknown',
      type: isLocalhost ? 'localhost' : 'unknown',
      risk: isLocalhost ? 'low' : 'unknown',
      country: isLocalhost ? 'LOCAL' : 'unknown',
      region: 'unknown',
      city: 'unknown',
      isocode: 'unknown',
      provider: 'unknown',
      organisation: 'unknown',
      asn: 'unknown',
      continent: 'unknown',
      latitude: null,
      longitude: null,
      timezone: 'unknown',
      currency: 'unknown',
      disposable: 'unknown',
      vpn: 'unknown',
      lastSeen: 'unknown',
      threats: [],
      error: error.message,
      fallback: true
    };
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      apiKey: !!this.apiKey,
      baseURL: this.baseURL,
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('ProxyCheck cache cleared');
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    try {
      await this.checkIP('8.8.8.8'); // Test with Google DNS
      return true;
    } catch (error) {
      logger.warn('ProxyCheck API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Batch check multiple IPs (for future use)
   * @param {Array<string>} ipAddresses - Array of IP addresses
   * @returns {Promise<Object>} Batch results
   */
  async checkIPs(ipAddresses) {
    if (!Array.isArray(ipAddresses) || ipAddresses.length === 0) {
      throw new Error('Invalid IP addresses array');
    }

    // ProxyCheck.io supports batch requests
    try {
      const ips = ipAddresses.slice(0, 100).join(','); // Limit to 100 IPs
      const url = this.buildBatchAPIUrl(ips);
      
      const response = await axios.get(url, {
        timeout: this.timeout * 2, // Longer timeout for batch
        headers: {
          'User-Agent': 'idRock-MVP/1.0.0'
        }
      });

      const results = {};
      ipAddresses.forEach(ip => {
        if (response.data[ip]) {
          results[ip] = this.parseAPIResponse(response.data, ip);
          this.cacheResult(ip, results[ip]);
        }
      });

      return results;

    } catch (error) {
      logger.warn('Batch IP check failed:', error.message);
      
      // Fallback to individual requests
      const results = {};
      for (const ip of ipAddresses) {
        results[ip] = await this.checkIP(ip);
      }
      
      return results;
    }
  }

  /**
   * Build batch API URL
   * @param {string} ips - Comma-separated IP addresses
   * @returns {string} Batch API URL
   */
  buildBatchAPIUrl(ips) {
    let url = `${this.baseURL}/${ips}`;
    
    const params = new URLSearchParams();
    
    if (this.apiKey) {
      params.append('key', this.apiKey);
    }
    
    params.append('vpn', '1');
    params.append('asn', '1');
    params.append('risk', '1');
    
    return url + '?' + params.toString();
  }
}

module.exports = new ProxyCheckService();