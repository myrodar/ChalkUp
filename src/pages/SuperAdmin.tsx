import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkIsSuperAdmin,
  setAdminStatus,
  setSuperAdminStatus,
  fetchCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCurrentCompetition
} from '@/lib/database';
import {
  RefreshCw, Search, User as UserIcon, PlusCircle, Edit, Trash2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Competition } from '@/types';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  university: string | null;
  isAdmin: boolean | null;
  isSuperAdmin: boolean | null;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  university: string | null;
  isAdmin: boolean | null;
  isSuperAdmin: boolean | null;
}

export default function SuperAdmin() {
  const { session, loading, currentCompetitionId, setCurrentCompetitionId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'superadmin'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const tabFromUrl = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'competitions' ? 'competitions' : 'users');
  const [newCompetitionName, setNewCompetitionName] = useState('');
  const [newCompetitionLocation, setNewCompetitionLocation] = useState('');
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [editCompetition, setEditCompetition] = useState<Competition | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
      return;
    }
    if (session?.user?.id) {
      console.log('Checking if user is super admin:', session.user.id);
      checkIsSuperAdmin(session.user.id).then(result => {
        console.log('Super admin check result:', result);
        setIsSuperAdmin(result);
        if (!result) {
          console.log('User is not a super admin, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          console.log('User is a super admin, staying on page');
        }
      }).catch(error => {
        console.error('Error checking super admin status:', error);
      });
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    const newUrl = `${location.pathname}?tab=${activeTab}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, location.pathname]);

  // Add keyboard shortcut to focus search input (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (activeTab === 'users' && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const { data: competitions = [], refetch: refetchCompetitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: fetchCompetitions,
    enabled: !!session?.user?.id && isSuperAdmin
  });

  // Query for current competition details
  const { data: currentCompetitionDetails } = useQuery({
    queryKey: ['currentCompetition', currentCompetitionId],
    queryFn: async () => {
      if (!currentCompetitionId) return null;
      const found = competitions.find(c => c.id === currentCompetitionId);
      return found || await getCurrentCompetition(currentCompetitionId);
    },
    enabled: !!session?.user?.id && isSuperAdmin && !!currentCompetitionId
  });

  // Query for users
  console.log('Setting up users query, session:', !!session?.user?.id, 'isSuperAdmin:', isSuperAdmin);
  const { data: users = [], refetch: refetchUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Executing users query function');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, university, "isAdmin", "isSuperAdmin"');

        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }

        console.log('Fetched profiles:', data?.length || 0, 'records');
        if (data?.length > 0) {
          console.log('First profile:', data[0]);
        }

        // Map database column names to our interface names
        return data.map((user: UserData) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          university: user.university,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin
        })) as UserProfile[];
      } catch (error) {
        console.error('Error in users query:', error);
        throw error;
      }
    },
    enabled: !!session?.user?.id
  });

  const updateAdminStatusMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => setAdminStatus(userId, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Admin status updated' });
    },
    onError: (error) => toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
  });

  const updateSuperAdminStatusMutation = useMutation({
    mutationFn: ({ userId, isSuperAdmin }: { userId: string, isSuperAdmin: boolean }) => setSuperAdminStatus(userId, isSuperAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Super admin status updated' });
    },
    onError: (error) => toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
  });

  const createCompetitionMutation = useMutation({
    mutationFn: (comp: Omit<Competition, 'id' | 'created_at'>) => createCompetition(comp),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setNewCompetitionName('');
      setNewCompetitionLocation('');
      setIsCreatingCompetition(false);
      setCurrentCompetitionId(data.id);
      localStorage.setItem('currentCompetitionId', data.id.toString());
      toast({ title: 'Competition created' });
    },
    onError: (error) => toast({ title: 'Error creating competition', description: error.message, variant: 'destructive' })
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Competition> }) => updateCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['currentCompetition', currentCompetitionId] });
      setEditCompetition(null);
      toast({ title: 'Competition updated' });
    },
    onError: (error) => toast({ title: 'Error updating competition', description: error.message, variant: 'destructive' })
  });

  const deleteCompetitionMutation = useMutation({
    mutationFn: (id: number) => deleteCompetition(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      if (currentCompetitionId === id) {
        const rest = competitions.filter(c => c.id !== id);
        const newId = rest.length > 0 ? rest[0].id : null;
        setCurrentCompetitionId(newId);
        localStorage.setItem('currentCompetitionId', newId?.toString() || '');
      }
      toast({ title: 'Competition deleted' });
    },
    onError: (error) => toast({ title: 'Error deleting competition', description: error.message, variant: 'destructive' })
  });

  const handleAdminToggle = (id: string, current: boolean | null) => {
    updateAdminStatusMutation.mutate({ userId: id, isAdmin: !(current === true) });
  };

  const handleSuperAdminToggle = (id: string, current: boolean | null) => {
    updateSuperAdminStatusMutation.mutate({ userId: id, isSuperAdmin: !(current === true) });
  };

  const handleCompetitionChange = (id: number) => {
    if (id !== currentCompetitionId && window.confirm('Change active competition?')) {
      setCurrentCompetitionId(id);
      localStorage.setItem('currentCompetitionId', id.toString());
      queryClient.invalidateQueries({ queryKey: ['currentCompetition'] });
      queryClient.invalidateQueries({ queryKey: ['boulders'] });
      toast({ title: 'Competition changed' });
    }
  };

  const handleCreateCompetition = () => {
    if (!newCompetitionName.trim()) {
      toast({ title: 'Missing name', variant: 'destructive' });
      return;
    }
    createCompetitionMutation.mutate({
      name: newCompetitionName,
      location: newCompetitionLocation || 'Unknown Location',
      isLeaderboardPublic: false
    });
  };

  const handleUpdateCompetition = () => {
    if (!editCompetition?.name.trim()) {
      toast({ title: 'Missing name', variant: 'destructive' });
      return;
    }
    updateCompetitionMutation.mutate({
      id: editCompetition.id,
      data: {
        name: editCompetition.name,
        location: editCompetition.location || 'Unknown Location'
      }
    });
  };

  const handleDeleteCompetition = (id: number) => {
    if (window.confirm('Delete competition and all related data?')) {
      deleteCompetitionMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter(user => {
    // Apply search term filter
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (user.name?.toLowerCase().includes(search)) ||
      (user.email?.toLowerCase().includes(search)) ||
      (user.university?.toLowerCase().includes(search))
    );

    // Apply role filter
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && user.isAdmin === true) ||
      (roleFilter === 'superadmin' && user.isSuperAdmin === true);

    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  if (!isSuperAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Unauthorized</h1>
        <p>You need to be a super admin to access this page.</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          <Button
            variant="outline"
            onClick={() => {
              if (session?.user?.id) {
                console.log('Manually checking super admin status');
                checkIsSuperAdmin(session.user.id).then(result => {
                  console.log('Manual super admin check result:', result);
                  setIsSuperAdmin(result);
                });
              }
            }}
          >
            Check Access Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Navbar
        isLoggedIn={!!session}
        isAdmin
        isSuperAdmin
        userName={session?.user?.user_metadata?.name || 'Admin'}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <Button size="sm" variant="outline" onClick={() => {
                  console.log('Manually refreshing users');
                  refetchUsers();
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search input with clear button */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <div className="relative w-full">
                      <Input
                        ref={searchInputRef}
                        placeholder="Search by name, email, or university..."
                        className="pl-8 pr-24"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchTerm('');
                          }
                        }}
                      />
                      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </div>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-12 sm:right-16 top-0 h-full px-2 py-2"
                        onClick={() => setSearchTerm('')}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  {/* Role filter */}
                  <div className="flex gap-2">
                    <Button
                      variant={roleFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('all')}
                      className="flex-1 md:flex-none"
                    >
                      All Users
                    </Button>
                    <Button
                      variant={roleFilter === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('admin')}
                      className="flex-1 md:flex-none"
                    >
                      Admins
                    </Button>
                    <Button
                      variant={roleFilter === 'superadmin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('superadmin')}
                      className="flex-1 md:flex-none"
                    >
                      Super Admins
                    </Button>
                  </div>
                </div>

                {/* Results count */}
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {isLoadingUsers ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Loading users...</span>
                    </>
                  ) : (
                    <>
                      Showing {filteredUsers.length} of {users.length} users
                      {searchTerm && <span> matching "{searchTerm}"</span>}
                      {roleFilter !== 'all' && <span> with {roleFilter} role</span>}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Super Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Loading users...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          {searchTerm ? 'No users found matching your search' : 'No users found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              {user.name || 'Unnamed User'}
                            </div>
                          </TableCell>
                          <TableCell>{user.email || 'No email'}</TableCell>
                          <TableCell>{user.university || 'Not specified'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={user.isAdmin === true}
                                onCheckedChange={() => handleAdminToggle(user.id, user.isAdmin)}
                                disabled={updateAdminStatusMutation.isPending}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={user.isSuperAdmin === true}
                                onCheckedChange={() => handleSuperAdminToggle(user.id, user.isSuperAdmin)}
                                disabled={updateSuperAdminStatusMutation.isPending}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="competitions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Competition Management</CardTitle>
                <Button size="sm" variant="outline" onClick={() => refetchCompetitions()}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Active Competition</h3>
                    {currentCompetitionDetails && (
                      <p className="text-sm text-muted-foreground">
                        Currently active: <span className="font-medium">{currentCompetitionDetails.name}</span>
                      </p>
                    )}
                  </div>
                  <Dialog open={isCreatingCompetition} onOpenChange={setIsCreatingCompetition}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" /> New Competition
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Competition</DialogTitle>
                        <DialogDescription>
                          Add details for the new climbing competition
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="competition-name">Competition Name</Label>
                          <Input
                            id="competition-name"
                            placeholder="Enter competition name"
                            value={newCompetitionName}
                            onChange={(e) => setNewCompetitionName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="competition-location">Location</Label>
                          <Input
                            id="competition-location"
                            placeholder="Enter competition location"
                            value={newCompetitionLocation}
                            onChange={(e) => setNewCompetitionLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreatingCompetition(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateCompetition}
                          disabled={createCompetitionMutation.isPending}
                        >
                          {createCompetitionMutation.isPending ? 'Creating...' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {competitions.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">No competitions found. Create your first competition!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competitions.map(comp => (
                      <Card
                        key={comp.id}
                        className={`cursor-pointer transition-all ${
                          currentCompetitionId === comp.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleCompetitionChange(comp.id)}
                      >
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{comp.name}</h4>
                              {currentCompetitionId === comp.id && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{comp.location}</p>
                            <p className="text-xs text-muted-foreground mt-1">ID: {comp.id}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCompetition(comp);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompetition(comp.id);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={!!editCompetition}
            onOpenChange={(open) => !open && setEditCompetition(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Competition</DialogTitle>
                <DialogDescription>
                  Update the competition details
                </DialogDescription>
              </DialogHeader>
              {editCompetition && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-competition-name">Competition Name</Label>
                    <Input
                      id="edit-competition-name"
                      placeholder="Enter competition name"
                      value={editCompetition.name}
                      onChange={(e) => setEditCompetition({
                        ...editCompetition,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-competition-location">Location</Label>
                    <Input
                      id="edit-competition-location"
                      placeholder="Enter competition location"
                      value={editCompetition.location || ''}
                      onChange={(e) => setEditCompetition({
                        ...editCompetition,
                        location: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => editCompetition && handleDeleteCompetition(editCompetition.id)}
                  disabled={updateCompetitionMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditCompetition(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCompetition}
                    disabled={updateCompetitionMutation.isPending}
                  >
                    {updateCompetitionMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
