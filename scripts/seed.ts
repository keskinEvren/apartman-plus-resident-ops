#!/usr/bin/env tsx
import { db } from "@/db";
import {
  users,
  sites,
  blocks,
  units,
  roles,
  memberships,
  packageDeliveries,
  visitorPasses,
  tickets,
  ticketActivities,
  ticketAttachments,
  announcements,
  announcementReadReceipts,
  notifications,
  amenities,
  amenitySessions,
  amenityReservations,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting comprehensive database seed...");

  try {
    // ----------------------------------------------------
    // CLEANUP DATABASE
    // ----------------------------------------------------
    console.log("🗑️  Cleaning up existing database records...");
    await db.delete(packageDeliveries);
    await db.delete(visitorPasses);
    await db.delete(ticketActivities);
    await db.delete(ticketAttachments);
    await db.delete(tickets);
    await db.delete(announcementReadReceipts);
    await db.delete(announcements);
    await db.delete(notifications);
    await db.delete(amenityReservations);
    await db.delete(amenitySessions);
    await db.delete(amenities);
    await db.delete(memberships);
    await db.delete(roles);
    await db.delete(units);
    await db.delete(blocks);
    await db.delete(sites);
    await db.delete(users);
    console.log("✅ Cleanup complete!\n");

    // ----------------------------------------------------
    // CREATE USERS
    // ----------------------------------------------------
    console.log("👤 Creating mock users...");
    const adminPass = await hashPassword(
      process.env.SEED_ADMIN_PASSWORD || "admin123",
    );
    const userPass = await hashPassword(
      process.env.SEED_USER_PASSWORD || "user123",
    );

    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@example.com",
        name: "Yönetici Ahmet",
        password: adminPass,
        role: "admin",
      })
      .returning();

    const [residentUser] = await db
      .insert(users)
      .values({
        email: "user@example.com",
        name: "Sakin Caner",
        password: userPass,
        role: "user",
      })
      .returning();

    const [staffUser] = await db
      .insert(users)
      .values({
        email: "demo@example.com",
        name: "Güvenlik Mehmet",
        password: userPass, // use same password as user for easy dev swap
        role: "user",
      })
      .returning();

    console.log(
      `✅ Created 3 users: admin@example.com, user@example.com, demo@example.com`,
    );

    // ----------------------------------------------------
    // CREATE SITE STRUCTURE
    // ----------------------------------------------------
    console.log("🏢 Creating site, blocks, and units...");
    const [testSite] = await db
      .insert(sites)
      .values({
        name: "A+ Premium Rezidans",
        address: "Büyükdere Cd. No: 180, Levent, İstanbul",
      })
      .returning();

    const [blockA] = await db
      .insert(blocks)
      .values({ siteId: testSite.id, name: "A Blok" })
      .returning();
    const [blockB] = await db
      .insert(blocks)
      .values({ siteId: testSite.id, name: "B Blok" })
      .returning();

    const [unitA1] = await db
      .insert(units)
      .values({ blockId: blockA.id, unitNumber: "Daire 1" })
      .returning();
    const [unitA2] = await db
      .insert(units)
      .values({ blockId: blockA.id, unitNumber: "Daire 2" })
      .returning();
    const [unitB1] = await db
      .insert(units)
      .values({ blockId: blockB.id, unitNumber: "Daire 10" })
      .returning();

    console.log("✅ Site, blocks, and units seeded");

    // ----------------------------------------------------
    // CREATE ROLES & MEMBERSHIPS
    // ----------------------------------------------------
    console.log("🔑 Creating roles and site memberships...");
    const [adminRole] = await db
      .insert(roles)
      .values({
        siteId: testSite.id,
        name: "SITE_ADMIN",
        permissions: [
          "CREATE_ANNOUNCEMENT",
          "VIEW_READ_RECEIPTS",
          "MANAGE_TICKETS",
          "MANAGE_VISITORS",
          "MANAGE_PACKAGES",
        ],
      })
      .returning();

    const [staffRole] = await db
      .insert(roles)
      .values({
        siteId: testSite.id,
        name: "STAFF",
        permissions: [
          "VIEW_VISITORS",
          "CHECK_IN_VISITORS",
          "RECEIVE_PACKAGES",
          "DELIVER_PACKAGES",
          "VIEW_TICKETS",
          "UPDATE_TICKETS",
        ],
      })
      .returning();

    const [residentRole] = await db
      .insert(roles)
      .values({
        siteId: testSite.id,
        name: "RESIDENT",
        permissions: [],
      })
      .returning();

    // Establish memberships
    await db.insert(memberships).values({
      userId: adminUser.id,
      siteId: testSite.id,
      roleId: adminRole.id,
      isActive: true,
    });

    await db.insert(memberships).values({
      userId: residentUser.id,
      siteId: testSite.id,
      roleId: residentRole.id,
      unitId: unitA1.id,
      blockId: blockA.id,
      isActive: true,
    });

    await db.insert(memberships).values({
      userId: staffUser.id,
      siteId: testSite.id,
      roleId: staffRole.id,
      blockId: blockA.id, // assigned to Block A
      isActive: true,
    });

    console.log(
      "✅ Dynamic roles and active memberships registered successfully",
    );

    // ----------------------------------------------------
    // CREATE AMENITIES & SESSIONS
    // ----------------------------------------------------
    console.log("🏊 Creating amenities and day-schedule sessions...");
    const [gym] = await db
      .insert(amenities)
      .values({
        siteId: testSite.id,
        name: "Gym & Fitness Salonu",
        description:
          "En son model kardiyo ve ağırlık ekipmanları ile donatılmış spor alanı.",
      })
      .returning();

    const [pool] = await db
      .insert(amenities)
      .values({
        siteId: testSite.id,
        name: "Kapalı Yüzme Havuzu",
        description: "Isıtmalı yarı olimpik kapalı havuz ve dinlenme odası.",
      })
      .returning();

    // Define standard hours
    const hours = [
      { start: "09:00", end: "11:00", cap: 12 },
      { start: "11:00", end: "13:00", cap: 12 },
      { start: "14:00", end: "16:00", cap: 10 },
      { start: "16:00", end: "18:00", cap: 10 },
      { start: "18:00", end: "20:00", cap: 15 },
      { start: "20:00", end: "22:00", cap: 15 },
    ];

    const sessionValues = [];
    for (let day = 0; day <= 6; day++) {
      // 0 = Sunday, 1 = Monday, etc.
      for (const h of hours) {
        sessionValues.push({
          siteId: testSite.id,
          amenityId: gym.id,
          dayOfWeek: day,
          startTime: h.start,
          endTime: h.end,
          capacity: h.cap,
        });
        sessionValues.push({
          siteId: testSite.id,
          amenityId: pool.id,
          dayOfWeek: day,
          startTime: h.start,
          endTime: h.end,
          capacity: h.cap - 4, // pool slightly lower capacity
        });
      }
    }

    await db.insert(amenitySessions).values(sessionValues);
    console.log(
      "✅ Amenities and 84 weekly scheduled sessions successfully generated",
    );

    // ----------------------------------------------------
    // PRE-SEED PACKAGES & VISITORS & ANNOUNCEMENTS & TICKETS
    // ----------------------------------------------------
    console.log("📦 Pre-seeding operational resident records...");

    // Pre-seeded package
    await db.insert(packageDeliveries).values({
      siteId: testSite.id,
      unitId: unitA1.id,
      carrierName: "Aras Kargo",
      otpCode: "246813",
      status: "RECEIVED",
    });

    // Pre-seeded expected visitor
    const todayStr = new Date().toISOString().split("T")[0];
    await db.insert(visitorPasses).values({
      siteId: testSite.id,
      unitId: unitA1.id,
      visitorName: "Ayşe Çelik",
      visitDate: todayStr,
      expectedTime: "15:00",
      status: "EXPECTED",
      createdById: residentUser.id,
    });

    // Pre-seeded announcement
    await db.insert(announcements).values({
      siteId: testSite.id,
      title: "Havuz Temizlik Çalışması ve Seans Kapasiteleri",
      content:
        "Değerli sakinlerimiz, 25 Mayıs Pazartesi günü kapalı yüzme havuzumuz dezenfeksiyon çalışmaları sebebiyle 09:00 - 13:00 saatleri arasında kapalı olacaktır. Diğer seanslar için rezervasyonlarınızı uygulama üzerinden gerçekleştirebilirsiniz.",
      priority: "IMPORTANT",
      authorId: adminUser.id,
    });

    // Pre-seeded support ticket
    const [ticketRecord] = await db
      .insert(tickets)
      .values({
        siteId: testSite.id,
        unitId: unitA1.id,
        blockId: blockA.id,
        reporterUserId: residentUser.id,
        category: "TECHNICAL",
        title: "Banyo bataryası su sızdırıyor",
        description:
          "Banyo lavabosundaki bataryanın altından sürekli su sızıyor. Dolap içi ıslanmaya başladı, acil teknik destek rica ediyoruz.",
        status: "OPEN",
      })
      .returning();

    await db.insert(ticketActivities).values({
      siteId: testSite.id,
      ticketId: ticketRecord.id,
      actorUserId: residentUser.id,
      activityType: "STATUS_CHANGE",
      content: "Talep sakin tarafından oluşturuldu. Durum: AÇIK",
    });

    console.log(
      "✅ Seeded package, expected visitor, announcement, and support ticket",
    );
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 COMPREHENSIVE SEED SUCCESSFULLY MINTED! 🏆");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 Development Credentials:");
    console.log("   Resident: user@example.com  / user123");
    console.log("   Security: demo@example.com  / user123");
    console.log("   Admin:    admin@example.com / admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Seeding database failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
