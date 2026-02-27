#!/usr/bin/env node

/**
 * Cross-Platform Service Installer
 * Supports: macOS (launchd), Linux (systemd), Windows (Task Scheduler)
 * 
 * Usage:
 *   node src/service-installer.js install
 *   node src/service-installer.js uninstall
 *   node src/service-installer.js status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SERVICE_NAME = 'graph-art-service';
const PROJECT_DIR = path.resolve(__dirname, '..');

function getOS() {
    const platform = os.platform();
    if (platform === 'darwin') return 'macos';
    if (platform === 'linux') return 'linux';
    if (platform === 'win32') return 'windows';
    return 'unknown';
}

// ═══════════════════════════════════════════════════════════════════
// macOS — launchd
// ═══════════════════════════════════════════════════════════════════

function macosInstall() {
    const nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    const plistName = `com.${SERVICE_NAME}.plist`;
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', plistName);
    const logDir = path.join(PROJECT_DIR, 'logs');

    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.${SERVICE_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${path.join(PROJECT_DIR, 'src', 'index.js')}</string>
        <string>--run</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
    
    <key>StartInterval</key>
    <integer>21600</integer>
    <!-- Runs every 6 hours (21600 seconds) -->
    
    <key>StandardOutPath</key>
    <string>${path.join(logDir, 'stdout.log')}</string>
    
    <key>StandardErrorPath</key>
    <string>${path.join(logDir, 'stderr.log')}</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>`;

    fs.writeFileSync(plistPath, plistContent);

    try {
        execSync(`launchctl unload "${plistPath}" 2>/dev/null`, { stdio: 'pipe' });
    } catch { }

    execSync(`launchctl load "${plistPath}"`, { stdio: 'pipe' });

    console.log('✅ macOS service installed successfully!');
    console.log(`   Plist: ${plistPath}`);
    console.log(`   Logs:  ${logDir}`);
    console.log('   The service will run every 6 hours.');
}

function macosUninstall() {
    const plistName = `com.${SERVICE_NAME}.plist`;
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', plistName);

    try {
        execSync(`launchctl unload "${plistPath}"`, { stdio: 'pipe' });
    } catch { }

    if (fs.existsSync(plistPath)) {
        fs.unlinkSync(plistPath);
    }

    console.log('✅ macOS service uninstalled.');
}

function macosStatus() {
    try {
        const output = execSync(`launchctl list | grep ${SERVICE_NAME}`, { encoding: 'utf-8' });
        console.log('✅ Service is loaded:');
        console.log(`   ${output.trim()}`);
    } catch {
        console.log('⚠️  Service is not loaded.');
    }
}

// ═══════════════════════════════════════════════════════════════════
// Linux — systemd
// ═══════════════════════════════════════════════════════════════════

function linuxInstall() {
    const nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    const serviceFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${SERVICE_NAME}.service`);
    const timerFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${SERVICE_NAME}.timer`);
    const configDir = path.dirname(serviceFile);

    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

    // Service unit
    const serviceContent = `[Unit]
Description=GitHub Contribution Graph Art Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=${PROJECT_DIR}
ExecStart=${nodePath} ${path.join(PROJECT_DIR, 'src', 'index.js')} --run
Environment=HOME=${os.homedir()}
Environment=PATH=${process.env.PATH}

[Install]
WantedBy=default.target
`;

    // Timer unit (every 6 hours)
    const timerContent = `[Unit]
Description=GitHub Contribution Graph Art Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=6h
Persistent=true

[Install]
WantedBy=timers.target
`;

    fs.writeFileSync(serviceFile, serviceContent);
    fs.writeFileSync(timerFile, timerContent);

    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
    execSync(`systemctl --user enable ${SERVICE_NAME}.timer`, { stdio: 'pipe' });
    execSync(`systemctl --user start ${SERVICE_NAME}.timer`, { stdio: 'pipe' });

    console.log('✅ Linux systemd service installed successfully!');
    console.log(`   Service: ${serviceFile}`);
    console.log(`   Timer:   ${timerFile}`);
    console.log('   The service will run every 6 hours.');
    console.log('');
    console.log('   Useful commands:');
    console.log(`   systemctl --user status ${SERVICE_NAME}.timer`);
    console.log(`   systemctl --user status ${SERVICE_NAME}.service`);
    console.log(`   journalctl --user -u ${SERVICE_NAME}.service`);
}

function linuxUninstall() {
    try {
        execSync(`systemctl --user stop ${SERVICE_NAME}.timer`, { stdio: 'pipe' });
        execSync(`systemctl --user disable ${SERVICE_NAME}.timer`, { stdio: 'pipe' });
    } catch { }

    const serviceFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${SERVICE_NAME}.service`);
    const timerFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${SERVICE_NAME}.timer`);

    if (fs.existsSync(serviceFile)) fs.unlinkSync(serviceFile);
    if (fs.existsSync(timerFile)) fs.unlinkSync(timerFile);

    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });

    console.log('✅ Linux systemd service uninstalled.');
}

function linuxStatus() {
    try {
        const output = execSync(`systemctl --user status ${SERVICE_NAME}.timer`, { encoding: 'utf-8' });
        console.log(output);
    } catch (err) {
        console.log('⚠️  Service timer is not active.');
        console.log(err.stdout || '');
    }
}

// ═══════════════════════════════════════════════════════════════════
// Windows — Task Scheduler
// ═══════════════════════════════════════════════════════════════════

function windowsInstall() {
    const nodePath = execSync('where node', { encoding: 'utf-8' }).trim().split('\n')[0].trim();
    const scriptPath = path.join(PROJECT_DIR, 'src', 'index.js');
    const taskName = SERVICE_NAME;

    // Create a batch wrapper
    const batchPath = path.join(PROJECT_DIR, 'run-service.bat');
    const batchContent = `@echo off\r\ncd /d "${PROJECT_DIR}"\r\n"${nodePath}" "${scriptPath}" --run\r\n`;
    fs.writeFileSync(batchPath, batchContent);

    // Delete existing task if exists
    try {
        execSync(`schtasks /Delete /TN "${taskName}" /F`, { stdio: 'pipe' });
    } catch { }

    // Create scheduled task (runs every 6 hours)
    execSync(
        `schtasks /Create /TN "${taskName}" /TR "${batchPath}" /SC HOURLY /MO 6 /F`,
        { stdio: 'pipe' }
    );

    console.log('✅ Windows Task Scheduler service installed successfully!');
    console.log(`   Task Name: ${taskName}`);
    console.log(`   Batch:     ${batchPath}`);
    console.log('   The service will run every 6 hours.');
    console.log('');
    console.log('   View in Task Scheduler (taskschd.msc) or run:');
    console.log(`   schtasks /Query /TN "${taskName}"`);
}

function windowsUninstall() {
    try {
        execSync(`schtasks /Delete /TN "${SERVICE_NAME}" /F`, { stdio: 'pipe' });
    } catch { }

    const batchPath = path.join(PROJECT_DIR, 'run-service.bat');
    if (fs.existsSync(batchPath)) fs.unlinkSync(batchPath);

    console.log('✅ Windows scheduled task removed.');
}

function windowsStatus() {
    try {
        const output = execSync(`schtasks /Query /TN "${SERVICE_NAME}" /V /FO LIST`, { encoding: 'utf-8' });
        console.log(output);
    } catch {
        console.log('⚠️  Scheduled task is not registered.');
    }
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

function main() {
    const args = process.argv.slice(2);
    const action = args[0];
    const osType = getOS();

    console.log(`\n🖥️  Detected OS: ${osType}\n`);

    if (!['install', 'uninstall', 'status'].includes(action)) {
        console.log('Usage:');
        console.log('  node src/service-installer.js install    — Install as background service');
        console.log('  node src/service-installer.js uninstall  — Remove background service');
        console.log('  node src/service-installer.js status     — Check service status');
        return;
    }

    const handlers = {
        macos: { install: macosInstall, uninstall: macosUninstall, status: macosStatus },
        linux: { install: linuxInstall, uninstall: linuxUninstall, status: linuxStatus },
        windows: { install: windowsInstall, uninstall: windowsUninstall, status: windowsStatus },
    };

    const handler = handlers[osType];
    if (!handler) {
        console.error(`❌ Unsupported OS: ${osType}`);
        process.exit(1);
    }

    handler[action]();
}

main();
