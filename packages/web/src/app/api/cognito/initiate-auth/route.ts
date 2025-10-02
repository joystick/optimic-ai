import { NextResponse } from "next/server";
import { initiateCustomAuth } from "~/lib/cognito";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await initiateCustomAuth(email);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Initiate auth error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
