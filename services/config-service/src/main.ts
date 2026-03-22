import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ path: "../../.env" });

const app = express();
const port = Number(process.env.CONFIG_SERVICE_PORT ?? 3006);
const configToken = process.env.CONFIG_SERVICE_TOKEN ?? "";

app.use(cors());
app.use(express.json());

type ServiceUrls = {
    authServiceUrl: string;
    requestServiceUrl: string;
    volunteerServiceUrl: string;
    notificationServiceUrl: string;
    apiGatewayUrl: string;
};

const getServiceUrls = (): ServiceUrls => ({
    authServiceUrl: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
    requestServiceUrl: process.env.REQUEST_SERVICE_URL ?? "http://localhost:3002",
    volunteerServiceUrl: process.env.VOLUNTEER_SERVICE_URL ?? "http://localhost:3003",
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3004",
    apiGatewayUrl: process.env.API_GATEWAY_URL ?? "http://localhost:3005"
});

const getPublicConfig = () => ({
    appName: "ReliefLink",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_GATEWAY_URL ?? "http://localhost:3005",
    services: {
        auth: "/api/v1/auth",
        users: "/api/v1/users",
        requests: "/api/v1/requests",
        volunteers: "/api/v1/volunteers",
        resources: "/api/v1/resources",
        assignments: "/api/v1/assignments",
        notifications: "/api/v1/notifications",
        statusEvents: "/api/v1/status-events"
    }
});

app.get("/health", (_req, res) => {
    res.json({ service: "config-service", status: "ok" });
});

app.get("/api/v1/config/public", (_req, res) => {
    res.json(getPublicConfig());
});

app.get("/api/v1/config/internal", (req, res) => {
    if (configToken) {
        const incoming = req.headers["x-config-token"];
        if (incoming !== configToken) {
            res.status(401).json({ message: "Unauthorized config access" });
            return;
        }
    }

    res.json({
        serviceUrls: getServiceUrls(),
        security: {
            jwtSecretConfigured: Boolean(process.env.JWT_SECRET)
        }
    });
});

app.listen(port, () => {
    console.log(`Config service running on http://localhost:${port}`);
});
