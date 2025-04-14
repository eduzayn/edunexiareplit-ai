/**
 * Utilitários para gerenciar URLs no projeto, garantindo que não haja barras duplicadas
 */

/**
 * Normaliza um caminho de URL para garantir que não haja barras duplicadas
 * @param path O caminho a ser normalizado
 * @returns O caminho normalizado
 */
export function normalizePath(path: string): string {
  // Remover barras duplicadas consecutivas no meio do caminho
  return path.replace(/\/{2,}/g, '/');
}

/**
 * Cria uma URL completa normalizada
 * @param basePath A base da URL (ex: window.location.origin)
 * @param path O caminho a ser adicionado à base
 * @returns A URL completa normalizada
 */
export function createUrl(basePath: string, path: string): string {
  // Garantir que a base termina com uma barra e o caminho não começa com uma barra
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * Wrapper para useLocation que garante URLs normalizadas
 * @param location A localização atual
 * @param path O caminho para navegar
 * @returns O caminho normalizado
 */
export function getNavigationPath(path: string): string {
  return normalizePath(path);
}