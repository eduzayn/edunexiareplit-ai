import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getNavigationPath } from "../lib/url-utils";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

// Cria um contexto de autenticação com valores padrão para evitar o erro de null
const defaultLoginMutation = {
  mutate: () => {},
  mutateAsync: async () => ({} as SelectUser),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultLogoutMutation = {
  mutate: () => {},
  mutateAsync: async () => {},
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultRegisterMutation = {
  mutate: () => {},
  mutateAsync: async () => ({} as SelectUser),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: defaultLoginMutation as unknown as UseMutationResult<SelectUser, Error, LoginData>,
  logoutMutation: defaultLogoutMutation as unknown as UseMutationResult<void, Error, void>,
  registerMutation: defaultRegisterMutation as unknown as UseMutationResult<SelectUser, Error, InsertUser>,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [, setLocation] = useLocation();
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Garantir que o portalType esteja presente na requisição
      const data = { ...credentials };
      console.log("Tentando login como " + credentials.username + " com portalType:", data.portalType);
      console.log("Enviando requisição de login com portalType:", data.portalType);
      return apiRequest<SelectUser>("/api/login", { method: 'POST', data });
    },
    onSuccess: (user: SelectUser) => {
      // Atualizar o cache do usuário com os dados mais recentes
      queryClient.setQueryData(["/api/user"], user);
      
      // Forçar uma invalidação do cache para garantir que temos os dados mais recentes
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Adicionar logs para debug
      console.log("Login bem-sucedido. Dados do usuário:", user);
      console.log("Portal type:", user.portalType);
      console.log("Redirecionando para:", getNavigationPath(`/${user.portalType}/dashboard`));
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo(a) de volta, ${user.fullName}!`,
      });

      // Verificar se o portal do usuário corresponde ao tipo de portal solicitado
      if (user.portalType) {
        console.log("Login bem-sucedido, redirecionando para dashboard " + user.portalType);
        // Redirect to the appropriate dashboard
        setLocation(getNavigationPath(`/${user.portalType}/dashboard`));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      return apiRequest<SelectUser>("/api/register", { method: 'POST', data: credentials });
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });

      // Redirect to the appropriate dashboard usando setLocation
      if (user.portalType) {
        setLocation(getNavigationPath(`/${user.portalType}/dashboard`));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest<{}>("/api/logout", { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation(getNavigationPath("/"));
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}