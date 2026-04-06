const { Pool } = await import("pg");
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SERVER_URL = "http://localhost:3000";
const ENDPOINT = "/api/track";
const TOTAL_REQUESTS = process.argv[2] ? parseInt(process.argv[2]) : 100;
const CONCURRENCY = process.argv[3] ? parseInt(process.argv[3]) : 10;
const RANDOM_UA = !process.argv.includes("--no-random-ua");

let TICKET_NUMBER = null;

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
];

const getRandomUA = () => RANDOM_UA ? `${userAgents[Math.floor(Math.random() * userAgents.length)]}-${Math.random()}` : userAgents[0];

async function sendRequest(id) {
  const start = Date.now();
  const ua = getRandomUA();
  try {
    const res = await fetch(SERVER_URL + ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ua,
      },
      body: JSON.stringify({ ticket: TICKET_NUMBER }),
    });
    const data = await res.json();
    const duration = Date.now() - start;
    
    return { 
      success: res.ok, 
      status: res.status, 
      error: data.message || null, 
      duration 
    };
  } catch (err) {
    return { success: false, status: 500, error: err.message, duration: Date.now() - start };
  }
}

async function main() {
  console.log(`🔍 Fetching a valid ticket number...`);
  const ticket = await prisma.ticket.findFirst();
  if (!ticket) {
    console.error("❌ No tickets found. Please submit a ticket first.");
    process.exit(1);
  }
  TICKET_NUMBER = ticket.ticketNumber;
  console.log(`✅ Using Ticket: ${TICKET_NUMBER}`);

  console.log(`🚀 Starting load test...`);
  console.log(`🎯 Target: ${SERVER_URL}${ENDPOINT}`);
  console.log(`📦 Requests: ${TOTAL_REQUESTS} | ⚡ Concurrency: ${CONCURRENCY}`);
  console.log(`🌐 Random User-Agent: ${RANDOM_UA ? "YES" : "NO"}\n`);

  const results = [];
  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const startTime = Date.now();

  const runWorker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) break;
      const result = await sendRequest(id);
      results.push(result);
      if (results.length % 20 === 0) process.stdout.write(`.`);
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => runWorker());
  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const rateLimitCount = results.filter(r => r.status === 429).length;
  const failCount = results.length - successCount - rateLimitCount;
  
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

  console.log(`\n\n🏁 Load Test Finished!`);
  console.log(`--------------------------`);
  console.log(`✅ Success (200): ${successCount}`);
  console.log(`🛑 Rate Limited (429): ${rateLimitCount}`);
  console.log(`❌ Errors: ${failCount}`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📊 Avg Response: ${avgDuration.toFixed(2)}ms`);
  console.log(`📈 RPS: ${(results.length / (totalTime / 1000)).toFixed(2)}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
