import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      <Sidebar />
      <Navbar />
      <main
        className="px-8 py-6"
        style={{
          marginLeft: "var(--sidebar-width)",
          marginTop: "var(--header-height)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
