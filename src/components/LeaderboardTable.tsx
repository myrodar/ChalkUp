
import { useState } from 'react';
import { LeaderboardEntry } from '@/types';
import { TableHead, Table, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Trophy, Search, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from '@/hooks/use-translation';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  genderFilter?: 'male' | 'female' | 'all';
}

const LeaderboardTable = ({ entries, genderFilter = 'all' }: LeaderboardTableProps) => {
  console.log('LeaderboardTable received entries:', entries);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalPoints' | 'totalBoulders' | 'totalFlashes'>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [universityFilter, setUniversityFilter] = useState<string>('all');

  // Get unique universities for filter
  const universities = ['all', ...Array.from(new Set(entries.map(entry => entry.university)))];

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.university.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = universityFilter === 'all' || entry.university === universityFilter;

    // For gender filtering
    let matchesGender = true;
    if (genderFilter !== 'all') {
      // When specific gender is selected, show only that gender
      matchesGender = entry.gender === genderFilter;
    }
    // No additional filtering for 'all' - we'll handle the top 6 per gender later

    return matchesSearch && matchesUniversity && matchesGender;
  });

  // Sort entries by the selected criteria
  const sortByPoints = (entries: LeaderboardEntry[]) => {
    return [...entries].sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * factor;
    });
  };

  // Get the entries to display based on gender filter
  let displayEntries: LeaderboardEntry[] = [];

  if (genderFilter === 'all') {
    // For 'all' tab, get top 6 men and top 6 women
    const maleEntries = sortByPoints(filteredEntries.filter(entry => entry.gender === 'male')).slice(0, 6);
    const femaleEntries = sortByPoints(filteredEntries.filter(entry => entry.gender === 'female')).slice(0, 6);

    // Combine the finalists
    displayEntries = [...maleEntries, ...femaleEntries];

    // Sort the combined list by points for display
    displayEntries = sortByPoints(displayEntries);

    console.log('Showing top 6 men and top 6 women:', displayEntries);
  } else {
    // For gender-specific tabs, show all entries of that gender
    displayEntries = sortByPoints(filteredEntries);
  }

  const toggleSort = (column: 'totalPoints' | 'totalBoulders' | 'totalFlashes') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-auto flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search climbers or universities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            value={universityFilter}
            onValueChange={(value) => setUniversityFilter(value)}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <SelectValue placeholder="All Universities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {universities.map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni === 'all' ? 'All Universities' : uni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <ArrowUpDown size={14} className="mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort('totalPoints')}>
                {t('points')} {sortBy === 'totalPoints' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('totalBoulders')}>
                {t('bouldersSent')} {sortBy === 'totalBoulders' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('totalFlashes')}>
                {t('flashes')} {sortBy === 'totalFlashes' && (sortDirection === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead>Climber</TableHead>
              <TableHead>University</TableHead>
              <TableHead className="text-right">{t('bouldersSent')}</TableHead>
              <TableHead className="text-right">{t('flashes')}</TableHead>
              <TableHead className="text-right">{t('points')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEntries.length > 0 ? (
              <>
                {/* Display all entries as finalists when in 'all' mode, or top 6 in gender-specific modes */}
                {displayEntries.map((entry, index) => {
                  const isFinalist = genderFilter === 'all' || index < 6;
                  const showTrophy = index < 3;

                  return (
                    <TableRow
                      key={entry.userId}
                      className={`hover:bg-muted/50 ${isFinalist ? 'bg-primary/5 border-b-2 border-primary/20' : ''}`}
                    >
                      <TableCell className="font-medium text-center">
                        {showTrophy ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <Trophy size={16} className={
                              index === 0 ? "text-yellow-500" :
                              index === 1 ? "text-gray-400" :
                              "text-amber-700"
                            } />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.userName}
                        {isFinalist && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                            {t('finalist')}
                          </span>
                        )}
                        {genderFilter === 'all' && (
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                            {entry.gender === 'male' ? t('male') : t('female')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{entry.university}</TableCell>
                      <TableCell className="text-right">{entry.totalBoulders}</TableCell>
                      <TableCell className="text-right">{entry.totalFlashes}</TableCell>
                      <TableCell className="text-right font-bold">{entry.totalPoints}</TableCell>
                    </TableRow>
                  );
                })}

                {/* No divider or other participants in 'all' mode since we only show finalists */}
                {genderFilter !== 'all' && displayEntries.length > 6 && (
                  <>
                    {/* Divider */}
                    <TableRow>
                      <TableCell colSpan={6} className="py-2 px-4 bg-muted">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-px flex-1 bg-border"></div>
                          <span className="text-xs font-medium text-muted-foreground">{t('finalistsCutoff')}</span>
                          <div className="h-px flex-1 bg-border"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
