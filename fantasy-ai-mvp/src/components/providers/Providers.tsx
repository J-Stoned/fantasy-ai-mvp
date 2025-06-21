"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
          retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors except 408, 429
            if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error.status)) {
              return false;
            }
            return failureCount < 3;
          },
        },
        mutations: {
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          
          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#f1f5f9',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#0f172a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#0f172a',
                },
              },
            }}
          />
          
          {/* React Query DevTools (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              buttonPosition="bottom-left"
            />
          )}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}