import { execSync } from 'child_process';

export async function runMigrations(): Promise<boolean> {
  try {
    console.log('🔄 Deploying Prisma migrations...');

    // Run synchronously so we wait for it to complete
    const output = execSync('npx prisma migrate deploy --skip-generate 2>&1', {
      stdio: 'pipe',
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    console.log('✅ Migrations deployed successfully');
    console.log(output);
    return true;
  } catch (error: any) {
    console.error('⚠️ Migration error:', error.message);
    console.error('Attempting fallback with db push...');

    try {
      // Fallback: try db push which syncs schema without migration files
      const output = execSync('npx prisma db push --skip-generate 2>&1', {
        stdio: 'pipe',
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      console.log('✅ Database schema synced with db push');
      console.log(output);
      return true;
    } catch (fallbackError: any) {
      console.error('❌ Both migrate deploy and db push failed:', fallbackError.message);
      throw new Error(`Database migration failed: ${fallbackError.message}`);
    }
  }
}
