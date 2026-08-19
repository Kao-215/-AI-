require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const adminUserIds = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const contactInfo =
  process.env.CONTACT_INFO || '管理處聯絡方式尚未設定，請於 .env 補上 CONTACT_INFO';

const feeReminderDaysBefore = (process.env.FEE_REMINDER_DAYS_BEFORE || '7,3,1')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !Number.isNaN(n));

const feeCheckCron = process.env.FEE_CHECK_CRON || '0 9 * * *';

module.exports = {
  lineConfig: config,
  adminUserIds,
  contactInfo,
  feeReminderDaysBefore,
  feeCheckCron,
  port: process.env.PORT || 3000,
};
