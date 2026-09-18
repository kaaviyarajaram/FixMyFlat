import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function dbServerPlugin(): Plugin {
  const dbDir = path.resolve(__dirname, 'data');
  const dbPath = path.resolve(dbDir, 'db.json');

  const readDb = () => {
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      if (!fs.existsSync(dbPath)) {
        return { accounts: [], access_codes: [], issues: [] };
      }
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading data/db.json:', err);
      return { accounts: [], access_codes: [], issues: [] };
    }
  };

  const writeDb = (db: any) => {
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing data/db.json:', err);
    }
  };

  const parseBody = (req: any): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendJson = (res: any, status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end(JSON.stringify(data));
  };

  return {
    name: 'fixmyflat-db-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Handle preflight CORS
        if (req.method === 'OPTIONS' && url.startsWith('/api/')) {
          sendJson(res, 204, {});
          return;
        }

        // 1. GET /api/db - returns full database
        if (url === '/api/db' && req.method === 'GET') {
          const db = readDb();
          sendJson(res, 200, db);
          return;
        }

        // 2. POST /api/auth/signup - register new account and store permanently
        if (url === '/api/auth/signup' && req.method === 'POST') {
          const body = await parseBody(req);
          const { name, email, password, accessCode } = body;

          const cleanEmail = (email || '').trim().toLowerCase();
          const cleanName = (name || '').trim();
          const cleanCode = (accessCode || '').trim().toUpperCase();

          if (!cleanName || !cleanEmail || !password || !cleanCode) {
            sendJson(res, 400, { success: false, error: 'All fields are required.' });
            return;
          }

          let role: 'resident' | 'maintenance' | null = null;
          let apartment_id = 'Oakridge Heights';

          // Support RESIDENT-01 and variations
          if (
            cleanCode === 'RESIDENT-01' ||
            cleanCode === 'RESIDENT' ||
            cleanCode === 'RESIDENT01' ||
            cleanCode === 'RES-01' ||
            cleanCode === 'OAK-4B-RES'
          ) {
            role = 'resident';
            apartment_id = 'Oakridge Heights, Apt 4B';
          } else if (
            cleanCode === 'STAFF-01' ||
            cleanCode === 'STAFF' ||
            cleanCode === 'STAFF01' ||
            cleanCode === 'STAFF-1' ||
            cleanCode === 'MAINTENANCE' ||
            cleanCode === 'OAK-STAFF-1'
          ) {
            role = 'maintenance';
            apartment_id = 'Oakridge Heights Facility Staff';
          } else {
            const db = readDb();
            const matched = (db.access_codes || []).find((c: any) => c.code?.toUpperCase() === cleanCode);
            if (matched) {
              role = matched.role;
              apartment_id = matched.apartment_id || apartment_id;
            }
          }

          if (!role) {
            sendJson(res, 400, {
              success: false,
              error: 'Invalid access code. Please use RESIDENT-01 for Resident or STAFF-01 for Maintenance.'
            });
            return;
          }

          const db = readDb();
          if (!db.accounts) db.accounts = [];
          if (!db.profiles) db.profiles = [];

          const existingIdx = db.accounts.findIndex(
            (a: any) => a.email?.trim().toLowerCase() === cleanEmail
          );

          const userId = existingIdx >= 0 ? db.accounts[existingIdx].id : 'user-' + Date.now();
          const profile = {
            id: userId,
            name: cleanName,
            email: cleanEmail,
            role,
            apartment_id,
            avatar_url:
              role === 'resident'
                ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            created_at: new Date().toISOString()
          };

          const account = {
            id: userId,
            email: cleanEmail,
            password: password,
            profile
          };

          if (existingIdx >= 0) {
            db.accounts[existingIdx] = account;
          } else {
            db.accounts.push(account);
          }

          writeDb(db);
          console.log(`[DB Server] Account saved for ${cleanEmail} with role ${role}`);

          sendJson(res, 200, { success: true, role, profile });
          return;
        }

        // 3. POST /api/auth/login - authenticate user and return profile
        if (url === '/api/auth/login' && req.method === 'POST') {
          const body = await parseBody(req);
          const { email, password } = body;

          const cleanEmail = (email || '').trim().toLowerCase();
          const cleanPass = password || '';

          if (!cleanEmail || !cleanPass) {
            sendJson(res, 400, { success: false, error: 'Email and password are required.' });
            return;
          }

          const db = readDb();
          const accounts = db.accounts || [];

          const account = accounts.find((a: any) => a.email?.trim().toLowerCase() === cleanEmail);

          if (!account) {
            sendJson(res, 401, {
              success: false,
              error: 'No account found with this email. Please check your email or create an account.'
            });
            return;
          }

          const storedPass = account.password;
          const matches =
            !storedPass ||
            storedPass === cleanPass ||
            storedPass.trim() === cleanPass.trim();

          if (!matches) {
            sendJson(res, 401, {
              success: false,
              error: 'Incorrect password. Please verify your password and try again.'
            });
            return;
          }

          // If password was empty, link the newly supplied password
          if (!storedPass) {
            account.password = cleanPass;
            writeDb(db);
          }

          console.log(`[DB Server] User ${cleanEmail} authenticated successfully as ${account.profile.role}`);
          sendJson(res, 200, {
            success: true,
            role: account.profile.role,
            profile: account.profile
          });
          return;
        }

        // 4. GET /api/issues - fetch all issues
        if (url.startsWith('/api/issues') && req.method === 'GET') {
          const db = readDb();
          sendJson(res, 200, db.issues || []);
          return;
        }

        // 5. POST /api/issues - create new issue
        if (url === '/api/issues' && req.method === 'POST') {
          const body = await parseBody(req);
          const db = readDb();
          if (!db.issues) db.issues = [];
          db.issues.unshift(body);
          writeDb(db);
          sendJson(res, 201, body);
          return;
        }

        // 6. PATCH /api/issues/:id - update issue status
        if (url.startsWith('/api/issues/') && (req.method === 'PATCH' || req.method === 'PUT')) {
          const id = url.split('/')[3];
          const body = await parseBody(req);
          const db = readDb();
          const idx = (db.issues || []).findIndex((i: any) => i.id === id);
          if (idx >= 0) {
            db.issues[idx] = { ...db.issues[idx], ...body, updated_at: new Date().toISOString() };
            writeDb(db);
            sendJson(res, 200, db.issues[idx]);
          } else {
            sendJson(res, 404, { error: 'Issue not found' });
          }
          return;
        }

        next();
      });
    }
  };
}
