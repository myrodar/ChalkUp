import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import LeaderboardTable from '@/components/LeaderboardTable';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { RefreshCw, Medal, Users, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';
import { isLeaderboardPublic } from '@/lib/database';
import { useTranslation } from '@/hooks/use-translation';

// Define interface for leaderboard entries
interface LeaderboardEntry {
  userId: string;
  userName: string;
  university: string;
  gender: 'male' | 'female' | 'other' | null;
  totalPoints: number;
  totalBoulders: number;
  totalFlashes: number;
  competitionId: string | number;
}

const Leaderboard = () => {
  const { session, currentCompetitionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isPublic, setIsPublic] = useState(false);
  const [activeGender, setActiveGender] = useState<'all' | 'male' | 'female'>('all');
  const isAdmin = session?.user?.user_metadata?.isAdmin === true;

  // Check if leaderboard is public
  const { data: leaderboardIsPublic, isLoading: isLoadingPublicStatus } = useQuery({
    queryKey: ['leaderboardVisibility', currentCompetitionId],
    queryFn: async () => {
      if (!currentCompetitionId) return false;
      return await isLeaderboardPublic(currentCompetitionId);
    },
    enabled: !!currentCompetitionId
  });

  // Set isPublic state when data is loaded
  useEffect(() => {
    if (leaderboardIsPublic !== undefined) {
      console.log('Setting isPublic state to:', leaderboardIsPublic);
      setIsPublic(leaderboardIsPublic);
    }
  }, [leaderboardIsPublic]);

  // Debug log for visibility status
  useEffect(() => {
    console.log('Current visibility state:', {
      isPublic,
      isAdmin,
      leaderboardIsPublic,
      isLoadingPublicStatus,
      currentCompetitionId
    });
  }, [isPublic, isAdmin, leaderboardIsPublic, isLoadingPublicStatus, currentCompetitionId]);

  // Fetch leaderboard data using the database utility
  console.log('Leaderboard component: currentCompetitionId =', currentCompetitionId);
  console.log('Leaderboard component: isPublic =', isPublic);
  console.log('Leaderboard component: isAdmin =', isAdmin);

  // Use React Query to fetch the leaderboard data
  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', currentCompetitionId],
    queryFn: async () => {
      if (!currentCompetitionId) return [];
      try {
        console.log('Fetching leaderboard data for competition:', currentCompetitionId);

        // Use the Supabase client directly to fetch the data
        // This will work with our new RLS policies that allow public access
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('attempts')
          .select(`
            userId,
            sendattempts,
            status,
            validated,
            competitionid,
            boulders(id, pointsforfirst, pointsforsecond, pointsforthird, pointsforfourth, pointsforfifth, pointsForZone)
          `)
          .eq('competitionid', currentCompetitionId);

        if (attemptsError) {
          console.error('Error fetching attempts:', attemptsError);
          return [];
        }

        console.log('Fetched attempts data:', attemptsData);

        // Get all users via profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return [];
        }

        console.log('Fetched profiles data:', profiles);

        // Calculate leaderboard entries
        const leaderboardMap: Record<string, LeaderboardEntry> = {};

        // Process user data from profiles
        if (profiles && Array.isArray(profiles)) {
          profiles.forEach(profile => {
            if (profile && profile.id) {
              leaderboardMap[profile.id] = {
                userId: profile.id,
                userName: profile.name || 'Unknown Climber',
                university: profile.university || 'Unknown University',
                gender: (profile.gender as 'male' | 'female' | 'other' | null) || null,
                totalPoints: 0,
                totalBoulders: 0,
                totalFlashes: 0,
                competitionId: currentCompetitionId
              };
            }
          });
        }

        // Calculate points from attempts
        if (attemptsData && Array.isArray(attemptsData)) {
          // First, collect all boulder points for each user
          const userBoulderPoints: Record<string, { boulderId: string; points: number }[]> = {};

          attemptsData.forEach(attempt => {
            if (!attempt || !attempt.userId || !leaderboardMap[attempt.userId]) return;

            const boulder = attempt.boulders;
            if (!boulder) return;

            // TypeScript fix: Cast boulder to any to access properties
            const boulderData = boulder as any;

            const entry = leaderboardMap[attempt.userId];

            // Initialize boulder points array for this user if it doesn't exist
            if (!userBoulderPoints[attempt.userId]) {
              userBoulderPoints[attempt.userId] = [];
            }

            // Only count validated boulders
            const isValidated = attempt.validated === true;

            // Calculate send points for validated boulders only
            if (isValidated && attempt.sendattempts > 0) {
              let sendPoints = 0;
              switch (attempt.sendattempts) {
                case 1: sendPoints = boulderData.pointsforfirst || 0; break;
                case 2: sendPoints = boulderData.pointsforsecond || 0; break;
                case 3: sendPoints = boulderData.pointsforthird || 0; break;
                case 4: sendPoints = boulderData.pointsforfourth || 0; break;
                case 5: sendPoints = boulderData.pointsforfifth || 0; break;
                default: sendPoints = boulderData.pointsforfifth || 0; break; // For attempts > 5
              }

              // Add to boulder points array
              userBoulderPoints[attempt.userId].push({
                boulderId: boulderData.id,
                points: sendPoints
              });

              entry.totalBoulders += 1;

              // Count flashes (sends in first attempt)
              if (attempt.sendattempts === 1) {
                entry.totalFlashes += 1;
              }
            }
            // Check for zone points
            else if (isValidated && attempt.status === 'zone') {
              // Add zone points
              userBoulderPoints[attempt.userId].push({
                boulderId: boulderData.id,
                points: boulderData.pointsForZone || 0
              });
            }
          });

          // Now calculate total points from the top 6 boulders for each user
          Object.keys(userBoulderPoints).forEach(userId => {
            const entry = leaderboardMap[userId];
            if (!entry) return;

            // Sort boulders by points in descending order
            const sortedBoulders = userBoulderPoints[userId].sort((a, b) => b.points - a.points);

            // Take only the 6 best boulders (or all if less than 6)
            const bestBoulders = sortedBoulders.slice(0, 6);

            // Sum up the points from the best boulders
            entry.totalPoints = bestBoulders.reduce((sum, boulder) => sum + boulder.points, 0);
          });
        }

        // Convert map to array and sort by points
        const leaderboardEntries = Object.values(leaderboardMap)
          .sort((a, b) => b.totalPoints - a.totalPoints);

        console.log('Returning leaderboard entries:', leaderboardEntries);
        return leaderboardEntries;
      } catch (error: unknown) {
        console.error('Error fetching leaderboard:', error);
        toast({
          title: "Error fetching leaderboard",
          description: error instanceof Error ? error.message : "Failed to load leaderboard data",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!currentCompetitionId,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  };

  // We always show the leaderboard now, since we have dummy data if there are no real entries

  if (isLoading) {
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
        userName={session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0]}
        onLogout={handleLogout}
      />

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('competitionLeaderboard')}</h1>
            <p className="text-muted-foreground">
              {t('seeRanking')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-primary">Top 6</span> {t('qualifyForFinals')} ({t('perGender')})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-amber-500">Note:</span> Only validated boulders are counted in the scores
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-amber-500">Scoring:</span> Only the 6 best boulders count towards the total points
            </p>
          </div>

        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('topClimber')}</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  {entries.length > 0 ? entries[0].userName : 'N/A'}
                  <Medal className="h-5 w-5 ml-2 text-amber-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {entries.length > 0 ? `${entries[0].totalPoints} ${t('points')} • ${entries[0].university}` : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('mostActiveUniversity')}</CardDescription>
                <CardTitle className="text-2xl">
                  {entries.length > 0
                    ? Object.entries(
                        entries.reduce((acc, entry) => {
                          acc[entry.university] = (acc[entry.university] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .at(0)?.[0] || 'N/A'
                    : 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {entries.length > 0
                    ? `${entries.filter(e =>
                        e.university === Object.entries(
                          entries.reduce((acc, entry) => {
                            acc[entry.university] = (acc[entry.university] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .at(0)?.[0]
                      ).length} ${t('climbers')}`
                    : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('totalParticipants')}</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  {entries.length}
                  <Users className="h-5 w-5 ml-2 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('from')} {Array.from(new Set(entries.map(e => e.university))).length} {t('universities')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="hover-lift bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('finalists')}</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  12
                  <Trophy className="h-5 w-5 ml-2 text-amber-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <span className="text-blue-600 font-medium">6 {t('men')}</span> + <span className="text-pink-600 font-medium">6 {t('women')}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {/* Gender Tabs */}
          <Tabs defaultValue="all" value={activeGender} onValueChange={(value) => setActiveGender(value as 'all' | 'male' | 'female')} className="mb-6">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="all">{t('finalists')} (12)</TabsTrigger>
                <TabsTrigger value="male">{t('menOnly')}</TabsTrigger>
                <TabsTrigger value="female">{t('womenOnly')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-4">
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10 text-center">
                <p className="text-sm">
                  Showing the top 6 men and top 6 women who will advance to the finals.
                </p>
              </div>
              <LeaderboardTable entries={entries} genderFilter="all" />
            </TabsContent>

            <TabsContent value="male" className="mt-4">
              <LeaderboardTable entries={entries} genderFilter="male" />
            </TabsContent>

            <TabsContent value="female" className="mt-4">
              <LeaderboardTable entries={entries} genderFilter="female" />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
