import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Loader2, Boxes, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ManagedGroupCard, MemberGroupCard } from "@/components/orbit/GroupCard";
import { fetchMyGroups } from "@/lib/orbit-api";

export const Route = createFileRoute("/app/groups/")({
  component: GroupsPage,
});

function EmptyGroups() {
  return (
    <Card className="glass col-span-full grid place-items-center rounded-3xl border border-dashed border-border py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Boxes className="h-7 w-7" />
      </div>
      <p className="mt-3 font-display text-lg font-bold">No groups yet</p>
      <p className="text-sm text-muted-foreground">Create your first shared plan to get started.</p>
      <Button asChild variant="cyan" className="mt-4 rounded-xl">
        <Link to="/app/create">
          <Plus className="h-4 w-4" /> Create Group
        </Link>
      </Button>
    </Card>
  );
}

function GroupsPage() {
  const [tab, setTab] = useState("all");
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchMyGroups,
  });

  const managed = groups.filter((g) => g.myRole === "owner" || g.myRole === "co_manager");
  const joined = groups.filter((g) => g.myRole === "member");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My Groups</h1>
          <p className="mt-1 text-muted-foreground">{groups.length} groups across your orbit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-xl">
            <Link to="/app/join">
              <Ticket className="h-4 w-4" /> Join with code
            </Link>
          </Button>
          <Button asChild variant="hero" className="rounded-xl">
            <Link to="/app/create">
              <Plus className="h-4 w-4" /> Create Group
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-xl bg-secondary/50">
            <TabsTrigger value="all" className="rounded-lg">
              All
            </TabsTrigger>
            <TabsTrigger value="managed" className="rounded-lg">
              Managed
            </TabsTrigger>
            <TabsTrigger value="joined" className="rounded-lg">
              Joined
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.length === 0 && <EmptyGroups />}
            {managed.map((g) => (
              <ManagedGroupCard key={g.id} group={g} />
            ))}
            {joined.map((g) => (
              <MemberGroupCard key={g.id} group={g} />
            ))}
          </TabsContent>
          <TabsContent value="managed" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managed.length === 0 && <EmptyGroups />}
            {managed.map((g) => (
              <ManagedGroupCard key={g.id} group={g} />
            ))}
          </TabsContent>
          <TabsContent value="joined" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.length === 0 && <EmptyGroups />}
            {joined.map((g) => (
              <MemberGroupCard key={g.id} group={g} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
