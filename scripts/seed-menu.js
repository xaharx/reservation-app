/**
 * Seeds a small sample menu so the mobile Menu/Cart screens have something to
 * show. There is no admin UI for menu management in this codebase yet, so
 * this script is the only way to populate menu_categories/menu_items today.
 *
 * Run locally (needs a reachable DATABASE_URL and a migrated schema):
 *   node scripts/seed-menu.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MENU = [
  {
    name: 'Antipasti',
    description: 'To start',
    items: [
      { name: 'Bruschetta al Pomodoro', description: 'Grilled bread, tomato, basil, olive oil', priceCents: 850 },
      { name: 'Carpaccio di Manzo', description: 'Thin-sliced beef, arugula, parmesan', priceCents: 1600 },
    ],
  },
  {
    name: 'Pasta',
    description: 'House-made, daily',
    items: [
      { name: 'Tagliatelle al Tartufo', description: 'Truffle cream sauce, parmesan', priceCents: 2400 },
      { name: 'Spaghetti alle Vongole', description: 'Clams, white wine, garlic, chili', priceCents: 2200 },
    ],
  },
  {
    name: 'Secondi',
    description: 'Mains',
    items: [
      { name: 'Branzino al Forno', description: 'Roasted sea bass, lemon, herbs', priceCents: 3200 },
      { name: 'Filetto di Manzo', description: 'Beef tenderloin, red wine reduction', priceCents: 3800 },
    ],
  },
  {
    name: 'Dolci',
    description: 'To finish',
    items: [
      { name: 'Tiramisù', description: 'Espresso, mascarpone, cocoa', priceCents: 950 },
      { name: 'Panna Cotta', description: 'Vanilla bean, berry coulis', priceCents: 850 },
    ],
  },
];

async function main() {
  for (const [categoryIndex, category] of MENU.entries()) {
    const createdCategory = await prisma.menuCategory.upsert({
      where: { name: category.name },
      update: { description: category.description, sortOrder: categoryIndex, isPublished: true },
      create: {
        name: category.name,
        description: category.description,
        sortOrder: categoryIndex,
        isPublished: true,
      },
    });

    for (const [itemIndex, item] of category.items.entries()) {
      // No unique constraint on (categoryId, name) exists, so this is a manual
      // find-then-write instead of a true upsert-by-key.
      const existing = await prisma.menuItem.findFirst({
        where: { categoryId: createdCategory.id, name: item.name },
        select: { id: true },
      });

      const data = {
        description: item.description,
        priceCents: item.priceCents,
        sortOrder: itemIndex,
        isAvailable: true,
        isPublished: true,
      };

      if (existing) {
        await prisma.menuItem.update({ where: { id: existing.id }, data });
      } else {
        await prisma.menuItem.create({
          data: { ...data, categoryId: createdCategory.id, name: item.name },
        });
      }
    }
  }

  console.log('Seeded menu categories and items.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
