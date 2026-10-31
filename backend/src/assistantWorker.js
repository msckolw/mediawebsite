require('dotenv').config();
const mongoose = require('mongoose');
const { runNext } = require('./services/assistant/worker');
const { settings, configured } = require('./services/assistant/providers');
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });
async function main() {
  if (!settings().enabled || !configured()) throw new Error('Configure Parallel, OpenAI, and xAI API keys and enable the assistant before starting its worker.');
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD_HASH) throw new Error('Configure secure admin credentials first.');
  await mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true,useUnifiedTopology:true});
  try {
    do {
      const result = await runNext();
      if (process.argv.includes('--once')) break;
      if (result === 'empty' || result === 'busy') await new Promise(resolve => setTimeout(resolve,3000));
    } while (!stopped);
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error('Assistant worker:',error.message); process.exitCode=1; });
