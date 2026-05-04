import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { print } from "./print"

const serializeHeaders = (headers: unknown): Record<string, unknown> => {
  try {
    if (headers == null) return {}
    const h = headers as {
      toJSON?: () => Record<string, unknown>
      forEach?: (cb: (value: string, key: string) => void) => void
    }
    if (typeof h.toJSON === "function") {
      return h.toJSON()
    }
    if (typeof h.forEach === "function") {
      const out: Record<string, unknown> = {}
      h.forEach((value, key) => {
        out[key] = value
      })
      return out
    }
    if (typeof headers === "object" && !Array.isArray(headers)) {
      return { ...(headers as Record<string, unknown>) }
    }
    return { raw: String(headers) }
  } catch (err) {
    return { _errorSerializandoCabeceras: String(err) }
  }
}

export const logHttpRequest = (clientLabel: string, config: InternalAxiosRequestConfig) => {
  try {
    const method = (config.method ?? "get").toUpperCase()
    const base = config.baseURL ?? ""
    const path = config.url ?? ""
    const fullUrl = `${base}${path}`

    print(`%c[HTTP →]%c ${clientLabel} %c${method}%c ${fullUrl}`, "font-weight:bold;color:#06c;", "", "font-weight:bold;", "")
    print("  Headers:", serializeHeaders(config.headers))
    print("  Query params:", config.params ?? null)
    print("  Body:", config.data ?? null)
  } catch (err) {
    print("[HTTP →] Error al registrar la petición:", err)
  }
}

export const logHttpResponseOk = (clientLabel: string, response: AxiosResponse) => {
  try {
    const method = (response.config.method ?? "get").toUpperCase()
    const base = response.config.baseURL ?? ""
    const path = response.config.url ?? ""
    const fullUrl = `${base}${path}`

    print(`%c[HTTP ← OK]%c ${clientLabel} %c${response.status}%c ${method} ${fullUrl}`, "font-weight:bold;color:#080;", "", "font-weight:bold;", "")
    print("  Status:", response.status, response.statusText)
    print("  Headers respuesta:", serializeHeaders(response.headers))
    print("  Datos respuesta:", response.data)
  } catch (err) {
    print("[HTTP ← OK] Error al registrar la respuesta:", err)
  }
}

export const logHttpResponseError = (clientLabel: string, error: AxiosError) => {
  try {
    const cfg = error.config
    const method = (cfg?.method ?? "?").toUpperCase()
    const fullUrl = cfg ? `${cfg.baseURL ?? ""}${cfg.url ?? ""}` : "(sin URL)"

    print(`%c[HTTP ← ERROR]%c ${clientLabel} %c${error.response?.status ?? "—"}%c ${method} ${fullUrl}`, "font-weight:bold;color:#c00;", "", "font-weight:bold;", "")
    if (cfg) {
      print("  Petición — Headers:", serializeHeaders(cfg.headers))
      print("  Petición — Query:", cfg.params ?? null)
      print("  Petición — Body:", cfg.data ?? null)
    }
    if (error.response) {
      print("  Respuesta — Status:", error.response.status, error.response.statusText)
      print("  Respuesta — Headers:", serializeHeaders(error.response.headers))
      print("  Respuesta — Body:", error.response.data)
    } else {
      print("  Sin respuesta del servidor:", error.message)
    }
  } catch (err) {
    print("[HTTP ← ERROR] Error al registrar el fallo:", err)
  }
}
