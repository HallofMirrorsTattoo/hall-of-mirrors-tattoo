import { execSync } from 'child_process';
export async function runMigrations() {
    try {
        console.log('🔄 Running Prisma migrations...');
        const result = execSync('npx prisma migrate deploy', {
            stdio: 'pipe',
            timeout: 60000, // 60 second timeout
        });
        console.log('✅ Migrations completed successfully');
        return true;
    }
    catch (error) {
        console.warn('⚠️  Migration warning (continuing anyway):', error.message);
        // Don't crash the server if migrations fail
        // The database might already be up to date
        return false;
    }
}
//# sourceMappingURL=migrate.js.map