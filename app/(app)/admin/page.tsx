"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type User = {
  id: string;
  username: string;
  name: string;
  email?: string;
  memberships: Array<{
    role: string;
    workspace: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
};

type Workspace = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Fetch existing users and workspaces
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        if (data.workspaces?.length > 0) {
          setWorkspaceId(data.workspaces[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  }, []);

  // Check authentication and admin status
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const res = await fetch("/api/admin/workspaces");
        if (res.ok) {
          setIsAdmin(true);
          fetchUsers();
          fetchWorkspaces();
        } else {
          // Not admin, redirect to dashboard
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [session, status, router, fetchUsers, fetchWorkspaces]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, 
          name, 
          email, 
          password, 
          workspaceId, 
          role 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`User created successfully: ${data.user.username}`);
        setUsername("");
        setName("");
        setEmail("");
        setPassword("");
        setRole("member");
        fetchUsers(); // Refresh user list
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("User deleted successfully");
        fetchUsers(); // Refresh user list
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to delete user");
    }
  }

  // Show loading while checking auth
  if (status === "loading" || !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "create"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Create User
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Manage Users
          </button>
        </nav>
      </div>

      {/* Create User Tab */}
      {activeTab === "create" && (
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Create New User</h2>
          
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Full Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
                minLength={6}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Workspace</label>
                <select
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded bg-zinc-900 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 disabled:opacity-50 font-medium"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      )}

      {/* Manage Users Tab */}
      {activeTab === "manage" && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Manage Users</h2>
          
          <div className="overflow-auto border border-zinc-800 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900/60 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Workspace</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-zinc-400 text-xs">@{user.username}</div>
                        {user.email && <div className="text-zinc-400 text-xs">{user.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.memberships.map((m, i) => (
                        <div key={i} className="text-zinc-300">
                          {m.workspace.name}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {user.memberships.map((m, i) => (
                        <span
                          key={i}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            m.role === "admin"
                              ? "bg-red-900/20 text-red-300 border border-red-700/40"
                              : "bg-zinc-900/20 text-zinc-300 border border-zinc-700/40"
                          }`}
                        >
                          {m.role}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 underline text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-4 rounded ${
          message.includes("Error") 
            ? "bg-red-900/20 text-red-300 border border-red-700/40" 
            : "bg-emerald-900/20 text-emerald-300 border border-emerald-700/40"
        }`}>
          {message}
        </div>
      )}

      {/* Security Notes */}
      <div className="mt-8 p-6 bg-zinc-900/40 rounded border border-zinc-800">
        <h2 className="font-semibold mb-3 text-zinc-200">Security Notes:</h2>
        <ul className="text-sm space-y-2 text-zinc-400">
          <li>• Only admin users can access this panel</li>
          <li>• New users are automatically added to the selected workspace</li>
          <li>• Passwords are securely hashed with bcrypt</li>
          <li>• No public signup is available</li>
          <li>• Admin users can manage all users in their workspace</li>
        </ul>
      </div>
    </div>
  );
}
