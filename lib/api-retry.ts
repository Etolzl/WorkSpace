// Utilidad para manejar reintentos con backoff exponencial para errores 429

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  retryableStatuses: [429, 503, 504] // Errores que pueden beneficiarse de retry
};

/**
 * Calcula el delay para el siguiente intento usando backoff exponencial
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Espera un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ejecuta una función con reintentos automáticos en caso de errores 429 u otros errores retryables
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar si el error es retryable
      const isRetryable = 
        error?.status && opts.retryableStatuses.includes(error.status) ||
        error?.response?.status && opts.retryableStatuses.includes(error.response.status) ||
        (error?.message && error.message.includes('429'));

      // Si no es retryable o es el último intento, lanzar el error
      if (!isRetryable || attempt === opts.maxRetries) {
        throw lastError;
      }

      // Calcular delay y esperar antes del siguiente intento
      const delay = calculateDelay(attempt, opts);
      console.warn(`⚠️ Error ${error?.status || 'desconocido'} en intento ${attempt + 1}/${opts.maxRetries + 1}. Reintentando en ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Error desconocido en withRetry');
}

/**
 * Wrapper para fetch que maneja errores 429 con retry automático
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(input, init);
    
    // Si es un error 429, lanzar un error para que se reintente
    if (response.status === 429) {
      const error: any = new Error(`Too Many Requests (429)`);
      error.status = 429;
      error.response = response;
      throw error;
    }
    
    return response;
  }, options);
}

