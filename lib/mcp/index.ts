// lib/mcp/index.ts
export * from "./dealflow-mcp-protocol";
export * from "./dealflow-mcp-server";
export * from "./dealflow-mcp-client";
export * from "./protocol";
export * from "./server";
export * from "./client";

// Global Singleton Instance of Dealflow MCP Server for internal workflow routing
import { DealflowMCPServer } from "./dealflow-mcp-server";
import { DealflowMCPClient } from "./dealflow-mcp-client";
import { LocalTransport } from "./client";

const globalMCPServer = new DealflowMCPServer("Dealflow Production MCP Server", "2.0.0");
const globalTransport = new LocalTransport();
globalTransport.connect(globalMCPServer);

export const defaultDealflowMCPClient = new DealflowMCPClient(globalTransport);
export const defaultDealflowMCPServer = globalMCPServer;
