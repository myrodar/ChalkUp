import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { fetchUserCompetitionResults, UserCompetitionResult } from '@/lib/database';
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Award, BarChart3, TrendingUp, Medal, Star, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Competition {
  id: number;
  name: string;
  location: string;
  date: string;
  isActive: boolean;
}

// Using the UserCompetitionResult interface from database.ts

const MyResults = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);

  // Check if user is logged in; if not, redirect
  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  // Query to get user profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!session?.user?.id
  });

  // Query to get all competitions
  const {
    data: competitions = [],
    isLoading: isLoadingCompetitions,
  } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching competitions:', error);
        return [];
      }

      return data as Competition[];
    },
    enabled: !!session?.user?.id
  });

  // Set the first competition as selected when data loads
  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
  }, [competitions, selectedCompetition]);

  // Query to get user's competition stats
  const {
    data: userCompetitionStats = [],
    isLoading: isLoadingStats,
  } = useQuery<UserCompetitionResult[]>({
    queryKey: ['userCompetitionStats', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      // Use our new function to get real competition results with actual ranks and points
      const results = await fetchUserCompetitionResults(session.user.id);
      console.log('User competition results:', results);
      return results;
    },
    enabled: !!session?.user?.id
  });

  // Calculate overall stats
  const overallStats = {
    totalCompetitions: userCompetitionStats.length,
    totalPoints: userCompetitionStats.reduce((sum, comp) => sum + comp.totalPoints, 0),
    averageRank: userCompetitionStats.length > 0
      ? Math.round(userCompetitionStats.reduce((sum, comp) => sum + comp.rank, 0) / userCompetitionStats.length)
      : 0,
    bestRank: userCompetitionStats.length > 0
      ? Math.min(...userCompetitionStats.map(comp => comp.rank))
      : 0,
    totalBouldersSent: userCompetitionStats.reduce((sum, comp) => sum + comp.bouldersSent, 0),
    totalFlashes: userCompetitionStats.reduce((sum, comp) => sum + comp.flashes, 0),
    completionRate: userCompetitionStats.length > 0
      ? Math.round(
          (userCompetitionStats.reduce((sum, comp) => sum + comp.bouldersSent, 0) /
          userCompetitionStats.reduce((sum, comp) => sum + comp.totalBoulders, 0)) * 100
        )
      : 0
  };

  // Prepare chart data for points history
  const pointsHistoryData = {
    labels: userCompetitionStats.map(comp => comp.competitionName),
    datasets: [
      {
        label: t('totalPoints'),
        data: userCompetitionStats.map(comp => comp.totalPoints),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Prepare chart data for rank history
  const rankHistoryData = {
    labels: userCompetitionStats.map(comp => comp.competitionName),
    datasets: [
      {
        label: t('rank'),
        data: userCompetitionStats.map(comp => comp.rank),
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Prepare chart data for boulder completion
  const boulderCompletionData = {
    labels: userCompetitionStats.map(comp => comp.competitionName),
    datasets: [
      {
        label: t('bouldersSent'),
        data: userCompetitionStats.map(comp => comp.bouldersSent),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: t('flashes'),
        data: userCompetitionStats.map(comp => comp.flashes),
        backgroundColor: 'rgba(234, 88, 12, 0.7)',
      },
      {
        label: t('zones'),
        data: userCompetitionStats.map(comp => comp.zones),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  // Prepare chart data for selected competition
  const selectedCompData = userCompetitionStats.find(comp => comp.competitionId === selectedCompetition);

  const competitionBreakdownData = selectedCompData ? {
    labels: [t('flashes'), t('sends'), t('zones'), t('notAttempted')],
    datasets: [
      {
        data: [
          selectedCompData.flashes,
          selectedCompData.bouldersSent - selectedCompData.flashes,
          selectedCompData.zones,
          selectedCompData.totalBoulders - selectedCompData.bouldersSent - selectedCompData.zones
        ],
        backgroundColor: [
          'rgba(234, 88, 12, 0.7)',  // Orange for flashes
          'rgba(99, 102, 241, 0.7)',  // Indigo for sends
          'rgba(34, 197, 94, 0.7)',   // Green for zones
          'rgba(203, 213, 225, 0.7)', // Gray for not attempted
        ],
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  // If data is still loading, show a spinner
  if (loading || isLoadingProfile || isLoadingCompetitions || isLoadingStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const userProfile = profileData || {};
  const userName = userProfile.name || session?.user?.email?.split('@')[0] || 'Climber';

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={!!session}
        userName={userName}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
      />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('myResults')}</h1>
            <p className="text-muted-foreground">
              {t('trackProgress')}
            </p>
          </div>
        </div>

        {userCompetitionStats.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle className="mb-4">{t('noCompetitionsYet') || 'No Competition Data Yet'}</CardTitle>
            <CardDescription>
              {t('participateToSeeStats') || 'Participate in competitions to see your statistics and progress.'}
            </CardDescription>
          </Card>
        ) : (
          <>
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardDescription>{t('totalCompetitions') || 'Total Competitions'}</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {overallStats.totalCompetitions}
                    <Calendar className="h-5 w-5 ml-2 text-primary" />
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardDescription>{t('bestRank') || 'Best Rank'}</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {overallStats.bestRank}
                    <Medal className="h-5 w-5 ml-2 text-amber-500" />
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardDescription>{t('totalPoints') || 'Total Points'}</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {overallStats.totalPoints}
                    <Star className="h-5 w-5 ml-2 text-amber-500" />
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardDescription>{t('completionRate') || 'Completion Rate'}</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {overallStats.completionRate}%
                    <TrendingUp className="h-5 w-5 ml-2 text-green-500" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">{t('overview') || 'Overview'}</TabsTrigger>
                <TabsTrigger value="competitions">{t('competitions') || 'Competitions'}</TabsTrigger>
                <TabsTrigger value="progress">{t('progress') || 'Progress'}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('pointsHistory') || 'Points History'}</CardTitle>
                      <CardDescription>
                        {t('pointsHistoryDesc') || 'Your points across all competitions'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <Line
                          data={pointsHistoryData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('rankHistory') || 'Rank History'}</CardTitle>
                      <CardDescription>
                        {t('rankHistoryDesc') || 'Your ranking position in each competition'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <Line
                          data={rankHistoryData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                reverse: true, // Lower rank is better
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('boulderCompletion') || 'Boulder Completion'}</CardTitle>
                    <CardDescription>
                      {t('boulderCompletionDesc') || 'Breakdown of your boulder completions by competition'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Bar
                        data={boulderCompletionData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              stacked: false,
                            },
                            x: {
                              stacked: false,
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competitions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('selectCompetition') || 'Select Competition'}</CardTitle>
                      <CardDescription>
                        {t('viewDetailedStats') || 'View detailed statistics for a specific competition'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {userCompetitionStats.map(comp => (
                          <button
                            key={comp.competitionId}
                            onClick={() => setSelectedCompetition(comp.competitionId)}
                            className={`w-full text-left p-3 rounded-md transition-colors ${
                              selectedCompetition === comp.competitionId
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{comp.competitionName}</div>
                            <div className="text-sm opacity-90">{comp.date}</div>
                            <div className="flex justify-between mt-2 text-sm">
                              <div className="flex items-center">
                                <Medal className="h-4 w-4 mr-1 text-amber-500" />
                                <span className={selectedCompetition === comp.competitionId ? '' : 'text-muted-foreground'}>
                                  {comp.rank || 'N/A'}
                                  {comp.rank && ` / ${comp.totalParticipants}`}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-amber-500" />
                                <span className={selectedCompetition === comp.competitionId ? '' : 'text-muted-foreground'}>
                                  {comp.totalPoints} pts
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedCompData && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedCompData.competitionName}</CardTitle>
                        <CardDescription>
                          {selectedCompData.date}
                          {selectedCompData.location && (
                            <span className="ml-2 text-primary">@ {selectedCompData.location}</span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="space-y-1 bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <div className="text-sm text-muted-foreground">{t('rank') || 'Rank'}</div>
                            <div className="text-2xl font-bold flex items-center">
                              {selectedCompData.rank || 'N/A'}
                              {selectedCompData.rank && (
                                <span className="text-sm ml-2 text-muted-foreground">/ {selectedCompData.totalParticipants}</span>
                              )}
                              <Medal className="h-5 w-5 ml-auto text-amber-500" />
                            </div>
                            {selectedCompData.rank && selectedCompData.rank <= 6 && (
                              <div className="text-xs mt-1 text-green-600 font-medium">
                                {t('finalist') || 'Finalist'} 🏆
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <div className="text-sm text-muted-foreground">{t('totalPoints') || 'Total Points'}</div>
                            <div className="text-2xl font-bold flex items-center">
                              {selectedCompData.totalPoints}
                              <Star className="h-5 w-5 ml-auto text-amber-500" />
                            </div>
                            <div className="text-xs mt-1 text-muted-foreground">
                              {t('fromValidatedBoulders') || 'From validated boulders'}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">{t('bouldersSent') || 'Boulders Sent'}</div>
                            <div className="text-2xl font-bold">{selectedCompData.bouldersSent} / {selectedCompData.totalBoulders}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">{t('flashes') || 'Flashes'}</div>
                            <div className="text-2xl font-bold">{selectedCompData.flashes}</div>
                          </div>
                        </div>

                        <div className="h-60">
                          <Doughnut
                            data={competitionBreakdownData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                }
                              }
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('progressOverTime') || 'Progress Over Time'}</CardTitle>
                    <CardDescription>
                      {t('progressDesc') || 'Track your improvement across competitions'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t('averageRank') || 'Average Rank'}</div>
                        <div className="text-3xl font-bold flex items-center">
                          {overallStats.averageRank}
                          <Medal className="h-5 w-5 ml-2 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('bestRank') || 'Best Rank'}: {overallStats.bestRank}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t('totalBouldersSent') || 'Total Boulders Sent'}</div>
                        <div className="text-3xl font-bold flex items-center">
                          {overallStats.totalBouldersSent}
                          <BarChart3 className="h-5 w-5 ml-2 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('totalFlashes') || 'Total Flashes'}: {overallStats.totalFlashes}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t('improvementRate') || 'Improvement Rate'}</div>
                        <div className="text-3xl font-bold flex items-center">
                          {userCompetitionStats.length > 1 ?
                            Math.round((userCompetitionStats[0].totalPoints / userCompetitionStats[userCompetitionStats.length - 1].totalPoints - 1) * 100) + '%' :
                            'N/A'}
                          <TrendingUp className="h-5 w-5 ml-2 text-green-500" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('fromFirstToLast') || 'From first to last competition'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">{t('skillBreakdown') || 'Skill Breakdown'}</h3>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{t('flashRate') || 'Flash Rate'}</span>
                            <span className="text-sm font-medium">
                              {Math.round((overallStats.totalFlashes / overallStats.totalBouldersSent) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-amber-500 h-2.5 rounded-full"
                              style={{ width: `${Math.round((overallStats.totalFlashes / overallStats.totalBouldersSent) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{t('completionRate') || 'Completion Rate'}</span>
                            <span className="text-sm font-medium">{overallStats.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${overallStats.completionRate}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{t('rankPercentile') || 'Rank Percentile'}</span>
                            <span className="text-sm font-medium">
                              {userCompetitionStats.length > 0 ?
                                Math.round((1 - (overallStats.averageRank / userCompetitionStats[0].totalParticipants)) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-green-500 h-2.5 rounded-full"
                              style={{
                                width: `${userCompetitionStats.length > 0 ?
                                  Math.round((1 - (overallStats.averageRank / userCompetitionStats[0].totalParticipants)) * 100) : 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default MyResults;
