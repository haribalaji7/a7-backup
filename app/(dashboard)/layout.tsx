"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();

//   useEffect(() => {
//     const isAuth = localStorage.getItem("isAuthenticated");
//     if (!isAuth) {
//       router.push("/login");
//     }
//   }, [router]);

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        <AuthCheck>{children}</AuthCheck>
      </main>
    </>
  );
}
