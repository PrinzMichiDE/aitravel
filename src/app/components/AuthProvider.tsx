// src/app/components/AuthProvider.tsx
'use client';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}