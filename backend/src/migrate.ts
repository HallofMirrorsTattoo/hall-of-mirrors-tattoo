import { spawn } from 'child_process';

export async function runMigrations(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🔄 Running Prisma migrations...');

    const timeout = setTimeout(() => {
      console.warn('⚠️  Migration timeout (exceeded 30s)');
      if (proc.pid) {
        process.kill(proc.pid);
      }
      resolve(false);
    }, 30000); // 30 second timeout

    const proc = spawn('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'pipe',
    });

    let output = '';
    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log('✅ Migrations completed successfully');
        resolve(true);
      } else {
        console.warn('⚠️  Migration exited with code', code);
        resolve(false);
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      console.warn('⚠️  Migration error:', error.message);
      resolve(false);
    });
  });
}
