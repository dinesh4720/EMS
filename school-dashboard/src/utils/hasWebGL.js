/**
 * hasWebGL — runtime detection used by auth pages to decide whether to load
 * the 3D SchoolBuilding visual. Three.js shader compilation can crash in
 * headless or software-rendered browsers even when a WebGL context is created,
 * so we skip the import in those environments to keep auth pages crash-free.
 */
const hasWebGL = (() => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  try {
    if (
      navigator.webdriver ||
      /HeadlessChrome|Headless|Puppeteer|Playwright|PhantomJS|Chrome-Lighthouse/i.test(
        navigator.userAgent
      ) ||
      (!navigator.gpu && !window.chrome?.runtime)
    )
      return false;
    if (window.self !== window.top) return false;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return false;
    gl.shaderSource(vs, "void main(){ gl_Position = vec4(0.0); }");
    gl.compileShader(vs);
    const ok = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
    gl.deleteShader(vs);

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      if (/SwiftShader|llvmpipe|Software|ANGLE.*Direct3D9/i.test(renderer)) return false;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return false;
    gl.shaderSource(
      fs,
      "precision mediump float; void main(){ gl_FragColor = vec4(1.0); }"
    );
    gl.compileShader(fs);
    const fsOk = gl.getShaderParameter(fs, gl.COMPILE_STATUS);
    gl.deleteShader(fs);

    return ok && fsOk;
  } catch {
    return false;
  }
})();

export default hasWebGL;
