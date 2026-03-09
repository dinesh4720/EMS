const VALID_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']
const LOG_LEVEL_ORDER = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
}
const REDACTED_VALUE = '[REDACTED]'
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'apiSecret',
  'jwt',
])

const originalConsole = typeof globalThis !== 'undefined' && globalThis.console
  ? {
      log: globalThis.console.log?.bind(globalThis.console),
      debug: globalThis.console.debug?.bind(globalThis.console),
      info: globalThis.console.info?.bind(globalThis.console),
      warn: globalThis.console.warn?.bind(globalThis.console),
      error: globalThis.console.error?.bind(globalThis.console),
    }
  : {}

let activeLogLevel = resolveLogLevel()
let consoleBridgeInstalled = false

function resolveLogLevel() {
  const configuredLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase()
  if (configuredLevel && VALID_LOG_LEVELS.includes(configuredLevel)) {
    return configuredLevel
  }

  return import.meta.env.DEV ? 'debug' : 'warn'
}

function sanitizeString(value) {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, `$1${REDACTED_VALUE}`)
    .replace(
      /((?:token|access[_-]?token|refresh[_-]?token|authorization|cookie|set-cookie|password)\s*[:=]\s*)([^\s,;]+)/gi,
      `$1${REDACTED_VALUE}`
    )
}

function sanitizeValue(value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return sanitizeString(value)
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
      stack: value.stack ? sanitizeString(value.stack) : undefined,
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen))
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]'
    }

    seen.add(value)

    return Object.entries(value).reduce((result, [key, entryValue]) => {
      result[key] = SENSITIVE_KEYS.has(key)
        ? REDACTED_VALUE
        : sanitizeValue(entryValue, seen)
      return result
    }, {})
  }

  return String(value)
}

function getConsoleMethod(level) {
  if (level === 'trace' || level === 'debug') {
    return originalConsole.debug || originalConsole.log || (() => {})
  }

  return originalConsole[level] || originalConsole.log || (() => {})
}

function shouldLog(level) {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[activeLogLevel]
}

function emit(level, args) {
  if (!shouldLog(level)) {
    return
  }

  getConsoleMethod(level)(...args.map((arg) => sanitizeValue(arg)))
}

export function setLogLevel(level) {
  const normalizedLevel = level?.toLowerCase()
  if (!normalizedLevel || !VALID_LOG_LEVELS.includes(normalizedLevel)) {
    return false
  }

  activeLogLevel = normalizedLevel
  return true
}

export function installConsoleBridge() {
  if (consoleBridgeInstalled || !globalThis.console) {
    return
  }

  consoleBridgeInstalled = true
  globalThis.console.log = (...args) => emit('debug', args)
  globalThis.console.debug = (...args) => emit('debug', args)
  globalThis.console.info = (...args) => emit('info', args)
  globalThis.console.warn = (...args) => emit('warn', args)
  globalThis.console.error = (...args) => emit('error', args)
}

const logger = {
  trace: (...args) => emit('trace', args),
  debug: (...args) => emit('debug', args),
  info: (...args) => emit('info', args),
  warn: (...args) => emit('warn', args),
  error: (...args) => emit('error', args),
  log: (...args) => emit('info', args),
}

export default logger
