const API_BASE_URL = "http://localhost:8000/api";

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("access_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem("access_token");
        if (window.location.pathname !== "/") {
            window.location.href = "/";
        }
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || response.statusText);
    }
    return response.json();
};

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
    // Auth endpoints
    async register(data: any) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async login(formData: FormData) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            body: formData,
        });
        return handleResponse(response);
    },

    async googleAuth(token: string) {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        return handleResponse(response);
    },

    // Database endpoints
    async connectDatabase(data: DBConnectRequest): Promise<DBConnectResponse> {
        const response = await fetch(`${API_BASE_URL}/connect-db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });

        return handleResponse(response);
    },

    async askQuestion(data: AskRequest): Promise<AskResponse> {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });

        return handleResponse(response);
    },

    async getHealth() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return handleResponse(response);
    },

    async getTenantHealth(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/health/${tenantId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getCacheStats() {
        const response = await fetch(`${API_BASE_URL}/cache/stats`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getTenantStats(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/stats/${tenantId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getTenantHistory(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/history/${tenantId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getSchema(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/schema/${tenantId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async disconnectTenant(tenantId: string) {
        const response = await fetch(`${API_BASE_URL}/disconnect/${tenantId}`, {
            method: "DELETE",
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getChartData(data: {
        tenant_id: string;
        table_name: string;
        x_column: string;
        y_column: string;
        chart_type: string;
        color?: string;
    }) {
        const response = await fetch(`${API_BASE_URL}/insights/chart-data`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    }
};
