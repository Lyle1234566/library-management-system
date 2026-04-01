import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type EmailPayload = {
  recipient?: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildTransport = () => {
  const user = getRequiredEnv("MAILER_GMAIL_USER");
  const password = getRequiredEnv("MAILER_GMAIL_APP_PASSWORD").replace(/\s+/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: password,
    },
  });
};

const buildFromAddress = (): string => {
  const fromEmail = process.env.MAILER_FROM_EMAIL?.trim() || getRequiredEnv("MAILER_GMAIL_USER");
  const fromName = process.env.MAILER_FROM_NAME?.trim();

  if (!fromName) {
    return fromEmail;
  }

  return `${fromName} <${fromEmail}>`;
};

const formatBridgeError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Failed to send email.";
  }

  const message = error.message.trim();
  const lowered = message.toLowerCase();
  const errorWithCode = error as Error & { code?: string };

  if (message.startsWith("Missing required environment variable:")) {
    return message;
  }

  if (
    errorWithCode.code === "EAUTH" ||
    lowered.includes("invalid login") ||
    lowered.includes("username and password not accepted") ||
    lowered.includes('missing credentials for "plain"')
  ) {
    return "Gmail authentication failed. Check MAILER_GMAIL_USER and MAILER_GMAIL_APP_PASSWORD.";
  }

  if (errorWithCode.code === "EENVELOPE" || lowered.includes("from")) {
    return "The sender address was rejected. Check MAILER_FROM_EMAIL and MAILER_FROM_NAME.";
  }

  if (lowered.includes("daily user sending quota exceeded")) {
    return "The Gmail sending limit was reached. Try again later or use a different mail account.";
  }

  return message || "Failed to send email.";
};

export async function POST(request: Request) {
  try {
    const expectedSecret = getRequiredEnv("EMAIL_BRIDGE_SECRET");
    const receivedSecret = request.headers.get("x-email-bridge-secret")?.trim();

    if (!receivedSecret || receivedSecret !== expectedSecret) {
      return NextResponse.json({ detail: "Unauthorized email bridge request." }, { status: 401 });
    }

    const body = (await request.json()) as EmailPayload;
    const recipient = body.recipient?.trim();
    const subject = body.subject?.trim();
    const textBody = body.textBody?.trim();
    const htmlBody = body.htmlBody?.trim();

    if (!recipient || !subject || !textBody || !htmlBody) {
      return NextResponse.json(
        { detail: "recipient, subject, textBody, and htmlBody are required." },
        { status: 400 },
      );
    }

    const transporter = buildTransport();
    const from = buildFromAddress();

    await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return NextResponse.json({ message: "Email sent." }, { status: 200 });
  } catch (error) {
    const message = formatBridgeError(error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
