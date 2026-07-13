import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";
import { AmbientBackground } from "@/components/orbit/AmbientBackground";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <AmbientBackground />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <OrbitLogo />
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
