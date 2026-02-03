import { useState, useEffect } from "react";
import { Users, Shield, UserPlus, Search, MoreHorizontal, UserCog, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import RoleAuditLog from "@/components/dashboard/RoleAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string;
  role: "student" | "parent" | "health_officer" | "admin";
  created_at: string;
}

type AssignableRole = "student" | "parent" | "health_officer" | "admin";

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<"health_officer" | "admin">("health_officer");
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog state for inline role change
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AssignableRole>("student");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "student",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error loading users",
        description: "Could not fetch user list. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!assignEmail.trim() || !user) return;

    setIsAssigning(true);
    try {
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", assignEmail.trim())
        .maybeSingle();

      if (profileError || !targetProfile) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Prevent self-demotion
      if (targetProfile.user_id === user.id) {
        toast({
          title: "Cannot modify own role",
          description: "You cannot change your own role. Ask another admin.",
          variant: "destructive",
        });
        return;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", targetProfile.user_id)
        .eq("role", assignRole)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Role already assigned",
          description: `This user already has the ${assignRole.replace("_", " ")} role.`,
          variant: "destructive",
        });
        return;
      }

      // Get previous role if exists
      const { data: existingUserRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetProfile.user_id)
        .maybeSingle();

      const previousRole = existingUserRole?.role || null;

      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetProfile.user_id);

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: targetProfile.user_id,
          role: assignRole,
          assigned_by: user.id,
        });

      if (insertError) throw insertError;

      // Log the role assignment - we'll add this function soon
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("role_audit_logs").insert({
        user_id: targetProfile.user_id,
        user_email: assignEmail.trim(),
        previous_role: previousRole,
        new_role: assignRole,
        changed_by: user.id,
        changed_by_email: adminProfile?.email || "Unknown",
        action: previousRole ? "change" : "assign",
      });

      toast({
        title: "Role assigned successfully!",
        description: `User has been assigned the ${assignRole.replace("_", " ")} role.`,
      });

      setAssignEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const openChangeRoleDialog = (userItem: UserWithRole) => {
    setSelectedUser(userItem);
    setNewRole(userItem.role);
    setIsDialogOpen(true);
  };

  const logRoleChange = async (
    targetUserId: string,
    targetEmail: string,
    previousRole: string | null,
    newRole: string,
    action: "assign" | "change" | "remove"
  ) => {
    if (!user) return;
    
    try {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("role_audit_logs").insert({
        user_id: targetUserId,
        user_email: targetEmail,
        previous_role: previousRole,
        new_role: newRole,
        changed_by: user.id,
        changed_by_email: adminProfile?.email || "Unknown",
        action,
      });
    } catch (error) {
      console.error("Error logging role change:", error);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !user || newRole === selectedUser.role) {
      setIsDialogOpen(false);
      return;
    }

    // Prevent self-demotion
    if (selectedUser.user_id === user.id) {
      toast({
        title: "Cannot modify own role",
        description: "You cannot change your own role. Ask another admin.",
        variant: "destructive",
      });
      setIsDialogOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const previousRole = selectedUser.role;
      
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      // Insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.user_id,
          role: newRole,
          assigned_by: user.id,
        });

      if (insertError) throw insertError;

      // Log the role change
      await logRoleChange(
        selectedUser.user_id,
        selectedUser.email,
        previousRole,
        newRole,
        "change"
      );

      toast({
        title: "Role updated!",
        description: `${selectedUser.full_name || selectedUser.email} is now a ${newRole.replace("_", " ")}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "Failed to change role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleRemoveRole = async (userItem: UserWithRole) => {
    if (!user) return;

    try {
      const previousRole = userItem.role;
      
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userItem.user_id);

      if (error) throw error;

      // Log the role removal
      await logRoleChange(
        userItem.user_id,
        userItem.email,
        previousRole,
        "student",
        "remove"
      );

      toast({
        title: "Role removed",
        description: `${userItem.full_name || userItem.email} has been demoted to student.`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive/10 text-destructive";
      case "health_officer": return "bg-primary/10 text-primary";
      case "parent": return "bg-warning/10 text-warning";
      default: return "bg-success/10 text-success";
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout userRole="admin">
      <DashboardHeader 
        title="User Management"
        subtitle="Assign roles to users and manage accounts"
      />
      
      <div className="p-6 space-y-6">
        {/* Assign Role Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Assign Role by Email</h3>
              <p className="text-sm text-muted-foreground">Promote users to Health Officer or Admin</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@school.edu"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={assignRole} onValueChange={(v) => setAssignRole(v as "health_officer" | "admin")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health_officer">Health Officer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAssignRole} 
                disabled={!assignEmail.trim() || isAssigning}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isAssigning ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">All Users</h3>
                <p className="text-sm text-muted-foreground">{users.length} total users</p>
              </div>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userItem) => (
                    <TableRow key={userItem.user_id}>
                      <TableCell className="font-medium">{userItem.full_name || "—"}</TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(userItem.role)}`}>
                          {userItem.role.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(userItem.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openChangeRoleDialog(userItem)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            {userItem.role !== "student" && userItem.user_id !== user?.id && (
                              <DropdownMenuItem 
                                onClick={() => handleRemoveRole(userItem)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Role
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Role Audit Log */}
        <RoleAuditLog />
      </div>

      {/* Change Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleBadgeColor(selectedUser?.role || "student")}`}>
                {selectedUser?.role.replace("_", " ")}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AssignableRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="health_officer">Health Officer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangeRole} 
              disabled={isUpdating || newRole === selectedUser?.role}
            >
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserManagement;