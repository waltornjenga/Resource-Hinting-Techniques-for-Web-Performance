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
}
