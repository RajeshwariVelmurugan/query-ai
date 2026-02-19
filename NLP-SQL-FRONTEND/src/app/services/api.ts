const API_BASE_URL = "http://localhost:8000/api";

export interface DBConnectRequest {
    db_type: string;
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
}

export interface DBConnectResponse {
    tenant_id: string;
    status: string;
    message: string;
}

export interface AskRequest {
    tenant_id: string;
    question: string;
}

export interface AskResponse {
    answer: any[];
    sql: string | null;
    execution_time: string;
    cache_hit: boolean;
    error: string | null;
}

export const api = {
    async connectDatabase(data: DBConnectRequest): Promise<DBConnectResponse> {
        const response = await fetch(`${API_BASE_URL}/connect-db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to connect to database");
        }

        return response.json();
    },

    async askQuestion(data: AskRequest): Promise<AskResponse> {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to fetch answer");
        }

        return response.json();
    },

    async getHealth() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    },

    async getTenantHealth(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/health/${tenantId}`);
        return response.json();
    },

    async getCacheStats() {
        const response = await fetch(`${API_BASE_URL}/cache/stats`);
        return response.json();
    },

    async getTenantStats(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/stats/${tenantId}`);
        return response.json();
    },

    async getTenantHistory(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/history/${tenantId}`);
        return response.json();
    }
};
