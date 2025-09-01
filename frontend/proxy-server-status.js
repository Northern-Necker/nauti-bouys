/**
 * Proxy Server Status Manager
 * Handles optional AI proxy server connectivity with graceful fallback
 */

class ProxyServerStatus {
    constructor() {
        this.proxyUrl = 'http://localhost:3001';
        this.isAvailable = false;
        this.lastCheckTime = 0;
        this.checkInterval = 30000; // Re-check every 30 seconds
        this.statusElement = null;
    }

    /**
     * Initialize the proxy status checker
     */
    async init(statusElement) {
        this.statusElement = statusElement;
        await this.checkStatus();
        
        // Set up periodic checking
        setInterval(() => this.checkStatus(), this.checkInterval);
        
        return this.isAvailable;
    }

    /**
     * Check if proxy server is running
     */
    async checkStatus() {
        const now = Date.now();
        
        // Skip if checked recently
        if (now - this.lastCheckTime < 5000) {
            return this.isAvailable;
        }
        
        this.lastCheckTime = now;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            
            const response = await fetch(`${this.proxyUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.setAvailable(true);
                return true;
            }
        } catch (error) {
            // Expected when server is not running
            console.debug('Proxy server not available - standalone mode active');
        }
        
        this.setAvailable(false);
        return false;
    }

    /**
     * Update availability status
     */
    setAvailable(available) {
        const wasAvailable = this.isAvailable;
        this.isAvailable = available;
        
        // Update global flags
        window.proxyServerAvailable = available;
        window.proxyBaseUrl = this.proxyUrl;
        
        // Update UI if status changed
        if (wasAvailable !== available && this.statusElement) {
            this.updateUI();
        }
    }

    /**
     * Update the status UI element
     */
    updateUI() {
        if (!this.statusElement) return;
        
        if (this.isAvailable) {
            this.statusElement.innerHTML = `
                <span style="color: #28a745;">🟢 AI Proxy Connected</span>
                <small style="opacity: 0.8; margin-left: 10px;">Enhanced AI features active</small>
            `;
            this.statusElement.style.backgroundColor = '#e8f5e8';
        } else {
            this.statusElement.innerHTML = `
                <span style="color: #856404;">🟡 Standalone Mode</span>
                <small style="opacity: 0.8; margin-left: 10px;">
                    Core features active | 
                    <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">
                        node ai-proxy-server.js
                    </code> for AI features
                </small>
            `;
            this.statusElement.style.backgroundColor = '#fff3cd';
        }
        
        this.statusElement.style.padding = '10px 15px';
        this.statusElement.style.borderRadius = '5px';
        this.statusElement.style.marginBottom = '15px';
        this.statusElement.style.fontSize = '14px';
        this.statusElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    }

    /**
     * Make an API request with proxy fallback handling
     */
    async makeRequest(endpoint, payload) {
        if (!this.isAvailable) {
            // Check one more time before failing
            await this.checkStatus();
            
            if (!this.isAvailable) {
                throw new Error(
                    'AI proxy server not running. To enable AI features:\n' +
                    '1. Open a terminal in the frontend directory\n' +
                    '2. Run: npm install (if not done already)\n' +
                    '3. Run: node ai-proxy-server.js\n' +
                    '4. Keep the server running and refresh this page'
                );
            }
        }
        
        try {
            const response = await fetch(`${this.proxyUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            // If connection failed, mark as unavailable
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.setAvailable(false);
                throw new Error(
                    'Lost connection to AI proxy server. Please ensure it\'s running:\n' +
                    'node ai-proxy-server.js'
                );
            }
            throw error;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProxyServerStatus;
}

// Create global instance
window.proxyServerStatus = new ProxyServerStatus();