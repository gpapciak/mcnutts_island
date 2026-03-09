const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

const FROM = `"${process.env.SMTP_FROM_NAME || "McNutt's Island Alliance"}" <${process.env.SMTP_FROM_EMAIL || 'noreply@mcnuttsisland.org'}>`;
const SITE_URL = process.env.SITE_URL || 'https://mcnuttsisland.org';

async function sendMemberConfirmation(member, token) {
  const transport = createTransport();
  const confirmUrl = `${SITE_URL}/community/confirm/${token}`;

  await transport.sendMail({
    from: FROM,
    to: member.email,
    subject: "Welcome to the McNutt's Island Alliance",
    text: `Hello ${member.name},\n\nThank you for joining the McNutt's Island Alliance community.\n\nPlease confirm your email address by visiting:\n${confirmUrl}\n\nOnce confirmed, your listing will be reviewed and added to the directory.\n\nWith warmth from the shore,\nThe McNutt's Island Alliance`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #1A3A5C; padding: 24px; text-align: center;">
          <h1 style="color: #F5F0E8; margin: 0; font-size: 20px;">McNutt's Island Alliance</h1>
        </div>
        <div style="padding: 32px; background: #FAFAF7;">
          <p>Hello ${member.name},</p>
          <p>Thank you for joining the McNutt's Island Alliance community. You're in good company — residents, property owners, researchers, and people who simply love this island have all found their way here.</p>
          <p>Please confirm your email address to complete your registration:</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="background: #2A6B7C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Email Address</a>
          </p>
          <p style="font-size: 14px; color: #666;">Or copy and paste this link: ${confirmUrl}</p>
          <p>Your listing will be reviewed after confirmation. There are no fees, no obligations — just a record that you're part of this community.</p>
          <p style="margin-top: 40px;">With warmth from the shore,<br><em>The McNutt's Island Alliance</em></p>
        </div>
        <div style="background: #E8D9C0; padding: 16px; text-align: center; font-size: 12px; color: #666;">
          <a href="${SITE_URL}" style="color: #2A6B7C;">mcnuttsisland.org</a>
        </div>
      </div>
    `,
  });
}

async function sendVoterVerification(email, token) {
  const transport = createTransport();
  const verifyUrl = `${SITE_URL}/naming/verify/${token}`;

  await transport.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your vote — McNutt's Island Naming Poll",
    text: `Thank you for participating in the McNutt's Island naming conversation.\n\nVerify your email to receive "Verified Voter" status:\n${verifyUrl}\n\nThis helps the community distinguish between verified and unverified responses when weighing the results. Your identity will not be publicly displayed.\n\nMcNutt's Island Alliance`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #1A3A5C; padding: 24px; text-align: center;">
          <h1 style="color: #F5F0E8; margin: 0; font-size: 20px;">McNutt's Island Alliance</h1>
        </div>
        <div style="padding: 32px; background: #FAFAF7;">
          <p>Thank you for participating in the island naming conversation.</p>
          <p>Verify your email address to receive <strong>Verified Voter</strong> status. This helps the community see both verified and unverified counts separately when interpreting the results.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #2A6B7C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify My Vote</a>
          </p>
          <p style="font-size: 14px; color: #666;">Or copy and paste: ${verifyUrl}</p>
          <p style="font-size: 13px; color: #888;">Your email address will not be publicly displayed. Verification simply allows the community to gauge the relative weight of verified responses.</p>
        </div>
        <div style="background: #E8D9C0; padding: 16px; text-align: center; font-size: 12px; color: #666;">
          <a href="${SITE_URL}" style="color: #2A6B7C;">mcnuttsisland.org</a>
        </div>
      </div>
    `,
  });
}

module.exports = { sendMemberConfirmation, sendVoterVerification };
