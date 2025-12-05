// Test database connection and migrations
require('dotenv').config();
const db = require('./src/db/connection');

async function test() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***' : 'not set');
  
  // Health check
  const healthy = await db.healthCheck();
  console.log('Health check:', healthy ? '✅ PASS' : '❌ FAIL');
  if (!healthy) {
    console.error('Cannot proceed, database unreachable.');
    process.exit(1);
  }

  // Run migrations
  console.log('Running migrations...');
  try {
    await db.runMigrations();
    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  // Test CRUD operations
  console.log('Testing CRUD operations...');
  try {
    // Create
    const created = await db.createSubtask({
      id: 'test-001',
      title: 'Test Subtask',
      status: 'pending',
      branch: 'test',
      dependencies: []
    });
    console.log('✅ Created subtask:', created.id);

    // Read
    const retrieved = await db.getSubtask('test-001');
    console.log('✅ Retrieved subtask:', retrieved ? retrieved.id : 'null');

    // Update
    const updated = await db.updateSubtask('test-001', { status: 'completed' });
    console.log('✅ Updated subtask status:', updated.status);

    // List
    const list = await db.listSubtasks();
    console.log('✅ List subtasks count:', list.length);

    // Delete
    const deleted = await db.deleteSubtask('test-001');
    console.log('✅ Deleted subtask:', deleted.id);

    console.log('\nAll tests passed! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ CRUD test failed:', error.message);
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
