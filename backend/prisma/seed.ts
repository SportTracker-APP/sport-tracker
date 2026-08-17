import { PrismaClient } from '@prisma/client';

import { seedNationalGeoCatalog } from '../src/modules/geography/geo-area-seed';

const prisma = new PrismaClient();

async function main() {
  const result = await seedNationalGeoCatalog(prisma);
  console.log('National geographic catalog synchronized', result);
}

void main().finally(() => prisma.$disconnect());
