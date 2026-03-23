import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";
const STORAGE_ROOT = path.join(__dirname, "storage");
const UPLOAD_ROOT = path.join(STORAGE_ROOT, "submissions");
const DATA_ROOT = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_ROOT, "submissions.db");
const ADMIN_HTML_PATH = path.join(__dirname, "admin.html");
const PROJECT_ROOT = path.dirname(__dirname);
const DATABASE_DRIVER = process.env.DATABASE_DRIVER || "sqlite";
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ADMIN_PROTECT = process.env.ADMIN_PROTECT === "true";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || "";
const POSTGRES_URL = process.env.POSTGRES_URL || "";

await mkdir(UPLOAD_ROOT, { recursive: true });
await mkdir(DATA_ROOT, { recursive: true });

const database = await createDatabaseAdapter();
const storage = await createStorageAdapter();
const adminHtml = await readFile(ADMIN_HTML_PATH, "utf8");

function stripTrailingSlash(value) {
  if (!value || value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function decodeUrlPathname(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function createDatabaseAdapter() {
  if (DATABASE_DRIVER === "postgres") {
    if (!POSTGRES_URL) {
      throw new Error("DATABASE_DRIVER=postgres but POSTGRES_URL is missing.");
    }

    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: process.env.POSTGRES_SSL === "false" ? false : { rejectUnauthorized: false }
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        source_ip TEXT,
        user_agent TEXT,
        adult_name TEXT,
        adult_age TEXT,
        adult_job TEXT,
        adult_life_update TEXT,
        adult_super TEXT,
        adult_issues TEXT,
        child_name TEXT,
        child_age TEXT,
        child_dream TEXT,
        child_life_update TEXT,
        child_super TEXT,
        child_issues TEXT,
        adult_card_path TEXT NOT NULL,
        child_card_path TEXT NOT NULL
      );
    `);

    return {
      async upsertSubmission(record) {
        await pool.query(
          `
            INSERT INTO submissions (
              id, created_at, source_ip, user_agent,
              adult_name, adult_age, adult_job, adult_life_update, adult_super, adult_issues,
              child_name, child_age, child_dream, child_life_update, child_super, child_issues,
              adult_card_path, child_card_path
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16,
              $17, $18
            )
            ON CONFLICT(id) DO UPDATE SET
              created_at = EXCLUDED.created_at,
              source_ip = EXCLUDED.source_ip,
              user_agent = EXCLUDED.user_agent,
              adult_name = EXCLUDED.adult_name,
              adult_age = EXCLUDED.adult_age,
              adult_job = EXCLUDED.adult_job,
              adult_life_update = EXCLUDED.adult_life_update,
              adult_super = EXCLUDED.adult_super,
              adult_issues = EXCLUDED.adult_issues,
              child_name = EXCLUDED.child_name,
              child_age = EXCLUDED.child_age,
              child_dream = EXCLUDED.child_dream,
              child_life_update = EXCLUDED.child_life_update,
              child_super = EXCLUDED.child_super,
              child_issues = EXCLUDED.child_issues,
              adult_card_path = EXCLUDED.adult_card_path,
              child_card_path = EXCLUDED.child_card_path
          `,
          submissionToArray(record)
        );
      },
      async countSubmissions() {
        const result = await pool.query("SELECT COUNT(*)::int AS total FROM submissions");
        return result.rows[0]?.total || 0;
      },
      async listSubmissions({ limit = 100, search = "" } = {}) {
        const normalizedLimit = Math.max(1, Math.min(Number(limit) || 100, 1000));
        const searchValue = `%${search.trim()}%`;
        const result = await pool.query(
          `
            SELECT * FROM submissions
            WHERE
              $1 = '%%' OR
              adult_name ILIKE $1 OR
              child_name ILIKE $1 OR
              adult_job ILIKE $1 OR
              child_dream ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2
          `,
          [searchValue, normalizedLimit]
        );

        return result.rows;
      },
      async exportRows() {
        const result = await pool.query("SELECT * FROM submissions ORDER BY created_at DESC");
        return result.rows;
      },
      async getSubmissionById(id) {
        const result = await pool.query("SELECT * FROM submissions WHERE id = $1 LIMIT 1", [id]);
        return result.rows[0] || null;
      },
      async deleteSubmissionById(id) {
        await pool.query("DELETE FROM submissions WHERE id = $1", [id]);
      }
    };
  }

  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      source_ip TEXT,
      user_agent TEXT,
      adult_name TEXT,
      adult_age TEXT,
      adult_job TEXT,
      adult_life_update TEXT,
      adult_super TEXT,
      adult_issues TEXT,
      child_name TEXT,
      child_age TEXT,
      child_dream TEXT,
      child_life_update TEXT,
      child_super TEXT,
      child_issues TEXT,
      adult_card_path TEXT NOT NULL,
      child_card_path TEXT NOT NULL
    );
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO submissions (
      id,
      created_at,
      source_ip,
      user_agent,
      adult_name,
      adult_age,
      adult_job,
      adult_life_update,
      adult_super,
      adult_issues,
      child_name,
      child_age,
      child_dream,
      child_life_update,
      child_super,
      child_issues,
      adult_card_path,
      child_card_path
    ) VALUES (
      $id,
      $created_at,
      $source_ip,
      $user_agent,
      $adult_name,
      $adult_age,
      $adult_job,
      $adult_life_update,
      $adult_super,
      $adult_issues,
      $child_name,
      $child_age,
      $child_dream,
      $child_life_update,
      $child_super,
      $child_issues,
      $adult_card_path,
      $child_card_path
    )
    ON CONFLICT(id) DO UPDATE SET
      created_at = excluded.created_at,
      source_ip = excluded.source_ip,
      user_agent = excluded.user_agent,
      adult_name = excluded.adult_name,
      adult_age = excluded.adult_age,
      adult_job = excluded.adult_job,
      adult_life_update = excluded.adult_life_update,
      adult_super = excluded.adult_super,
      adult_issues = excluded.adult_issues,
      child_name = excluded.child_name,
      child_age = excluded.child_age,
      child_dream = excluded.child_dream,
      child_life_update = excluded.child_life_update,
      child_super = excluded.child_super,
      child_issues = excluded.child_issues,
      adult_card_path = excluded.adult_card_path,
      child_card_path = excluded.child_card_path
  `);

  return {
    async upsertSubmission(record) {
      insertSubmission.run(record);
    },
    async countSubmissions() {
      const row = db.prepare("SELECT COUNT(*) AS total FROM submissions").get();
      return row.total;
    },
    async listSubmissions({ limit = 100, search = "" } = {}) {
      const normalizedLimit = Math.max(1, Math.min(Number(limit) || 100, 1000));
      const hasSearch = search.trim().length > 0;

      if (hasSearch) {
        const pattern = `%${search.trim()}%`;
        return db.prepare(`
          SELECT * FROM submissions
          WHERE
            adult_name LIKE ? OR
            child_name LIKE ? OR
            adult_job LIKE ? OR
            child_dream LIKE ?
          ORDER BY created_at DESC
          LIMIT ?
        `).all(pattern, pattern, pattern, pattern, normalizedLimit);
      }

      return db.prepare(`
        SELECT * FROM submissions
        ORDER BY created_at DESC
        LIMIT ?
      `).all(normalizedLimit);
    },
    async exportRows() {
      return db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all();
    },
    async getSubmissionById(id) {
      return db.prepare("SELECT * FROM submissions WHERE id = ? LIMIT 1").get(id) || null;
    },
    async deleteSubmissionById(id) {
      db.prepare("DELETE FROM submissions WHERE id = ?").run(id);
    }
  };
}

async function createStorageAdapter() {
  if (STORAGE_DRIVER === "s3") {
    if (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      throw new Error("STORAGE_DRIVER=s3 but S3 env vars are incomplete.");
    }

    const { DeleteObjectCommand, S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY
      }
    });

    return {
      mode: "s3",
      async saveCardPair({ submissionId, createdAt, adultCard, childCard }) {
        const datePart = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
        const baseKey = `submissions/${datePart}/${submissionId}`;
        const adultKey = `${baseKey}/adult-card.png`;
        const childKey = `${baseKey}/child-card.png`;

        await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: adultKey,
          Body: Buffer.from(await adultCard.arrayBuffer()),
          ContentType: adultCard.type || "image/png"
        }));

        await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: childKey,
          Body: Buffer.from(await childCard.arrayBuffer()),
          ContentType: childCard.type || "image/png"
        }));

        return {
          adultCardPath: buildS3PublicUrl(adultKey),
          childCardPath: buildS3PublicUrl(childKey)
        };
      },
      async deleteCardPair({ adultCardPath, childCardPath }) {
        const keys = [adultCardPath, childCardPath]
          .map((value) => getS3KeyFromPublicPath(value))
          .filter(Boolean);

        await Promise.all(keys.map((key) => s3Client.send(new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key
        }))));
      }
    };
  }

  return {
    mode: "local",
    async saveCardPair({ submissionId, createdAt, adultCard, childCard }) {
      const datePart = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
      const submissionDirectory = path.join(UPLOAD_ROOT, datePart, submissionId);
      await mkdir(submissionDirectory, { recursive: true });

      const adultDiskPath = path.join(submissionDirectory, "adult-card.png");
      const childDiskPath = path.join(submissionDirectory, "child-card.png");

      await writeFile(adultDiskPath, Buffer.from(await adultCard.arrayBuffer()));
      await writeFile(childDiskPath, Buffer.from(await childCard.arrayBuffer()));

      return {
        adultCardPath: `/storage/submissions/${datePart}/${submissionId}/adult-card.png`,
        childCardPath: `/storage/submissions/${datePart}/${submissionId}/child-card.png`
      };
    },
    async deleteCardPair({ adultCardPath, childCardPath }) {
      const targets = [adultCardPath, childCardPath]
        .map((value) => getLocalStoragePathFromPublicPath(value))
        .filter(Boolean);

      await Promise.all(targets.map((targetPath) => rm(targetPath, { force: true })));
    }
  };
}

function buildS3PublicUrl(key) {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}/${key}`;
}

function getS3KeyFromPublicPath(publicPath) {
  const value = String(publicPath || "").trim();
  if (!value) return "";

  if (S3_PUBLIC_BASE_URL) {
    const publicBase = S3_PUBLIC_BASE_URL.replace(/\/$/, "");
    if (value.startsWith(`${publicBase}/`)) {
      return value.slice(publicBase.length + 1);
    }
  }

  const fallbackBase = `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}/`;
  if (value.startsWith(fallbackBase)) {
    return value.slice(fallbackBase.length);
  }

  return "";
}

function getLocalStoragePathFromPublicPath(publicPath) {
  const value = String(publicPath || "").trim();
  if (!value.startsWith("/storage/")) return "";

  const relativePath = value.replace(/^\/storage\/+/, "");
  const resolvedPath = path.resolve(STORAGE_ROOT, relativePath);
  const normalizedRoot = path.resolve(STORAGE_ROOT);

  if (!resolvedPath.startsWith(normalizedRoot)) {
    return "";
  }

  return resolvedPath;
}

function submissionToArray(record) {
  return [
    record.id,
    record.created_at,
    record.source_ip,
    record.user_agent,
    record.adult_name,
    record.adult_age,
    record.adult_job,
    record.adult_life_update,
    record.adult_super,
    record.adult_issues,
    record.child_name,
    record.child_age,
    record.child_dream,
    record.child_life_update,
    record.child_super,
    record.child_issues,
    record.adult_card_path,
    record.child_card_path
  ];
}

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token"
  });
  response.end(JSON.stringify(payload));
}

function text(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    ...headers
  });
  response.end(body);
}

function html(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8"
  });
  response.end(body);
}

function csvEscape(value) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll(`"`, `""`)}"`;
}

function createCsvContent(rows) {
  const headers = [
    "id",
    "created_at",
    "adult_name",
    "adult_age",
    "adult_job",
    "adult_life_update",
    "adult_super",
    "adult_issues",
    "child_name",
    "child_age",
    "child_dream",
    "child_life_update",
    "child_super",
    "child_issues",
    "adult_card_path",
    "child_card_path"
  ];

  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  });

  return lines.join("\n");
}

function normalizeSubmissionId(rawValue) {
  const cleaned = String(rawValue || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");

  return cleaned || crypto.randomUUID();
}

function requireAdmin(url, request, response) {
  if (!ADMIN_PROTECT) return true;
  if (!ADMIN_TOKEN) return true;

  const tokenFromQuery = url.searchParams.get("token") || "";
  const tokenFromHeader = request.headers["x-admin-token"] || "";

  if (tokenFromQuery === ADMIN_TOKEN || tokenFromHeader === ADMIN_TOKEN) {
    return true;
  }

  json(response, 401, { ok: false, error: "ADMIN_AUTH_REQUIRED" });
  return false;
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html": return "text/html; charset=utf-8";
    case ".js":
    case ".mjs": return "application/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".svg": return "image/svg+xml";
    case ".ttf": return "font/ttf";
    case ".woff": return "font/woff";
    case ".woff2": return "font/woff2";
    default: return "application/octet-stream";
  }
}

function resolveStaticPath(urlPathname) {
  const decodedPathname = decodeUrlPathname(urlPathname);
  const normalized = decodedPathname === "/" ? "/index.html" : decodedPathname;
  const sanitized = path.normalize(normalized).replace(/^(\.\.[\/\\])+/, "");
  return path.join(PROJECT_ROOT, sanitized);
}

async function serveStaticFile(url, response) {
  const filePath = resolveStaticPath(url.pathname);

  try {
    const buffer = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": getContentType(filePath),
      "Cache-Control": path.extname(filePath) ? "public, max-age=3600" : "no-cache"
    });
    response.end(buffer);
    return true;
  } catch {
    return false;
  }
}

async function handleSubmission(request, response) {
  let formData;

  try {
    const webRequest = new Request(`http://${request.headers.host || "127.0.0.1"}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: request,
      duplex: "half"
    });

    formData = await webRequest.formData();
  } catch (error) {
    console.error("Cannot parse multipart form.", error);
    json(response, 400, { ok: false, error: "INVALID_FORM_DATA" });
    return;
  }

  const metadataRaw = formData.get("metadata");
  const adultCard = formData.get("adultCard");
  const childCard = formData.get("childCard");

  if (typeof metadataRaw !== "string" || !(adultCard instanceof File) || !(childCard instanceof File)) {
    json(response, 400, { ok: false, error: "MISSING_REQUIRED_FIELDS" });
    return;
  }

  let metadata;

  try {
    metadata = JSON.parse(metadataRaw);
  } catch {
    json(response, 400, { ok: false, error: "INVALID_METADATA_JSON" });
    return;
  }

  const submissionId = normalizeSubmissionId(metadata.submissionId);
  const createdAt = metadata.createdAt || new Date().toISOString();

  const { adultCardPath, childCardPath } = await storage.saveCardPair({
    submissionId,
    createdAt,
    adultCard,
    childCard
  });

  await database.upsertSubmission({
    id: submissionId,
    created_at: createdAt,
    source_ip: request.socket.remoteAddress || "",
    user_agent: request.headers["user-agent"] || "",
    adult_name: metadata.adultName || "",
    adult_age: metadata.adultAge || "",
    adult_job: metadata.adultJob || "",
    adult_life_update: metadata.adultLifeUpdate || "",
    adult_super: metadata.adultSuper || "",
    adult_issues: metadata.adultIssues || "",
    child_name: metadata.childName || "",
    child_age: metadata.childAge || "",
    child_dream: metadata.childDream || "",
    child_life_update: metadata.childLifeUpdate || "",
    child_super: metadata.childSuper || "",
    child_issues: metadata.childIssues || "",
    adult_card_path: adultCardPath,
    child_card_path: childCardPath
  });

  json(response, 200, {
    ok: true,
    submissionId,
    adultCardPath,
    childCardPath
  });
}

async function handleAdminPage(url, request, response) {
  if (!requireAdmin(url, request, response)) return;
  html(response, 200, adminHtml);
}

async function handleSubmissionsList(url, request, response) {
  if (!requireAdmin(url, request, response)) return;

  const rows = await database.listSubmissions({
    limit: url.searchParams.get("limit") || 100,
    search: url.searchParams.get("search") || ""
  });

  json(response, 200, { ok: true, rows });
}

async function handleDeleteSubmission(submissionId, url, request, response) {
  if (!requireAdmin(url, request, response)) return;

  const record = await database.getSubmissionById(submissionId);
  if (!record) {
    json(response, 404, { ok: false, error: "SUBMISSION_NOT_FOUND" });
    return;
  }

  await storage.deleteCardPair({
    adultCardPath: record.adult_card_path,
    childCardPath: record.child_card_path
  });

  await database.deleteSubmissionById(submissionId);

  json(response, 200, { ok: true, deletedId: submissionId });
}

async function serveLocalStorageFile(url, response) {
  const relativePath = decodeUrlPathname(url.pathname).replace(/^\/storage\/+/, "");
  const filePath = path.join(STORAGE_ROOT, relativePath);

  try {
    const buffer = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000"
    });
    response.end(buffer);
  } catch {
    json(response, 404, { ok: false, error: "FILE_NOT_FOUND" });
  }
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    json(response, 404, { ok: false });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  const pathname = stripTrailingSlash(url.pathname);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    json(response, 200, {
      ok: true,
      service: "back-to-me-backend",
      databaseDriver: DATABASE_DRIVER,
      storageDriver: STORAGE_DRIVER
    });
    return;
  }

  if (request.method === "GET" && pathname === "/admin") {
    await handleAdminPage(url, request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/submissions") {
    await handleSubmissionsList(url, request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/submissions/export.csv") {
    if (!requireAdmin(url, request, response)) return;

    const csvContent = createCsvContent(await database.exportRows());
    text(response, 200, csvContent, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="back-to-me-submissions.csv"`
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/submissions/count") {
    if (!requireAdmin(url, request, response)) return;

    const total = await database.countSubmissions();
    json(response, 200, { ok: true, total });
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/submissions/")) {
    const submissionId = pathname.slice("/api/submissions/".length).trim();
    await handleDeleteSubmission(submissionId, url, request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/submissions") {
    await handleSubmission(request, response);
    return;
  }

  if (request.method === "GET" && STORAGE_DRIVER === "local" && url.pathname.startsWith("/storage/")) {
    await serveLocalStorageFile(url, response);
    return;
  }

  if (request.method === "GET") {
    const served = await serveStaticFile(url, response);
    if (served) return;
  }

  json(response, 404, { ok: false, error: "NOT_FOUND" });
});

server.listen(PORT, HOST, () => {
  console.log(`Back To Me backend running at http://${HOST}:${PORT}`);
  console.log(`Admin page: http://127.0.0.1:${PORT}/admin`);
  console.log(`Database driver: ${DATABASE_DRIVER}`);
  console.log(`Storage driver: ${STORAGE_DRIVER}`);
});
