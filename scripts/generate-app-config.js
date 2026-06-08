const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root (if exists)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ── API config (consumed by Angular at runtime) ──────────────────
const apiBase = process.env.API_BASE || process.env.NX_API_BASE || '/api';
const catalogosBase = process.env.CATALOGOS_API_BASE || `${apiBase}/Catalogos`;
const catalogoBase = process.env.CATALOGO_API_BASE || `${apiBase}/catalogo`;
const defaultTipoUsuario = process.env.DEFAULT_TIPO_USUARIO || 'Empleado';

const appConfig = {
    apiBase,
    catalogosBase,
    catalogoBase,
    defaultTipoUsuario
};

const appConfigDest = path.resolve(process.cwd(), 'src', 'assets', 'app-config.json');
fs.mkdirSync(path.dirname(appConfigDest), { recursive: true });
fs.writeFileSync(appConfigDest, JSON.stringify(appConfig, null, 2) + '\n', 'utf8');

console.log(`✔ Generated ${path.relative(process.cwd(), appConfigDest)} with:`);
console.log(appConfig);

// ── Proxy config (consumed by Angular CLI dev-server) ────────────
const apiTarget = process.env.API_TARGET || 'https://localhost:7140';
const proxySecure = process.env.PROXY_SECURE === 'true';

const proxyConfig = {
    '/api': {
        target: apiTarget,
        secure: proxySecure,
        changeOrigin: true,
        logLevel: 'debug',
        pathRewrite: {}
    }
};

const proxyDest = path.resolve(process.cwd(), 'proxy.conf.json');
fs.writeFileSync(proxyDest, JSON.stringify(proxyConfig, null, 4) + '\n', 'utf8');

console.log(`✔ Generated ${path.relative(process.cwd(), proxyDest)} targeting: ${apiTarget}`);
