const { Pool } = await import("pg");
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SERVER_URL = "http://localhost:3000";
const ENDPOINT = "/api/tickets";
const TOTAL_REQUESTS = process.argv[2] ? parseInt(process.argv[2]) : 50;
const CONCURRENCY = process.argv[3] ? parseInt(process.argv[3]) : 5;

let SERVICE_ID = null;

const dummyPayload = () => ({
  name: "Load Tester " + Math.floor(Math.random() * 1000),
  email: `test-${Math.floor(Math.random() * 10000)}@example.com`,
  serviceId: SERVICE_ID,
  subject: "Load Test Submission",
  message: "This is an automated load test message to observe memory usage. " + "X".repeat(100),
  captchaToken: "dev-token", 
});

async function sendRequest(id) {
  const start = Date.now();
  const payload = dummyPayload();
  try {
    const res = await fetch(SERVER_URL + ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const duration = Date.now() - start;
    if (res.ok) {
      return { success: true, duration };
    } else {
      console.log(`\n❌ Request Failed: ${duration}ms | Status: ${res.status} | Msg: ${data.message}`);
      return { success: false, error: data.message || "Unknown error", duration };
    }
  } catch (err) {
    return { success: false, error: err.message, duration: Date.now() - start };
  }
}

async function main() {
  console.log(`🔍 Fetching service ID...`);
  const service = await prisma.service.findFirst();
  if (!service) {
    console.error("❌ No service found in DB. Please seed first.");
    process.exit(1);
  }
  SERVICE_ID = service.id;
  console.log(`✅ Using Service: ${service.name}`);
  console.log(`🆔 Service ID: "${SERVICE_ID}"`);


  console.log(`🚀 Starting load test...`);
  console.log(`🎯 Target: ${SERVER_URL}${ENDPOINT}`);
  console.log(`📦 Requests: ${TOTAL_REQUESTS} | ⚡ Concurrency: ${CONCURRENCY}\n`);

  const results = [];
  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  
  const startTime = Date.now();

  const runWorker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) break;
      const result = await sendRequest(id);
      results.push(result);
      if (results.length % 10 === 0) {
        process.stdout.write(`.`);
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => runWorker());
  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
  const avgDuration = totalDuration / results.length;

  console.log(`\n\n🏁 Load Test Finished!`);
  console.log(`--------------------------`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📊 Avg Response: ${avgDuration.toFixed(2)}ms`);
  console.log(`📈 Requests per second: ${(results.length / (totalTime / 1000)).toFixed(2)}`);
  
  if (failCount > 0) {
    console.log(`\n⚠️ Errors:`);
    const errors = [...new Set(results.filter(r => !r.success).map(r => r.error))];
    errors.forEach(e => console.log(` - ${e}`));
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
