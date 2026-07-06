import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = "admin@monkeycrm.com";
    const plainTextPassword = "admin123@";

    console.log(`⏳ Seeding Super Admin: ${adminEmail}...`);

    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},  
        create: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log("Super Admin successfully locked into the database!");
    console.log("Admin Database ID:", admin.id);
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });