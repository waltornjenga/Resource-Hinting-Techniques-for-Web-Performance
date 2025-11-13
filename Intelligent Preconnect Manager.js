class PreconnectManager {
    constructor() {
        this.connections = new Map();
        this.maxConnections = 6;
        this.retryDelay = 2000;
        
        this.connection = navigator.connection;
        this.setupNetworkAwareness();
    }

    setupNetworkAwareness() {
        if (this.connection) {
            this.connection.addEventListener('change', this.handleNetworkChange.bind(this));
        }
    }

    handleNetworkChange() {
        if (this.connection.saveData || this.connection.effectiveType === 'slow-2g') {
            this.clearAll();
        }
    }

    async preconnect(url, options = {}) {
        const {
            credentials = 'include',
            priority = 'auto',
            timeout = 3000,
            retries = 2
        } = options;

        if (this.connections.has(url)) {
            return this.connections.get(url);
        }

        const connection = {
            url,
            status: 'pending',
            createdAt: Date.now(),
            attempts: 0
        };

        this.connections.set(url, connection);

        try {
            await this.establishConnection(url, credentials, timeout, retries);
            connection.status = 'connected';
            
            setTimeout(() => this.cleanup(url), 10000);
            
        } catch (error) {
            connection.status = 'failed';
            this.scheduleRetry(url, options);
        }

        return connection;
    }

    establishConnection(url, credentials, timeout, maxRetries) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            link.crossOrigin = credentials === 'include' ? 'use-credentials' : 'anonymous';

            let attempts = 0;
            const tryConnect = () => {
                attempts++;
                
                const timeoutId = setTimeout(() => {
                    document.head.removeChild(link);
                    if (attempts < maxRetries) {
                        setTimeout(tryConnect, this.retryDelay);
                    } else {
                        reject(new Error(`Preconnect timeout for ${url}`));
                    }
                }, timeout);

                link.onload = () => {
                    clearTimeout(timeoutId);
                    resolve();
                };

                link.onerror = () => {
                    clearTimeout(timeoutId);
                    if (attempts < maxRetries) {
                        setTimeout(tryConnect, this.retryDelay);
                    } else {
                        reject(new Error(`Preconnect failed for ${url}`));
                    }
                };

                document.head.appendChild(link);
            };

            tryConnect();
        });
    }

    scheduleRetry(url, options) {
        const backoffDelay = Math.min(30000, this.retryDelay * Math.pow(2, options.retries || 2));
        setTimeout(() => {
            this.preconnect(url, { ...options, retries: (options.retries || 2) - 1 });
        }, backoffDelay);
    }

    cleanup(url) {
        this.connections.delete(url);
    }

    clearAll() {
        this.connections.clear();
    }

    getStats() {
        const stats = {
            total: this.connections.size,
            connected: 0,
            pending: 0,
            failed: 0
        };

        for (const conn of this.connections.values()) {
            stats[conn.status]++;
        }

        return stats;
    }
}

const preconnectManager = new PreconnectManager();

preconnectManager.preconnect('https://api.example.com', {
    credentials: 'include',
    priority: 'high',
    timeout: 2000,
    retries: 3
});
