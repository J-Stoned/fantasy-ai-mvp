import { DashboardNav } from "@/components/navigation/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNav />
      <main>{children}</main>
    </>
  );
}