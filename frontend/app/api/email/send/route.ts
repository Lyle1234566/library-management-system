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
    const message = error instanceof Error ? error.message : "Failed to send email.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
