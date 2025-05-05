import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Trophy, Medal, Star, ArrowLeft } from 'lucide-react';
import { fetchLeaderboard } from '@/lib/database';
import { LeaderboardEntry } from '@/types';
import FinalistBoulderList from '@/components/FinalistBoulderList';

const FinalistsDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedFinalistId, setSelectedFinalistId] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<{ id: number; name: string }[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);

  // Fetch competitions
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching competitions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load competitions',
          variant: 'destructive',
        });
        return;
      }

      if (data && data.length > 0) {
        setCompetitions(data);
        setSelectedCompetitionId(data[0].id);
      }
    };

    fetchCompetitions();
  }, [toast]);

  // Fetch finalists data
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
  } = useQuery({
    queryKey: ['finalists', selectedCompetitionId],
    queryFn: async () => {
      if (!selectedCompetitionId) return [];
      return fetchLeaderboard(selectedCompetitionId);
    },
    enabled: !!selectedCompetitionId,
  });

  // Filter finalists by gender and take top 6
  const finalists = leaderboardData
    ? leaderboardData
        .filter(entry => entry.gender === selectedGender)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 6)
    : [];

  // Set first finalist as selected by default when finalists change
  useEffect(() => {
    if (finalists.length > 0 && !selectedFinalistId) {
      setSelectedFinalistId(finalists[0].userId);
    } else if (finalists.length > 0 && !finalists.some(f => f.userId === selectedFinalistId)) {
      // If the selected finalist is no longer in the list, select the first one
      setSelectedFinalistId(finalists[0].userId);
    }
  }, [finalists, selectedFinalistId]);

  // Get selected finalist data
  const selectedFinalist = finalists.find(f => f.userId === selectedFinalistId);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.id) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('isAdmin, isSuperAdmin')
        .eq('id', session.user.id)
        .single();

      if (error || (!data?.isAdmin && !data?.isSuperAdmin)) {
        navigate('/dashboard');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this page',
          variant: 'destructive',
        });
      }
    };

    checkAdminStatus();
  }, [session, navigate, toast]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={!!session}
        userName={session?.user?.user_metadata?.name || 'Admin'}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
      />

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Finalists Dashboard</h1>
            <p className="text-muted-foreground">
              View detailed information about finalists and their boulders
            </p>
          </div>
        </div>

        {/* Competition Selector */}
        <div className="mb-8">
          <Select
            value={selectedCompetitionId?.toString() || ''}
            onValueChange={(value) => setSelectedCompetitionId(Number(value))}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select Competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id.toString()}>
                  {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingLeaderboard ? (
          <div className="grid gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : leaderboardError ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                Error loading finalists data. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="male" onValueChange={(value) => setSelectedGender(value as 'male' | 'female')}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="male">Men Finalists</TabsTrigger>
                <TabsTrigger value="female">Women Finalists</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="male" className="space-y-6">
              <FinalistsView 
                finalists={finalists} 
                selectedFinalistId={selectedFinalistId}
                onSelectFinalist={setSelectedFinalistId}
                selectedFinalist={selectedFinalist}
                competitionId={selectedCompetitionId}
              />
            </TabsContent>

            <TabsContent value="female" className="space-y-6">
              <FinalistsView 
                finalists={finalists} 
                selectedFinalistId={selectedFinalistId}
                onSelectFinalist={setSelectedFinalistId}
                selectedFinalist={selectedFinalist}
                competitionId={selectedCompetitionId}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

// Finalists view component
const FinalistsView = ({ 
  finalists, 
  selectedFinalistId, 
  onSelectFinalist, 
  selectedFinalist,
  competitionId
}: { 
  finalists: LeaderboardEntry[]; 
  selectedFinalistId: string | null;
  onSelectFinalist: (id: string) => void;
  selectedFinalist: LeaderboardEntry | undefined;
  competitionId: number | null;
}) => {
  if (finalists.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No finalists found for this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Finalists List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Finalists</h2>
        {finalists.map((finalist, index) => (
          <Card 
            key={finalist.userId}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedFinalistId === finalist.userId ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelectFinalist(finalist.userId)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {index < 3 ? (
                      <Trophy size={16} className={
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" :
                        "text-amber-700"
                      } />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{finalist.userName}</h3>
                    <p className="text-xs text-muted-foreground">{finalist.university}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{finalist.totalPoints} pts</p>
                  <p className="text-xs text-muted-foreground">{finalist.totalBoulders} boulders</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Finalist Details */}
      <div className="lg:col-span-2">
        {selectedFinalist ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedFinalist.userName}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({selectedFinalist.university})
                  </span>
                </CardTitle>
                <CardDescription>
                  Rank #{finalists.findIndex(f => f.userId === selectedFinalistId) + 1} • {selectedFinalist.totalPoints} points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Points</div>
                    <div className="text-2xl font-bold flex items-center">
                      {selectedFinalist.totalPoints}
                      <Star className="h-5 w-5 ml-2 text-amber-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Boulders Sent</div>
                    <div className="text-2xl font-bold">{selectedFinalist.totalBoulders}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Flashes</div>
                    <div className="text-2xl font-bold">{selectedFinalist.totalFlashes}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boulder List */}
            {competitionId && (
              <FinalistBoulderList 
                userId={selectedFinalist.userId} 
                competitionId={competitionId} 
              />
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Select a finalist to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinalistsDashboard;
