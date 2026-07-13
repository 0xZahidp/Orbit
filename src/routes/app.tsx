import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar, MobileNav } from "@/components/orbit/AppSidebar";
import { TopBar } from "@/components/orbit/TopBar";
import { AmbientBackground } from "@/components/orbit/AmbientBackground";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  // Session lives in localStorage (client-only), so gate on the client.
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth/sign-in" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="relative flex min-h-screen">
      <AmbientBackground />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
