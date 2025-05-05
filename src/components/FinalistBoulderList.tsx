import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Star, AlertCircle } from 'lucide-react';

interface Boulder {
  id: string;
  name: string;
  color: string;
  pointsforfirst: number;
  pointsforsecond: number;
  pointsforthird: number;
  pointsforfourth: number;
  pointsforfifth: number;
  pointsForZone: number;
}

interface Attempt {
  id: string;
  userId: string;
  boulderId: string;
  sendattempts: number;
  status: string;
  validated: boolean;
  boulder: Boulder;
  points: number;
  isTopSix: boolean;
}

interface FinalistBoulderListProps {
  userId: string;
  competitionId: number;
}

const FinalistBoulderList = ({ userId, competitionId }: FinalistBoulderListProps) => {
  const [topSixBoulders, setTopSixBoulders] = useState<string[]>([]);

  // Fetch attempts for the selected finalist
  const {
    data: attempts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['finalistBoulders', userId, competitionId],
    queryFn: async () => {
      // Fetch attempts with boulder details
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select(`
          id,
          userId,
          boulderId,
          sendattempts,
          status,
          validated,
          boulders (
            id,
            name,
            color,
            pointsforfirst,
            pointsforsecond,
            pointsforthird,
            pointsforfourth,
            pointsforfifth,
            pointsForZone
          )
        `)
        .eq('userId', userId)
        .eq('competitionid', competitionId);

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
        throw attemptsError;
      }

      // Process attempts to calculate points
      const processedAttempts: Attempt[] = attemptsData
        .filter(attempt => attempt.boulders) // Filter out attempts without boulder data
        .map(attempt => {
          const boulder = attempt.boulders as Boulder;
          let points = 0;

          // Calculate points based on send attempts and validation status
          if (attempt.validated && attempt.sendattempts > 0) {
            switch (attempt.sendattempts) {
              case 1: points = boulder.pointsforfirst; break;
              case 2: points = boulder.pointsforsecond; break;
              case 3: points = boulder.pointsforthird; break;
              case 4: points = boulder.pointsforfourth; break;
              case 5: points = boulder.pointsforfifth; break;
              default: points = boulder.pointsforfifth; break; // For attempts > 5
            }
          } else if (attempt.validated && attempt.status === 'zone') {
            points = boulder.pointsForZone;
          }

          return {
            ...attempt,
            boulder,
            points,
            isTopSix: false // Will be updated later
          };
        });

      // Sort by points in descending order
      processedAttempts.sort((a, b) => b.points - a.points);

      // Mark top 6 boulders
      const topSix = processedAttempts
        .filter(attempt => attempt.validated && (attempt.sendattempts > 0 || attempt.status === 'zone'))
        .slice(0, 6);
      
      const topSixIds = topSix.map(attempt => attempt.boulderId);
      setTopSixBoulders(topSixIds);

      // Update isTopSix flag
      return processedAttempts.map(attempt => ({
        ...attempt,
        isTopSix: topSixIds.includes(attempt.boulderId)
      }));
    },
    enabled: !!userId && !!competitionId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Error loading boulder data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No boulder attempts found for this finalist.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort attempts: first top 6 boulders, then by points
  const sortedAttempts = [...attempts].sort((a, b) => {
    // First sort by top six status
    if (a.isTopSix && !b.isTopSix) return -1;
    if (!a.isTopSix && b.isTopSix) return 1;
    
    // Then by points
    return b.points - a.points;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Boulder Attempts</h2>
        <Badge variant="outline" className="font-normal">
          Top 6 boulders count towards total
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedAttempts.map((attempt) => (
          <Card 
            key={attempt.id}
            className={`${attempt.isTopSix ? 'border-primary bg-primary/5' : ''}`}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: attempt.boulder.color.toLowerCase() }}
                  />
                  <div>
                    <CardTitle className="text-base">
                      {attempt.boulder.name}
                      {attempt.isTopSix && (
                        <Badge className="ml-2 bg-primary">Top 6</Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Color: {attempt.boulder.color}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold flex items-center">
                    {attempt.points} pts
                    {attempt.isTopSix && <Star className="h-4 w-4 ml-1 text-amber-500" />}
                  </div>
                  <div className="flex items-center text-xs">
                    {attempt.validated ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Validated
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Validated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Attempts</p>
                  <p className="font-medium">
                    {attempt.sendattempts > 0 
                      ? `${attempt.sendattempts} ${attempt.sendattempts === 1 ? 'attempt' : 'attempts'}`
                      : attempt.status === 'zone' 
                        ? 'Zone only' 
                        : 'No attempts'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Points</p>
                  <div className="text-xs space-y-1">
                    <p>Flash: {attempt.boulder.pointsforfirst} pts</p>
                    <p>2nd try: {attempt.boulder.pointsforsecond} pts</p>
                    <p>3rd try: {attempt.boulder.pointsforthird} pts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FinalistBoulderList;
