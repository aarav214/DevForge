import * as https from "https";
import * as http from "http";
import * as url from "url";

export function fetchUrl(targetUrl: string, options: { headers?: any; timeoutMs?: number } = {}): Promise<string> {
  const timeout = options.timeoutMs || 8000;
  const headers = {
    "User-Agent": "DevForge-VSCode-Extension/1.0.0 (aarav214/DevForge)",
    Accept: "application/json, text/html, */*",
    ...(options.headers || {})
  };

  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.path,
      method: "GET",
      headers,
      timeout
    };

    const req = protocol.request(requestOptions, (res) => {
      // Handle redirects (status code 3xx)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = url.resolve(targetUrl, res.headers.location);
        fetchUrl(redirectUrl, options).then(resolve, reject);
        return;
      }

      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`Request failed with status code ${res.statusCode} for URL: ${targetUrl}`));
        return;
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out for URL: ${targetUrl}`));
    });

    req.end();
  });
}

export async function fetchJson<T = any>(targetUrl: string, options: { headers?: any; timeoutMs?: number } = {}): Promise<T> {
  const text = await fetchUrl(targetUrl, options);
  return JSON.parse(text) as T;
}
