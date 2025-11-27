import { Buffer } from 'buffer';
import { createHmac } from 'crypto';

// Types for configuration overrides from the UI
export interface NemoConfig {
  env?: string;
  authHeader?: string;
  lookupUrl?: string;
}

// Default ENV values provided by user
const DEFAULT_ENV: Record<string, string> = {
  NEMO_AUTH_MODE: "basic",
  NEMO_MOCK: "false",
  NEMO_CENTER_ID: "293-52-09-19",
  NEMO_PARTNER_ID: "59",
  NEMO_PARTNER_SECRET: "h1CoEpuPWmvecyzEsmXqs0jCDiJZgda0XfChTE8gePXKBgy2WYyKEnNzORASfer-k6Ffzx8hsj2FOtWITTIvKg",
  NEMO_USER_ID: "701-77-23-36",
  NEMO_USER_PASSWORD: "701-77-23-36",
  NEMO_STORAGE_SYSTEM_ID: "76102dc1-0706-4ad8-a9c5-0fd54fb065de"
};

// Helper to safely get env vars or overrides
const getEnv = (key: string, overrides?: NemoConfig): string | undefined => {
  if (key === 'NEMO_ENV' && overrides?.env) return overrides.env;
  if ((key === 'NEMO_AUTH_HEADER' || key === 'NEMO_SIMSE_HEADER') && overrides?.authHeader) return overrides.authHeader;
  if (key === 'NEMO_LOOKUP_URL' && overrides?.lookupUrl) return overrides.lookupUrl;
  
  // Fallback to process.env if available
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  
  // Fallback to hardcoded defaults
  return DEFAULT_ENV[key];
};

// Simple base64url decode
function decodeBase64Url(input: string): Buffer {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return Buffer.from(s, "base64");
}

function getLookupUrl(config?: NemoConfig): string | undefined {
  const explicit = getEnv('NEMO_LOOKUP_URL', config);
  if (explicit) return explicit;

  const env = (getEnv('NEMO_ENV', config) || "").toLowerCase();
  if (env === "development" || env === "dev" || env === "test") return "https://hub.nemocloud-development.net/SimpleLookUpService";
  if (env === "preprod") return "https://hub.nemocloud-preprod.com/SimpleLookUpService";
  if (env === "production" || env === "prod") return "https://hub.nemocloud-services.com/SimpleLookUpService";
  
  // Default to production if unspecified
  return "https://hub.nemocloud-services.com/SimpleLookUpService"; 
}

async function resolveServiceVersioned(baseLookup: string, name: string, version: string, centerId?: string | null): Promise<string> {
  const base = baseLookup.replace(/\/$/, "");
  const endpoints = [
    base.endsWith("/graphql") ? base : `${base}/graphql`,
    `${base}/services/graphql`,
    base,
  ];
  const query = `query getRegisteredServiceOfCenter($name: String!, $version: String!, $centerId: String) {\n  getRegisteredServiceOfCenter(name: $name, version: $version, centerId: $centerId) { url name version }\n}`;
  const variables: any = { name, version, centerId: centerId ?? null };
  const sanitize = (u: string) => u.replace(/\/$/, "").replace(/\/graphql$/i, "").replace(/\/services\/graphql$/i, "");
  
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const data = json?.data?.getRegisteredServiceOfCenter;
        const entry = Array.isArray(data) ? data[0] : data;
        const url: string | undefined = entry?.url;
        if (url) return sanitize(url);
      }
    } catch {
      // try next
    }
  }
  
  // REST fallback
  const restCandidates = [
    `${base}/getServiceUrl?service=${encodeURIComponent(name)}`,
    `${base}/services/getServiceUrl?service=${encodeURIComponent(name)}`,
  ];
  for (const url of restCandidates) {
    try {
      const raw = await fetch(url).then(r => r.text());
      const text = raw.trim();
      try {
        const parsed = JSON.parse(text);
        const u = (parsed?.url || parsed?.data?.url) as string | undefined;
        if (u && /^https?:\/\//i.test(u)) return sanitize(u);
      } catch {
        if (text.startsWith("http")) return sanitize(text);
        const line = text.split(/\r?\n/).map(s => s.trim()).find(s => s.startsWith("http"));
        if (line) return sanitize(line);
      }
    } catch {
      // try next
    }
  }
  throw new Error(`Lookup failed for ${name}`);
}

export type NemoServices = { RegisterService: string; NemoStudioService: string; DownloadUploadService: string; StorageService?: string };

export async function getNemoServices(config?: NemoConfig): Promise<NemoServices> {
  // Allow explicit overrides from environment (parity with backend)
  const explicitRegister = getEnv('NEMO_REGISTER_SERVICE_URL', config)?.replace(/\/$/, "");
  const explicitStudio = getEnv('NEMO_STUDIO_GRAPHQL_URL', config)?.replace(/\/$/, "");
  const explicitStorage = getEnv('NEMO_STORAGE_BASE_URL', config)?.replace(/\/$/, "");

  if (explicitRegister && explicitStudio && explicitStorage) {
    // When explicit URLs are provided, prefer them and skip discovery
    const baseStudio = explicitStudio.replace(/\/graphql$/i, "");
    return {
      RegisterService: explicitRegister,
      NemoStudioService: baseStudio,
      DownloadUploadService: explicitStorage.replace(/\/storage$/i, ""),
      StorageService: explicitStorage,
    };
  }

  const lookup = getLookupUrl(config);
  if (!lookup) throw new Error("NEMO_LOOKUP_URL or NEMO_ENV must be configured");

  const centerId = getEnv('NEMO_CENTER_ID', config) || undefined;
  
  const RegisterService = explicitRegister || await resolveServiceVersioned(lookup, "RegisterService", "6.0", null);
  const NemoStudioService = (explicitStudio ? explicitStudio.replace(/\/graphql$/i, "") : await resolveServiceVersioned(lookup, "NemoStudioService", "1.0", centerId));
  const DownloadUploadService = explicitStorage ? explicitStorage.replace(/\/storage$/i, "") : await resolveServiceVersioned(lookup, "DownloadUploadService", "1.0", centerId);
  let StorageService: string | undefined = explicitStorage;
  if (!StorageService) {
    try { StorageService = await resolveServiceVersioned(lookup, "StorageService", "1.0", centerId); } catch { }
  }
  return { RegisterService, NemoStudioService, DownloadUploadService, StorageService };
}

function nemoHeaders(auth: string, extra?: Record<string, string>, config?: NemoConfig): Record<string, string> {
  const centerId = getEnv('NEMO_CENTER_ID', config) || "";
  const base: Record<string, string> = { Authorization: auth, "User-Agent": "YourSmileFront/1.0" };
  if (centerId) base["CenterID"] = centerId;
  return { ...base, ...(extra || {}) };
}

export async function getSimseHeader(svcs: NemoServices, config?: NemoConfig): Promise<string> {
  // Prefer pre-supplied Simse header from env or config
  const envHeaderRaw = getEnv('NEMO_AUTH_HEADER', config) || getEnv('NEMO_SIMSE_HEADER', config) || "";
  if (envHeaderRaw) {
    const h = /^Simse\s+/i.test(envHeaderRaw) ? envHeaderRaw.trim() : `Simse ${envHeaderRaw.trim()}`;
    return h;
  }

  // Auto mode (default): try Partner if its vars exist, else Basic if its vars exist.
  const mode = (getEnv('NEMO_AUTH_MODE', config) || "auto").toLowerCase();
  const centerId = getEnv('NEMO_CENTER_ID', config) || "";

  const tryBasic = async () => {
    // Support both variable names seen across repos
    const user = getEnv('NEMO_USER', config) || getEnv('NEMO_USER_ID', config) || "";
    const pass = getEnv('NEMO_PASSWORD', config) || getEnv('NEMO_USER_PASSWORD', config) || "";
    if (!user || !pass) return null;

    const base = (getEnv('NEMO_REGISTER_SERVICE_URL', config) || svcs.RegisterService).replace(/\/$/, "");
    const urls = [
      `${base}/authentication/authenticate?loginCenters=true&remember=true`,
      `${base}/authentication/authenticate?remember=true`,
      `${base}/authentication/authenticate`,
    ];

    const buildHeaders = (withCenter: boolean) => {
      const h: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
      };
      if (withCenter && centerId) h["CenterID"] = centerId;
      return h;
    };

    const tryOnce = async (url: string, withCenter: boolean) => {
      const res = await fetch(url, { method: "GET", headers: buildHeaders(withCenter) });
      if (!res.ok) throw new Error(`Authenticate failed: ${res.status}`);
      const text = await res.text();
      const xmlMatch = text.match(/<authHeader>([^<]+)<\/authHeader>/i);
      if (xmlMatch?.[1]) return xmlMatch[1].trim();
      if (/^Simse\s+/i.test(text.trim())) return text.trim();
      try {
        const json = JSON.parse(text);
        const candidate: any = json?.authHeader || json?.token || json?.data?.authHeader || json?.data?.token;
        if (typeof candidate === "string" && /^Simse\s+/i.test(candidate)) return candidate.trim();
      } catch { }
      const h = res.headers.get("authorization") || res.headers.get("Authorization");
      if (h && /^Simse\s+/i.test(h)) return h.trim();
      throw new Error("Missing Simse header in auth response");
    };

    for (const u of urls) {
      for (const withCenter of [true, false]) {
        try { return await tryOnce(u, withCenter); } catch { }
      }
    }
    return null;
  };

  if (mode === "basic") {
    const token = await tryBasic();
    if (token) return token;
    throw new Error("Basic Auth failed. Check NEMO_USER_ID and NEMO_USER_PASSWORD.");
  }

  // Fallback to basic if auto
  const viaBasic = await tryBasic();
  if (viaBasic) return viaBasic;

  throw new Error("Nemotec Simse header not configured and auto-auth failed. Please provide an Auth Token.");
}

function getStorageBase(svcs: NemoServices, config?: NemoConfig): string {
  const explicit = getEnv('NEMO_STORAGE_BASE_URL', config)?.replace(/\/$/, "");
  if (explicit) return explicit;
  const s = svcs.StorageService?.replace(/\/$/, "");
  if (s && /\/storage$/i.test(s)) return s;
  return `${svcs.DownloadUploadService.replace(/\/$/, "")}/storage`;
}

// Fetch detailed aligner info for a specific document (if available)
export async function getDocumentAlignersInfoV2(
  documentId: string,
  config?: NemoConfig,
  version?: number | null
): Promise<any | null> {
  try {
    if (!documentId) {
      console.log("No documentId provided");
      return null;
    }
    console.log("Fetching aligners for documentId:", documentId);

    const svcs = await getNemoServices(config);
    const simse = await getSimseHeader(svcs, config);
    const storageBase = getStorageBase(svcs, config);

    const body = {
      query: `
        query documentAligners($id: UUID, $version: Int) {
          documentAligners(id: $id, version: $version) {
            id
            setupName
            upperEndIn
            lowerEndIn
            upperStartFrom
            lowerStartFrom
            version
            maxAligners
            manAligners
            attachCount
            bracketCount
            maxIpr
            manIpr
            attachList {
              name
              tooth
              beginTime
              endTime
              attachGuid
            }
            precisionCutList {
              name
              tooth
              beginTime
              endTime
              isMaxTooth
              isButton
              isLingual
            }
            iprList {
              tooth
              step
              mesialIpr
              distalIpr
            }
            extractList {
              tooth
              step
            }
            positionersList {
              upper
              lower
            }
          }
        }
      `,
      variables: {
        id: documentId,
        version: typeof version === "number" ? version : null,
      },
    };

    const res = await fetch(`${storageBase}/graphql`, {
      method: "POST",
      headers: nemoHeaders(simse, {
        "Content-Type": "application/json",
        Accept: "application/json",
      }, config),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Error ${res.status}: ${txt}`);
    }

    const json = await res.json();
    console.log("Response JSON:", json.data);
    
    if (json.errors) {
        throw new Error(json.errors[0].message);
    }

    return json?.data?.documentAligners ?? null;
  } catch (error) {
    console.error("Error in getDocumentAlignersInfoV2:", error);
    throw error;
  }
}