import { build } from 'astro';

async function run() {
  console.log('Starting Astro build programmatically...');
  try {
    await build({
      root: '.',
    });
    console.log('Astro build completed successfully!');
  } catch (err) {
    console.error('Build failed with error:', err);
    process.exit(1);
  }
}

run();
