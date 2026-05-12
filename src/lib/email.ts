import nodemailer from 'nodemailer';
import { getConfig } from './config';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

function getSmtpConfig(cfg: SmtpConfig): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || cfg.host,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : cfg.port,
    user: process.env.SMTP_USER || cfg.user,
    pass: process.env.SMTP_PASS || cfg.pass,
    fromName: process.env.SMTP_FROM_NAME || cfg.fromName,
    fromEmail: process.env.SMTP_FROM_EMAIL || cfg.fromEmail,
  };
}

function buildTransporter(smtp: SmtpConfig) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  baseUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  const smtp = getSmtpConfig(config.smtp);
  if (!smtp.host || !smtp.user) {
    return { ok: false, error: '未配置 SMTP 服务' };
  }

  const link = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const fromAddr = smtp.fromEmail || smtp.user;
  const fromLabel = smtp.fromName || config.siteName;

  try {
    const transporter = buildTransporter(smtp);
    await transporter.sendMail({
      from: `"${fromLabel}" <${fromAddr}>`,
      to,
      subject: `验证您的邮箱 — ${config.siteName}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1C1917;margin-bottom:8px">${config.siteName}</h2>
          <p style="color:#6B6460;margin-bottom:24px">感谢注册！请点击下方按钮验证您的邮箱地址：</p>
          <a href="${link}" style="display:inline-block;background:#CF6B4A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px">
            验证邮箱
          </a>
          <p style="color:#9C9490;font-size:12px;margin-top:24px">
            链接 24 小时内有效。若非本人操作，请忽略此邮件。<br>
            如按钮无法点击，请复制此链接到浏览器：<br>
            <a href="${link}" style="color:#CF6B4A;word-break:break-all">${link}</a>
          </p>
        </div>
      `,
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  const smtp = getSmtpConfig(config.smtp);
  if (!smtp.host || !smtp.user) {
    return { ok: false, error: '请先填写 SMTP 配置后再发送测试邮件' };
  }
  try {
    const transporter = buildTransporter(smtp);
    await transporter.sendMail({
      from: `"${smtp.fromName || config.siteName}" <${smtp.fromEmail || smtp.user}>`,
      to,
      subject: `SMTP 测试邮件 — ${config.siteName}`,
      html: `<p>邮件服务配置正常！来自 <strong>${config.siteName}</strong></p>`,
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
