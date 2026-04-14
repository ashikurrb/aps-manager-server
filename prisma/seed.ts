import dotenv from "dotenv";
import { prisma } from "../src/shared/lib/prismaClient.js";
import { hashPassword } from "../src/shared/utils/hash.utils.js";

dotenv.config();

async function main() {
  console.log("Seeding database...🌱");

  const fullName = process.env.SEED_ADMIN_FULLNAME!;
  const email = process.env.SEED_ADMIN_EMAIL!;
  const phone = process.env.SEED_ADMIN_PHONE!;
  const password = process.env.SEED_ADMIN_PASSWORD!;

  if (!fullName || !email || !phone || !password) {
    throw new Error("Seed env's are missing ⛔");
  }

  // Check existing User
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (!existingUser) {
    const hashedPassword = await hashPassword(password);

    //Create User
    await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("Seed Successfully! ☑️");
  } else {
    console.log("User already exists. Skipping...⚠️");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });