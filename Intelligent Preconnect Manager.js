class PreconnectManager {
    constructor() {
        this.connections = new Map();
        this.maxConnections = 6;
        this.retryDelay = 2000;
    }
}
