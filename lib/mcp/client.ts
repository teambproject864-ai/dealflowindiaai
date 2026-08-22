import { 
  JSONRPCRequest, 
  JSONRPCResponse, 
  MCPErrorCode,
  InitializeParams,
  InitializeResult,
  Tool,
  CallToolParams,
  CallToolResult,
  Resource,
  ReadResourceParams,
  ReadResourceResult
} from "./protocol";

export interface Transport {
  send(message: JSONRPCRequest): Promise<JSONRPCResponse>;
}

export class MCPClient {
  private transport: Transport;
  private initialized: boolean = false;
  private serverCapabilities?: InitializeResult["capabilities"];

  constructor(transport: Transport) {
    this.transport = transport;
  }

  /**
   * Initializes the connection with the protocol server.
   */
  public async initialize(clientName: string = "Dealflow MCP Client", clientVersion: string = "2.0.0"): Promise<InitializeResult> {
    const params: InitializeParams = {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: true,
        resources: true
      },
      clientInfo: {
        name: clientName,
        version: clientVersion
      }
    };

    const response = await this.transport.send({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "initialize",
      params
    });

    if (response.error) {
      throw response.error;
    }

    const result = response.result as InitializeResult;
    this.serverCapabilities = result.capabilities;
    this.initialized = true;
    return result;
  }

  /**
   * Lists available tools from the server.
   */
  public async listTools(): Promise<Tool[]> {
    this.ensureInitialized();
    const response = await this.transport.send({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list"
    });

    if (response.error) throw response.error;
    return response.result.tools;
  }

  /**
   * Calls a tool on the server.
   */
  public async callTool(name: string, args: Record<string, any>): Promise<CallToolResult> {
    this.ensureInitialized();
    const params: CallToolParams = { name, arguments: args };
    const response = await this.transport.send({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params
    });

    if (response.error) throw response.error;
    return response.result;
  }

  /**
   * Lists available resources from the server.
   */
  public async listResources(): Promise<Resource[]> {
    this.ensureInitialized();
    const response = await this.transport.send({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "resources/list"
    });

    if (response.error) throw response.error;
    return response.result.resources;
  }

  /**
   * Reads a resource from the server.
   */
  public async readResource(uri: string): Promise<ReadResourceResult> {
    this.ensureInitialized();
    const params: ReadResourceParams = { uri };
    const response = await this.transport.send({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "resources/read",
      params
    });

    if (response.error) throw response.error;
    return response.result;
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw { code: MCPErrorCode.InvalidRequest, message: "Client not initialized. Call initialize() first." };
    }
  }
}

/**
 * A simple in-memory transport for testing or local usage.
 */
export class LocalTransport implements Transport {
  private server: any; // MCPServer

  constructor(server?: any) {
    this.server = server;
  }

  public connect(server: any) {
    this.server = server;
  }

  async send(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.server) {
      throw { code: MCPErrorCode.InternalError, message: "LocalTransport not connected to an MCPServer" };
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return await this.server.handleRequest(request);
  }
}
