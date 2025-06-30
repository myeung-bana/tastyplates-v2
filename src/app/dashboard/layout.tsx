import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import "../../styles/global.scss"; // Import global styles
import "@/styles/layout/_dashboard.scss";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <DashboardSidebar />
      <main className="dashboard__main">
        <div className="dashboard__content">{children}</div>
      </main>
    </div>
  );
}
