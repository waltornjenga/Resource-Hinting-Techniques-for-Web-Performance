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
        } catch (error) {
            connection.status = 'failed';
        }

        return connection;
    }

    clearAll() {
        this.connections.clear();
    }
}
