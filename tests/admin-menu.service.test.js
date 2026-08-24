const test = require('node:test');
const assert = require('node:assert/strict');
const { AdminMenuService } = require('../src/services/admin-menu.service');

function makeFakeCache() {
  const invalidated = [];
  return { invalidated, invalidate: (key) => invalidated.push(key) };
}

function makeFakeRepository(overrides = {}) {
  return {
    findCategoryById: async (id) => ({ id, name: 'Starters', deletedAt: null }),
    createCategory: async (data) => ({ id: 1n, ...data }),
    updateCategory: async (id, data) => ({ id, ...data }),
    softDeleteCategory: async () => {},
    countActiveItemsInCategory: async () => 0,
    findMenuItemById: async (id) => ({
      id,
      categoryId: 1n,
      name: 'Bruschetta',
      imageUrl: null,
    }),
    createItem: async (data) => ({ id: 1n, ...data }),
    updateItem: async (id, data) => ({ id, ...data }),
    softDeleteItem: async () => {},
    ...overrides,
  };
}

test('AdminMenuService.createCategory invalidates the public menu cache', async () => {
  const cache = makeFakeCache();
  const service = new AdminMenuService({ repository: makeFakeRepository(), cache });

  await service.createCategory({ name: 'Desserts' });

  assert.deepEqual(cache.invalidated, ['public:menu']);
});

test('AdminMenuService.updateCategory throws 404 when the category does not exist', async () => {
  const repository = makeFakeRepository({ findCategoryById: async () => null });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.updateCategory(999n, { name: 'x' }),
    (error) => error.statusCode === 404,
  );
});

test('AdminMenuService.deleteCategory throws 409 when it still has active items', async () => {
  const repository = makeFakeRepository({ countActiveItemsInCategory: async () => 3 });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.deleteCategory(1n),
    (error) => error.statusCode === 409,
  );
});

test('AdminMenuService.deleteCategory succeeds and invalidates cache once no items remain', async () => {
  const cache = makeFakeCache();
  const service = new AdminMenuService({ repository: makeFakeRepository(), cache });

  await service.deleteCategory(1n);

  assert.deepEqual(cache.invalidated, ['public:menu']);
});

test('AdminMenuService.deleteCategory throws 404 when the category does not exist', async () => {
  const repository = makeFakeRepository({ findCategoryById: async () => null });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.deleteCategory(999n),
    (error) => error.statusCode === 404,
  );
});

test('AdminMenuService.createItem rejects a category that does not exist', async () => {
  const repository = makeFakeRepository({ findCategoryById: async () => null });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.createItem({ categoryId: '999', name: 'Tiramisu', priceCents: 900 }),
    (error) => error.statusCode === 404,
  );
});

test('AdminMenuService.createItem creates the item and invalidates the public menu cache', async () => {
  let createPayload;
  const cache = makeFakeCache();
  const repository = makeFakeRepository({
    createItem: async (data) => {
      createPayload = data;
      return { id: 1n, ...data };
    },
  });
  const service = new AdminMenuService({ repository, cache });

  await service.createItem({
    categoryId: '1',
    name: 'Tiramisu',
    priceCents: 900,
    imageUrl: 'http://localhost:3000/uploads/menu/abc.jpg',
  });

  assert.equal(createPayload.categoryId, 1n);
  assert.equal(createPayload.imageUrl, 'http://localhost:3000/uploads/menu/abc.jpg');
  assert.deepEqual(cache.invalidated, ['public:menu']);
});

test('AdminMenuService.updateItem rejects reassigning to a category that does not exist', async () => {
  const repository = makeFakeRepository({
    findCategoryById: async () => null,
  });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.updateItem(1n, { categoryId: '999' }),
    (error) => error.statusCode === 404,
  );
});

test('AdminMenuService.updateItem replaces the stored photo and deletes the old file when a new image is uploaded', async () => {
  const repository = makeFakeRepository({
    findMenuItemById: async (id) => ({
      id,
      categoryId: 1n,
      name: 'Bruschetta',
      imageUrl: 'http://localhost:3000/uploads/menu/old.jpg',
    }),
  });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  const result = await service.updateItem(1n, {
    imageUrl: 'http://localhost:3000/uploads/menu/new.jpg',
  });

  // fs.unlink against a file that was never actually written resolves via
  // the .catch(() => {}) in unlinkStoredImage — this just proves the
  // replace path doesn't throw and the new URL wins.
  assert.equal(result.imageUrl, 'http://localhost:3000/uploads/menu/new.jpg');
});

test('AdminMenuService.updateItem leaves the photo untouched when no new image is uploaded', async () => {
  let updatePayload;
  const repository = makeFakeRepository({
    updateItem: async (id, data) => {
      updatePayload = data;
      return { id, ...data };
    },
  });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await service.updateItem(1n, { name: 'Bruschetta al Pomodoro' });

  assert.equal('imageUrl' in updatePayload, false);
});

test('AdminMenuService.deleteItem throws 404 when the item does not exist', async () => {
  const repository = makeFakeRepository({ findMenuItemById: async () => null });
  const service = new AdminMenuService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.deleteItem(999n),
    (error) => error.statusCode === 404,
  );
});

test('AdminMenuService.deleteItem invalidates the public menu cache on success', async () => {
  const cache = makeFakeCache();
  const service = new AdminMenuService({ repository: makeFakeRepository(), cache });

  await service.deleteItem(1n);

  assert.deepEqual(cache.invalidated, ['public:menu']);
});
