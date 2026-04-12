#!/usr/bin/env node
/**
 * Wrapper script for localtunnel that mimics devtunnel/code-tunnel interface
 * This allows Antigravity to forward ports without authentication
 */

const { exec } = require('child_process');
const localtunnel = require('localtunnel');

const port = process.argv.find(arg => arg.startsWith('--port'))?.split('=')[1] || 
             process.argv.find(arg => arg === '-p')?.split(' ')[1] ||
             '3000';

console.log(`Starting tunnel on port ${port}...`);

(async () => {
  try {
    const tunnel = await localtunnel({ port: parseInt(port) });
    
    console.log('');
    console.log('✓ Tunnel connected!');
    console.log(`Your tunnel is accessible at: ${tunnel.url}`);
    console.log('');
    
    tunnel.on('close', () => {
      console.log('\nTunnel closed');
      process.exit(0);
    });
    
    // Keep running
    process.on('SIGINT', () => {
      console.log('\nClosing tunnel...');
      tunnel.close();
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {}, 1000);
    
  } catch (err) {
    console.error('Tunnel error:', err.message);
    process.exit(1);
  }
})();
