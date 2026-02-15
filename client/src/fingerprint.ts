// builds a fingerprint hash from browser properties so we can identify repeat voters
// not perfect (different browser = different hash) but good enough for this use case
export async function generateFingerprint(): Promise<string> {
  const components: string[] = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "unknown",
    navigator.platform || "unknown",
    ("ontouchstart" in window).toString(),
    getWebGLRenderer(),
  ];

  const raw = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// try to grab GPU renderer string for extra uniqueness
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && gl instanceof WebGLRenderingContext) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "unknown";
      }
    }
  } catch {
    // some browsers block this, just move on
  }
  return "unknown";
}
