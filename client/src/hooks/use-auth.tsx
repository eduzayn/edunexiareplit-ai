import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { toast } from "@/hooks/use-toast";

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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Garantir que o portalType esteja presente na requisição
      const data = { ...credentials };
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo(a) de volta, ${user.fullName}!`,
      });

      // Redirect to the appropriate dashboard
      if (user.portalType) {
        window.location.href = `/${user.portalType}/dashboard`;
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
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });

      // Redirect to the appropriate dashboard
      if (user.portalType) {
        window.location.href = `/${user.portalType}/dashboard`;
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
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/";
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
