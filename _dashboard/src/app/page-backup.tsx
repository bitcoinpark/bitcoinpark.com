import { TaskBoard } from "@/components/TaskBoard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto">
        <header className="bg-white shadow-sm mb-6 p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Mission Control Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Task management for humans and AI agents
          </p>
        </header>
        <TaskBoard />
      </div>
    </main>
  );
}
