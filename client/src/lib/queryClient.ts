import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Função para fazer requisições à API com tipagem
 * @param url URL da requisição
 * @param options Opções da requisição (method, data, etc.)
 * @returns Resposta convertida para o tipo T
 */
export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const method = options?.method || "GET";
  const customHeaders = options?.headers || {};

  // Adicionar console.log para debug
  console.log(`Realizando requisição ${method} para ${url}`);

  const res = await fetch(url, {
    method,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...customHeaders
    },
    body: options?.body,
    credentials: "include", // Importante: inclui cookies de autenticação
  });

  // Log para debug
  console.log(`Resposta da requisição ${method} para ${url}: ${res.status}`);

  await throwIfResNotOk(res);
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Log para debug
    console.log(`QueryClient fazendo requisição para: ${queryKey[0]}`);
    
    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers: {},
      credentials: "include", // Importante: inclui cookies de autenticação
    });

    // Log para debug
    console.log(`Resposta da requisição para ${queryKey[0]}: ${res.status}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Retornando null para requisição não autenticada: ${queryKey[0]}`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
