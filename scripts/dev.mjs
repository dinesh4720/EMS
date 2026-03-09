import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = {
  backend: {
    label: 'backend',
    cwd: rootDir,
    args: ['run', 'dev', '-w', 'school-backend'],
  },
  dashboard: {
    label: 'dashboard',
    cwd: rootDir,
    args: ['run', 'dev', '-w', 'school-dashboard'],
  },
  parent: {
    label: 'parent',
    cwd: rootDir,
    args: ['run', 'start', '-w', 'parent-app', '--', '--port', '8081'],
  },
  staff: {
    label: 'staff',
    cwd: rootDir,
    args: ['run', 'start', '-w', 'staff-app', '--', '--port', '8082'],
  },
  'owlin-api': {
    label: 'owlin-api',
    cwd: path.join(rootDir, 'owlin', 'server'),
    args: ['run', 'dev'],
  },
  'owlin-web': {
    label: 'owlin-web',
    cwd: rootDir,
    args: ['run', 'dev', '-w', 'owlin-tracker'],
  },
};

const groups = {
  all: ['backend', 'dashboard', 'parent', 'staff', 'owlin-api', 'owlin-web'],
  web: ['backend', 'dashboard', 'owlin-api', 'owlin-web'],
  mobile: ['parent', 'staff'],
  owlin: ['owlin-api', 'owlin-web'],
};

const selectedGroup = process.argv[2] || 'all';
const selectedServices = groups[selectedGroup];

if (!selectedServices) {
  console.error(`Unknown dev group: ${selectedGroup}`);
  console.error(`Available groups: ${Object.keys(groups).join(', ')}`);
  process.exit(1);
}

const children = new Map();
let shuttingDown = false;
let exitCode = 0;

// Windows leaves the spawned dev server alive if only the npm wrapper is killed.
const terminateChild = (child, signal = 'SIGTERM') => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill(signal);
};

const forwardOutput = (stream, label, target) => {
  let buffered = '';

  stream.on('data', (chunk) => {
    buffered += chunk.toString();
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`[${label}] ${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffered) {
      target.write(`[${label}] ${buffered}\n`);
    }
  });
};

const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      terminateChild(child, signal);
    }
  }
};

for (const key of selectedServices) {
  const service = services[key];
  const child = spawn(npmCommand, service.args, {
    cwd: service.cwd,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.set(key, child);
  forwardOutput(child.stdout, service.label, process.stdout);
  forwardOutput(child.stderr, service.label, process.stderr);

  child.on('exit', (code, signal) => {
    children.delete(key);

    if (!shuttingDown && code && code !== 0) {
      exitCode = code;
      console.error(`[${service.label}] exited with code ${code}`);
      stopAll();
      return;
    }

    if (!shuttingDown && signal) {
      console.error(`[${service.label}] exited with signal ${signal}`);
      exitCode = 1;
      stopAll();
      return;
    }

    if (children.size === 0) {
      process.exit(exitCode);
    }
  });

  child.on('error', (error) => {
    exitCode = 1;
    console.error(`[${service.label}] failed to start: ${error.message}`);
    stopAll();
  });
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
