
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from '@/components/Navbar';
import AdminBoulderForm from '@/components/AdminBoulderForm';
import { Boulder, Competition } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { RefreshCw, Eye, EyeOff, PlusCircle, Trash2, Edit, PlusSquare, Pencil, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBoulders,
  getCurrentCompetition,
  fetchCompetitions,
  updateCompetitionVisibility,
  createBoulder,
  updateBoulder,
  deleteBoulder,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  checkIsSuperAdmin
} from '@/lib/database';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const { session, loading, currentCompetitionId, setCurrentCompetitionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newCompetitionName, setNewCompetitionName] = useState('');
  const [newCompetitionLocation, setNewCompetitionLocation] = useState('');
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [editCompetition, setEditCompetition] = useState<Competition | null>(null);
  const [editingBoulder, setEditingBoulder] = useState<Boulder | null>(null);

  // Check if user is logged in and is admin
  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
      return;
    }

    // First check metadata for backward compatibility
    const isAdminInMetadata = session?.user?.user_metadata?.isAdmin === true;

    if (!loading && session && !isAdminInMetadata) {
      // If not in metadata, check in database
      const checkAdminStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('isAdmin')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          const isAdminInDb = data?.isAdmin === true;

          if (!isAdminInDb) {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          navigate('/dashboard');
        }
      };

      checkAdminStatus();
    }

    // Check if user is super admin
    if (session?.user?.id) {
      checkIsSuperAdmin(session.user.id).then(result => {
        setIsSuperAdmin(result);
      });
    }
  }, [session, loading, navigate]);

  // Fetch all competitions
  const {
    data: competitions = [],
    isLoading: isLoadingCompetitions
  } = useQuery({
    queryKey: ['competitions'],
    queryFn: fetchCompetitions,
    enabled: !!session?.user?.id && isSuperAdmin
  });

  // Fetch current competition data
  const {
    data: competition,
    isLoading: isLoadingCompetition
  } = useQuery({
    queryKey: ['competition', currentCompetitionId],
    queryFn: async () => {
      console.log('Admin: Fetching competition with ID:', currentCompetitionId);

      // Try to find in already fetched competitions first (for performance)
      if (currentCompetitionId) {
        const foundInCache = competitions.find(c => c.id === currentCompetitionId);
        if (foundInCache) {
          console.log('Admin: Found competition in cache:', foundInCache);
          return foundInCache;
        }
      }

      // Use the improved getCurrentCompetition function
      return await getCurrentCompetition(currentCompetitionId || undefined);
    },
    enabled: !!session?.user?.id
  });

  // Fetch boulders for the current competition
  const {
    data: boulders = [],
    isLoading: isLoadingBoulders,
    refetch: refetchBoulders
  } = useQuery({
    queryKey: ['boulders', currentCompetitionId, false], // false to fetch all boulders incl. inactive
    queryFn: async () => {
      if (!currentCompetitionId) return [];
      return await fetchBoulders(currentCompetitionId, false); // false to include inactive boulders
    },
    enabled: !!session?.user?.id && !!currentCompetitionId
  });

  // Mutation for creating a new boulder
  const createBoulderMutation = useMutation({
    mutationFn: createBoulder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boulders', currentCompetitionId] });
      toast({
        title: t('boulderCreated'),
        description: t('boulderCreatedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error creating boulder:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create boulder',
        variant: 'destructive'
      });
    }
  });

  // Mutation for updating a boulder
  const updateBoulderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Boulder> }) => updateBoulder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boulders', currentCompetitionId] });
      setEditingBoulder(null);
      toast({
        title: 'Boulder Updated',
        description: 'The boulder has been updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating boulder:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update boulder',
        variant: 'destructive'
      });
    }
  });

  // Mutation for deleting a boulder
  const deleteBoulderMutation = useMutation({
    mutationFn: (id: string) => deleteBoulder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boulders', currentCompetitionId] });
      toast({
        title: 'Boulder Deleted',
        description: 'The boulder has been deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting boulder:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete boulder',
        variant: 'destructive'
      });
    }
  });

  // Mutation for updating competition leaderboard visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!currentCompetitionId) throw new Error("No competition selected");
      console.log(`Admin: Updating leaderboard visibility to ${isPublic}`);
      return await updateCompetitionVisibility(currentCompetitionId, isPublic);
    },
    onSuccess: (data) => {
      console.log('Visibility update successful, invalidating queries');
      // Invalidate all related queries to ensure data is refreshed everywhere
      queryClient.invalidateQueries({ queryKey: ['currentCompetition'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardVisibility'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      toast({
        title: "Leaderboard visibility updated",
        description: `Leaderboard is now ${data.isLeaderboardPublic ? 'public' : 'private'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating visibility",
        description: error.message || "Failed to update leaderboard visibility",
        variant: "destructive",
      });
    }
  });

  // Mutation for creating a competition
  const createCompetitionMutation = useMutation({
    mutationFn: createCompetition,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setNewCompetitionName('');
      setNewCompetitionLocation('');
      setIsCreatingCompetition(false);
      setCurrentCompetitionId(data.id);
      toast({
        title: "Competition created",
        description: `${data.name} competition has been created successfully`,
      });
    }
  });

  // Mutation for updating a competition
  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Competition> }) =>
      updateCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['currentCompetition', currentCompetitionId] });
      setEditCompetition(null);
      toast({
        title: "Competition updated",
        description: "Competition has been updated successfully",
      });
    }
  });

  // Mutation for deleting a competition
  const deleteCompetitionMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });

      // If the deleted competition was the current one, switch to another one
      if (currentCompetitionId === deletedId) {
        const remainingCompetitions = competitions.filter(c => c.id !== deletedId);
        if (remainingCompetitions.length > 0) {
          setCurrentCompetitionId(remainingCompetitions[0].id);
        } else {
          setCurrentCompetitionId(null);
        }
      }

      toast({
        title: "Competition deleted",
        description: "Competition has been deleted successfully",
      });
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Handle leaderboard visibility toggle
  const handleLeaderboardVisibilityChange = (visible: boolean) => {
    console.log(`Toggling leaderboard visibility to: ${visible}`);
    console.log('Current competition:', competition);
    updateVisibilityMutation.mutate(visible);
  };

  // Handle boulder form submission
  const handleBoulderSubmit = (data: Omit<Boulder, 'id'>) => {
    console.log('handleBoulderSubmit called with data:', data);
    console.log('Current competition ID:', currentCompetitionId, 'Type:', typeof currentCompetitionId);

    if (!currentCompetitionId) {
      toast({
        title: "No competition selected",
        description: "Please select a competition first",
        variant: "destructive",
      });
      return;
    }

    if (editingBoulder) {
      // Update existing boulder
      console.log('Updating boulder with ID:', editingBoulder.id);
      updateBoulderMutation.mutate({
        id: editingBoulder.id,
        data: {
          ...data,
          competitionId: Number(currentCompetitionId)
        }
      });
    } else {
      // Create new boulder
      console.log('Creating new boulder with competition ID:', currentCompetitionId);
      createBoulderMutation.mutate({
        ...data,
        competitionId: Number(currentCompetitionId)
      });
    }
  };

  // Handle boulder edit
  const handleEditBoulder = (boulder: Boulder) => {
    setEditingBoulder(boulder);
  };

  // Handle boulder delete
  const handleDeleteBoulder = (id: string) => {
    if (window.confirm('Are you sure you want to delete this boulder? This action cannot be undone.')) {
      deleteBoulderMutation.mutate(id);
    }
  };

  // Handle competition selection
  const handleCompetitionChange = (competitionId: number) => {
    if (competitionId !== currentCompetitionId) {
      if (window.confirm("Are you sure you want to change the active competition? This will affect which boulders are displayed and which competition participants are submitting attempts for.")) {
        setCurrentCompetitionId(competitionId);
        toast({
          title: "Competition Changed",
          description: "The active competition has been updated successfully."
        });
      }
    }
  };

  // Handle creating a new competition
  const handleCreateCompetition = () => {
    if (!newCompetitionName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a competition name",
        variant: "destructive",
      });
      return;
    }

    createCompetitionMutation.mutate({
      name: newCompetitionName,
      location: newCompetitionLocation || 'Unknown Location',
      isLeaderboardPublic: false,
    });
  };

  // Handle updating a competition
  const handleUpdateCompetition = () => {
    if (!editCompetition || !editCompetition.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a competition name",
        variant: "destructive",
      });
      return;
    }

    updateCompetitionMutation.mutate({
      id: editCompetition.id,
      data: {
        name: editCompetition.name,
        location: editCompetition.location || 'Unknown Location',
      }
    });
  };

  // Handle deleting a competition
  const handleDeleteCompetition = (id: number) => {
    if (window.confirm("Are you sure you want to delete this competition? This action cannot be undone.")) {
      deleteCompetitionMutation.mutate(id);
    }
  };

  if (loading || isLoadingBoulders || isLoadingCompetition || isLoadingCompetitions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={!!session}
        isAdmin={true}
        isSuperAdmin={isSuperAdmin}
        userName={session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0]}
        onLogout={handleLogout}
      />

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin')}</h1>
            <p className="text-muted-foreground">
              Manage competition settings and boulders
            </p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate('/finalists-dashboard')}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Finalists Dashboard
            </Button>
          </div>

        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Competition Settings</TabsTrigger>
            <TabsTrigger value="boulders">Boulders</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="superadmin">Super Admin</TabsTrigger>}
          </TabsList>

          {/* Competition Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Competition Settings</CardTitle>
                  <CardDescription>
                    Manage the current competition settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Competition Selection (Super Admin Only) */}
                    {isSuperAdmin && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Select Active Competition</h3>
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
                              </CardContent>
                            </Card>
                          ))}

                          {/* Add New Competition Button */}
                          <Dialog
                            open={isCreatingCompetition}
                            onOpenChange={setIsCreatingCompetition}
                          >
                            <DialogTrigger asChild>
                              <Card className="cursor-pointer border-dashed">
                                <CardContent className="p-4 flex justify-center items-center h-full">
                                  <div className="flex flex-col items-center">
                                    <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">Add New Competition</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Competition</DialogTitle>
                                <DialogDescription>
                                  Add the details for the new climbing competition
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
                                <Button
                                  variant="outline"
                                  onClick={() => setIsCreatingCompetition(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleCreateCompetition}
                                  disabled={createCompetitionMutation.isPending}
                                >
                                  {createCompetitionMutation.isPending ? 'Creating...' : 'Create Competition'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Edit Competition Dialog */}
                          <Dialog
                            open={!!editCompetition}
                            onOpenChange={(open) => !open && setEditCompetition(null)}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Competition</DialogTitle>
                                <DialogDescription>
                                  Update the details for this competition
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
                                      onChange={(e) => setEditCompetition({...editCompetition, name: e.target.value})}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-competition-location">Location</Label>
                                    <Input
                                      id="edit-competition-location"
                                      placeholder="Enter competition location"
                                      value={editCompetition.location}
                                      onChange={(e) => setEditCompetition({...editCompetition, location: e.target.value})}
                                    />
                                  </div>
                                </div>
                              )}

                              <DialogFooter className="flex justify-between">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteCompetition(editCompetition!.id)}
                                  disabled={updateCompetitionMutation.isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>

                                <div>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditCompetition(null)}
                                    className="mr-2"
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
                        </div>
                      </div>
                    )}

                    {/* Competition Name */}
                    <div className="bg-muted p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            Current Competition: {competition?.name || 'Default Competition'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {competition?.location || 'No location set'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {competition?.id} • Created: {new Date(competition?.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        {isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditCompetition(competition || null)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Leaderboard Visibility */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">{t('leaderboardVisibility')}</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-medium">
                            {competition?.isLeaderboardPublic ? t('public') : t('private')}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {competition?.isLeaderboardPublic
                              ? 'Everyone can see the leaderboard'
                              : 'Only admins can see the leaderboard'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="leaderboard-visibility"
                            checked={competition?.isLeaderboardPublic === true}
                            onCheckedChange={handleLeaderboardVisibilityChange}
                          />
                          <Label htmlFor="leaderboard-visibility">
                            {competition?.isLeaderboardPublic
                              ? <Eye className="h-4 w-4" />
                              : <EyeOff className="h-4 w-4" />}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Boulders Tab */}
          <TabsContent value="boulders">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {currentCompetitionId ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Boulder Management</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchBoulders()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Boulders
                    </Button>
                  </div>
                  <AdminBoulderForm
                    onSubmit={handleBoulderSubmit}
                    boulder={editingBoulder}
                    competitionId={currentCompetitionId}
                    isLoading={createBoulderMutation.isPending || updateBoulderMutation.isPending}
                  />

                  {editingBoulder && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setEditingBoulder(null)}
                        className="mr-2"
                      >
                        Cancel Editing
                      </Button>
                    </div>
                  )}

                  {/* Boulder List */}
                  {boulders.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Existing Boulders</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boulders.map(boulder => (
                          <Card key={boulder.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: boulder.color }}
                                  />
                                  <CardTitle className="text-lg">{boulder.name}</CardTitle>
                                </div>
                                {boulder.isActive ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactive</span>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">Order: {boulder.order}</p>
                              <p className="text-sm">Points: {boulder.pointsForFirst}/{boulder.pointsForSecond}/{boulder.pointsForThird}</p>
                              <div className="flex justify-end gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditBoulder(boulder)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteBoulder(boulder.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <PlusSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Competition Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    {isSuperAdmin
                      ? 'Please select or create a competition from the Settings tab to manage boulders.'
                      : 'Please ask a super admin to create a competition for you.'}
                  </p>
                  {isSuperAdmin && (
                    <Button onClick={() => navigate('/superadmin')} variant="outline">
                      Go to Competition Management
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Super Admin Tab */}
          {isSuperAdmin && (
            <TabsContent value="superadmin">
              <Card>
                <CardHeader>
                  <CardTitle>Super Admin Dashboard</CardTitle>
                  <CardDescription>
                    You have access to advanced competition management features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>As a super admin, you can:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Create new competitions</li>
                      <li>Edit existing competitions</li>
                      <li>Delete competitions</li>
                      <li>Switch between competitions</li>
                      <li>Manage user roles and permissions</li>
                    </ul>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={() => navigate('/superadmin?tab=users')} className="w-full">
                        Manage Users & Roles
                      </Button>
                      <Button onClick={() => navigate('/superadmin?tab=competitions')} className="w-full">
                        Manage Competitions
                      </Button>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
                      <h4 className="font-semibold text-amber-800 mb-2">Important Note</h4>
                      <p className="text-amber-700 text-sm">
                        Deleting a competition will permanently remove all associated boulders and
                        participant attempts. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
