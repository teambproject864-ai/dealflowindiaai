// app/api/mcp/route.ts
import { NextResponse } from "next/server";
import { defaultDealflowMCPServer } from "@/lib/mcp";

export async function POST(request: Request) {
  try {
    const rpcRequest = await request.json();

    if (!rpcRequest || !rpcRequest.method) {
      return NextResponse.json(
        { jsonrpc: "2.0", id: rpcRequest?.id ?? null, error: { code: -32600, message: "Invalid Request" } },
        { status: 400 }
      );
    }

    const response = await defaultDealflowMCPServer.handleRequest(rpcRequest);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}
