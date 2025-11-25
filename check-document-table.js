const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/lms_db?schema=public'
    }
  }
});

async function check() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Document' 
      ORDER BY ordinal_position
    `;
    console.log('Document table columns:');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

check();
