import { supabase } from './supabase';
import { Boulder, LeaderboardEntry, Competition, Attempt } from '@/types';

// Define types for database responses
type AttemptStatus = 'none' | 'zone' | 'sent' | 'flash';

interface DbBoulder {
  pointsforfirst: number;
  pointsforsecond: number;
  pointsforthird: number;
  pointsforfourth: number;
  pointsforfifth: number;
  pointsForZone: number;
}

interface ProcessedAttempt {
  userId: string;
  boulderId?: string; // Add boulderId field
  sendAttempts: number;
  zoneAttempts: number;
  competitionId: string;
  status: AttemptStatus;
  validated: boolean;
  boulders: {
    pointsForFirst: number;
    pointsForSecond: number;
    pointsForThird: number;
    pointsForFourth: number;
    pointsForFifth: number;
    pointsForZone: number;
  } | null;
}

interface DbAttempt {
  id: string;
  userId: string;
  boulderId: string;
  competitionid: string;
  sendattempts: number;
  zoneattempts: number;
  timestamp: string;
  status: AttemptStatus;
  validated?: boolean;
  boulders?: {
    pointsforfirst: number;
    pointsforsecond: number;
    pointsforthird: number;
    pointsforfourth: number;
    pointsforfifth: number;
    pointsForZone: number;
  };
}



interface Profile {
  id: string;
  name: string | null;
  university: string | null;
  gender?: string | null;
  isSuperAdmin?: boolean;
}



// Boulder operations
export const fetchBoulders = async (competitionId: number, activeOnly = true) => {
  try {
    let query = supabase.from('boulders').select('*')
      .eq('competitionid', competitionId); // Changed to match database column name

    if (activeOnly) {
      query = query.eq('isActive', true);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) throw error;

    // Map database column names to our interface names
    const mappedData = data.map(boulder => ({
      id: boulder.id,
      name: boulder.name,
      color: boulder.color,
      pointsForFirst: boulder.pointsforfirst,
      pointsForSecond: boulder.pointsforsecond,
      pointsForThird: boulder.pointsforthird,
      pointsForFourth: boulder.pointsforfourth,
      pointsForFifth: boulder.pointsforfifth,
      pointsForZone: boulder.pointsForZone,
      isActive: boulder.isActive,
      order: boulder.order,
      competitionId: boulder.competitionid
    }));

    return mappedData as Boulder[];
  } catch (error) {
    console.error('Error fetching boulders:', error);
    return [];
  }
};

export const createBoulder = async (boulder: Omit<Boulder, 'id'>) => {
  try {
    // Generate a unique ID
    const id = `b_${Date.now()}`;

    console.log('Creating boulder with data:', boulder);
    console.log('Competition ID type:', typeof boulder.competitionId);

    // Map our interface names to database column names
    const dbBoulder = {
      id,
      name: boulder.name,
      color: boulder.color,
      pointsforfirst: boulder.pointsForFirst,
      pointsforsecond: boulder.pointsForSecond,
      pointsforthird: boulder.pointsForThird,
      pointsforfourth: boulder.pointsForFourth,
      pointsforfifth: boulder.pointsForFifth,
      pointsForZone: boulder.pointsForZone,
      pointsForSend: boulder.pointsForSend || boulder.pointsForFirst, // Use pointsForFirst as default
      isActive: boulder.isActive,
      order: boulder.order,
      competitionid: Number(boulder.competitionId) // Ensure it's a number
    };

    console.log('Sending boulder data to Supabase:', dbBoulder);

    const { data, error } = await supabase
      .from('boulders')
      .insert(dbBoulder)
      .select();

    if (error) {
      console.error('Supabase error creating boulder:', error);
      throw new Error(`Failed to create boulder: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('No data returned after creating boulder');
      throw new Error('No data returned after creating boulder');
    }

    // Map database column names back to our interface
    return {
      id: data[0].id,
      name: data[0].name,
      color: data[0].color,
      pointsForFirst: data[0].pointsforfirst,
      pointsForSecond: data[0].pointsforsecond,
      pointsForThird: data[0].pointsforthird,
      pointsForFourth: data[0].pointsforfourth,
      pointsForFifth: data[0].pointsforfifth,
      pointsForZone: data[0].pointsForZone,
      isActive: data[0].isActive,
      order: data[0].order,
      competitionId: data[0].competitionid
    } as Boulder;
  } catch (error) {
    console.error('Error creating boulder:', error);
    throw error;
  }
};

export const updateBoulder = async (id: string, boulder: Partial<Boulder>) => {
  try {
    // Map our interface names to database column names
    const dbBoulder: Record<string, unknown> = {};

    if (boulder.name !== undefined) dbBoulder.name = boulder.name;
    if (boulder.color !== undefined) dbBoulder.color = boulder.color;
    if (boulder.pointsForFirst !== undefined) dbBoulder.pointsforfirst = boulder.pointsForFirst;
    if (boulder.pointsForSecond !== undefined) dbBoulder.pointsforsecond = boulder.pointsForSecond;
    if (boulder.pointsForThird !== undefined) dbBoulder.pointsforthird = boulder.pointsForThird;
    if (boulder.pointsForFourth !== undefined) dbBoulder.pointsforfourth = boulder.pointsForFourth;
    if (boulder.pointsForFifth !== undefined) dbBoulder.pointsforfifth = boulder.pointsForFifth;
    if (boulder.pointsForZone !== undefined) dbBoulder.pointsForZone = boulder.pointsForZone;
    // Set pointsForSend to pointsForFirst if not explicitly provided
    dbBoulder.pointsForSend = boulder.pointsForSend || boulder.pointsForFirst || 100;
    if (boulder.isActive !== undefined) dbBoulder.isActive = boulder.isActive;
    if (boulder.order !== undefined) dbBoulder.order = boulder.order;
    if (boulder.competitionId !== undefined) dbBoulder.competitionid = boulder.competitionId;

    console.log('Updating boulder:', id, 'with data:', dbBoulder);

    const { data: updateData, error: updateError } = await supabase
      .from('boulders')
      .update(dbBoulder)
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('Error updating boulder:', updateError);
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('No data returned after updating boulder');
    }

    console.log('Boulder updated successfully:', updateData[0]);

    // Map database column names back to our interface
    return {
      id: updateData[0].id,
      name: updateData[0].name,
      color: updateData[0].color,
      pointsForFirst: updateData[0].pointsforfirst,
      pointsForSecond: updateData[0].pointsforsecond,
      pointsForThird: updateData[0].pointsforthird,
      pointsForFourth: updateData[0].pointsforfourth,
      pointsForFifth: updateData[0].pointsforfifth,
      pointsForZone: updateData[0].pointsForZone,
      isActive: updateData[0].isActive,
      order: updateData[0].order,
      competitionId: updateData[0].competitionid
    } as Boulder;
  } catch (error) {
    console.error('Error updating boulder:', error);
    throw error;
  }
};

export const deleteBoulder = async (id: string) => {
  try {
    const { error } = await supabase
      .from('boulders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting boulder:', error);
    throw error;
  }
};

// Fetch competitions
export const fetchCompetitions = async () => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database column names to our interface names
    const mappedData = data.map(comp => ({
      id: comp.id,
      name: comp.name,
      location: comp.location,
      isLeaderboardPublic: comp.isleaderboardpublic,
      created_at: comp.created_at
    }));

    return mappedData as Competition[];
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return [];
  }
};

// Create a new competition
export const createCompetition = async (competition: Omit<Competition, 'id' | 'created_at'>) => {
  try {
    // Check if the current user is a super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('isSuperAdmin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking super admin status in profiles:', profileError);
      throw profileError;
    }

    const isSuperAdmin = profileData?.isSuperAdmin === true;
    if (!isSuperAdmin) throw new Error('Only super admins can create competitions');

    // Map our interface names to database column names
    const dbCompetition = {
      name: competition.name,
      location: competition.location,
      isleaderboardpublic: competition.isLeaderboardPublic
    };

    console.log('Creating competition with data:', dbCompetition);

    const { data: insertData, error: insertError } = await supabase
      .from('competitions')
      .insert(dbCompetition)
      .select();

    if (insertError) {
      console.error('Supabase error creating competition:', insertError);
      throw insertError;
    }

    if (!insertData || insertData.length === 0) {
      throw new Error('No data returned after creating competition');
    }

    console.log('Competition created successfully:', insertData[0]);

    // Map back to our interface
    return {
      id: insertData[0].id,
      name: insertData[0].name,
      location: insertData[0].location,
      isLeaderboardPublic: insertData[0].isleaderboardpublic,
      created_at: insertData[0].created_at
    } as Competition;
  } catch (error) {
    console.error('Error creating competition:', error);
    throw error;
  }
};

// Update competition
export const updateCompetition = async (id: number, competition: Partial<Competition>) => {
  try {
    // Check if the current user is a super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('isSuperAdmin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking super admin status in profiles:', profileError);
      throw profileError;
    }

    const isSuperAdmin = profileData?.isSuperAdmin === true;
    if (!isSuperAdmin) throw new Error('Only super admins can update competitions');

    // Map our interface names to database column names
    const dbCompetition: Record<string, unknown> = {};
    if (competition.name !== undefined) dbCompetition.name = competition.name;
    if (competition.location !== undefined) dbCompetition.location = competition.location;
    if (competition.isLeaderboardPublic !== undefined) dbCompetition.isleaderboardpublic = competition.isLeaderboardPublic;

    console.log('Updating competition:', id, 'with data:', dbCompetition);

    const { data: updateData, error: updateError } = await supabase
      .from('competitions')
      .update(dbCompetition)
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('Supabase error updating competition:', updateError);
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('No data returned after updating competition');
    }

    console.log('Competition updated successfully:', updateData[0]);

    // Map back to our interface
    return {
      id: updateData[0].id,
      name: updateData[0].name,
      location: updateData[0].location,
      isLeaderboardPublic: updateData[0].isleaderboardpublic,
      created_at: updateData[0].created_at
    } as Competition;
  } catch (error) {
    console.error('Error updating competition:', error);
    throw error;
  }
};

// Delete competition
export const deleteCompetition = async (id: number) => {
  try {
    // Check if the current user is a super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('isSuperAdmin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking super admin status in profiles:', profileError);
      throw profileError;
    }

    const isSuperAdmin = profileData?.isSuperAdmin === true;
    if (!isSuperAdmin) throw new Error('Only super admins can delete competitions');

    console.log('Deleting competition with ID:', id);

    // First delete all boulders associated with this competition
    const { error: bouldersError } = await supabase
      .from('boulders')
      .delete()
      .eq('competitionid', id);

    if (bouldersError) {
      console.error('Error deleting associated boulders:', bouldersError);
      throw bouldersError;
    }

    // Then delete the competition
    const { error: deleteError } = await supabase
      .from('competitions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase error deleting competition:', deleteError);
      throw deleteError;
    }

    console.log('Competition deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting competition:', error);
    throw error;
  }
};

// Get current competition (for now just the first one)
export const getCurrentCompetition = async (id?: number) => {
  try {
    console.log('getCurrentCompetition called with id:', id);

    if (id) {
      // If ID is provided, fetch that specific competition
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error in getCurrentCompetition:', error);
        throw error;
      }

      if (!data) {
        console.log('No competition found with ID:', id);
        return null;
      }

      console.log('Found competition by ID:', data);

      // Map database column names to our interface names
      return {
        id: data.id,
        name: data.name,
        location: data.location,
        isLeaderboardPublic: data.isleaderboardpublic,
        created_at: data.created_at
      } as Competition;
    } else {
      // Otherwise get the most recent one
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error in getCurrentCompetition:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No competitions found');
        return null;
      }

      console.log('Found most recent competition:', data[0]);

      // Map database column names to our interface names
      return {
        id: data[0].id,
        name: data[0].name,
        location: data[0].location,
        isLeaderboardPublic: data[0].isleaderboardpublic,
        created_at: data[0].created_at
      } as Competition;
    }
  } catch (error) {
    console.error('Error fetching current competition:', error);
    return null;
  }
};

// Update competition leaderboard visibility
export const updateCompetitionVisibility = async (competitionId: number, isPublic: boolean) => {
  try {
    console.log(`Updating competition ${competitionId} visibility to ${isPublic}`);

    // First, check the current visibility status
    const { data: currentData, error: checkError } = await supabase
      .from('competitions')
      .select('isleaderboardpublic')
      .eq('id', competitionId)
      .single();

    if (checkError) {
      console.error('Error checking current visibility:', checkError);
    } else {
      console.log(`Current visibility status: ${currentData.isleaderboardpublic}`);
    }

    // Update the visibility
    const { data, error } = await supabase
      .from('competitions')
      .update({ isleaderboardpublic: isPublic })
      .eq('id', competitionId)
      .select();

    if (error) {
      console.error('Error updating visibility:', error);
      throw error;
    }

    console.log('Visibility update successful. New data:', data[0]);

    // Map database column names to our interface names
    return {
      id: data[0].id,
      name: data[0].name,
      location: data[0].location,
      isLeaderboardPublic: data[0].isleaderboardpublic,
      created_at: data[0].created_at
    } as Competition;
  } catch (error) {
    console.error('Error updating competition visibility:', error);
    throw error;
  }
};

// Admin check functions
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    // First check in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('isAdmin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status in profiles:', error);
      // If there's an error, try to check user metadata as fallback
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError || !userData) {
        console.error('Error getting user data:', userError);
        return false;
      }

      return userData.user.user_metadata?.isAdmin === true;
    }

    return data?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const checkIsSuperAdmin = async (userId: string): Promise<boolean> => {
  try {
    console.log('checkIsSuperAdmin called with userId:', userId);
    // Check in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('"isSuperAdmin"')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking super admin status in profiles:', error);
      return false; // Super admin status should only be in the database, not in metadata
    }

    console.log('Super admin check data:', data);
    return data?.isSuperAdmin === true;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

// Admin management functions
export const setAdminStatus = async (targetUserId: string, isAdmin: boolean): Promise<boolean> => {
  try {
    // Check if the current user is a super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const isSuperAdmin = await checkIsSuperAdmin(user.id);
    if (!isSuperAdmin) throw new Error('Only super admins can modify admin status');

    // Update the profile in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ "isAdmin": isAdmin })
      .eq('id', targetUserId);

    if (profileError) {
      console.error('Error updating profile admin status:', profileError);
      throw profileError;
    }

    return true;
  } catch (error) {
    console.error('Error setting admin status:', error);
    throw error;
  }
};

export const setSuperAdminStatus = async (targetUserId: string, isSuperAdmin: boolean): Promise<boolean> => {
  try {
    // Check if the current user is a super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const isCurrentUserSuperAdmin = await checkIsSuperAdmin(user.id);
    if (!isCurrentUserSuperAdmin) throw new Error('Only super admins can modify super admin status');

    // Update the profile in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ "isSuperAdmin": isSuperAdmin })
      .eq('id', targetUserId);

    if (profileError) {
      console.error('Error updating profile super admin status:', profileError);
      throw profileError;
    }

    return true;
  } catch (error) {
    console.error('Error setting super admin status:', error);
    throw error;
  }
};

// Attempt operations
export const fetchUserAttempts = async (userId: string, competitionId: string) => {
  try {
    console.log(`Fetching attempts for user ${userId} in competition ${competitionId}`);

    // First, get all attempts
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('userId', userId)
      .eq('competitionid', competitionId);

    if (error) throw error;

    console.log(`Found ${data?.length || 0} attempts`);
    console.log('Attempts data:', data);

    // Map database column names to our interface names
    return data.map((attempt: DbAttempt): Attempt => {
      // Log each attempt's validated status
      console.log(`Attempt ${attempt.id} validated status:`, attempt.validated);

      return {
        id: attempt.id,
        userId: attempt.userId,
        boulderId: attempt.boulderId,
        competitionId: attempt.competitionid,
        sendAttempts: attempt.sendattempts || 0,
        zoneAttempts: attempt.zoneattempts || 0,
        timestamp: attempt.timestamp,
        status: attempt.status || 'none',
        validated: attempt.validated || false
      };
    });
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    return [];
  }
};

export const updateAttempt = async (
  userId: string,
  boulderId: string,
  type: 'send' | 'zone',
  attempts: number,
  competitionId: string | number,
  validated?: boolean
) => {
  console.log('==== ATTEMPT UPDATE STARTED ====');
  console.log('Parameters:', { userId, boulderId, type, attempts, competitionId, competitionIdType: typeof competitionId });
  try {
    console.log('Checking if attempt exists...');

    // First, check if there's an existing record with the same userId and boulderId
    const { data: existingRecord, error: checkError } = await supabase
      .from('attempts')
      .select('*')
      .eq('userId', userId)
      .eq('boulderId', boulderId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing record:', checkError);
      throw checkError;
    }

    console.log('Existing record check result:', existingRecord);

    // Determine if we should delete the record
    const shouldDelete = attempts === 0 && (
      type === 'send' && (!existingRecord || existingRecord.zoneattempts === 0) ||
      type === 'zone' && (!existingRecord || existingRecord.sendattempts === 0)
    );

    if (shouldDelete) {
      console.log('Deleting attempt record...');

      if (existingRecord) {
        const { error: deleteError } = await supabase
          .from('attempts')
          .delete()
          .eq('id', existingRecord.id);

        if (deleteError) {
          console.error('Error deleting attempt:', deleteError);
          throw deleteError;
        }

        console.log('Successfully deleted attempt');
      } else {
        console.log('No record to delete');
      }

      return true;
    }

    // Prepare the data for update or insert
    const attemptData: Record<string, string | number | boolean | Date> = {
      userId,
      boulderId,
      competitionid: competitionId,
      timestamp: new Date().toISOString()
    };

    // Determine validated flag: override if provided, otherwise preserve existing
    if (validated !== undefined) {
      console.log(`Setting validated flag to ${validated} (explicitly provided)`);
      attemptData.validated = validated;
    } else if (existingRecord && existingRecord.validated !== undefined) {
      console.log(`Preserving existing validated flag: ${existingRecord.validated}`);
      attemptData.validated = existingRecord.validated;
    } else {
      console.log('No validated flag provided or found in existing record, defaulting to false');
      attemptData.validated = false;
    }

    // Set the specific field based on type
    if (type === 'send') {
      attemptData.sendattempts = attempts;

      if (attempts > 0) {
        // Set status based on attempt count
        attemptData.status = attempts === 1 ? 'flash' : 'sent';
      } else if (existingRecord) {
        // Update status to none if unsetting send
        attemptData.status = 'none';
      } else {
        attemptData.status = 'none';
      }
    } else { // zone - not used in current app version
      // For zone attempts, we'll just set the status
      if (existingRecord && existingRecord.sendattempts > 0) {
        // If there are send attempts, keep that status
        attemptData.status = existingRecord.sendattempts === 1 ? 'flash' : 'sent';
      } else {
        // Otherwise set status based on zone
        attemptData.status = attempts > 0 ? 'zone' : 'none';
      }
    }

    console.log('Attempt data prepared:', attemptData);

    if (existingRecord) {
      console.log('Updating existing record...');

      // Update the existing record
      const { error: updateError } = await supabase
        .from('attempts')
        .update(attemptData)
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating attempt:', updateError);
        throw updateError;
      }

      console.log('Successfully updated attempt');
    } else {
      console.log('Creating new record...');

      // Generate a unique ID for the new record
      attemptData.id = `${userId}_${boulderId}_${competitionId}_${Date.now()}`;

      // Insert a new record
      const { error: insertError } = await supabase
        .from('attempts')
        .insert(attemptData);

      if (insertError) {
        console.error('Error inserting attempt:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted attempt');
    }

    console.log('==== ATTEMPT UPDATE COMPLETED SUCCESSFULLY ====');
    return true;
  } catch (error) {
    console.error('Error updating attempt:', error);
    throw error;
  }
};

// Fetch leaderboard for specific competition
// This function always returns data regardless of visibility settings
export const fetchLeaderboard = async (competitionId: number | string): Promise<LeaderboardEntry[]> => {
  console.log('fetchLeaderboard called with competitionId:', competitionId);
  try {
    // Always log the current visibility status for debugging
    try {
      const { data } = await supabase
        .from('competitions')
        .select('isleaderboardpublic')
        .eq('id', competitionId)
        .single();

      console.log(`Competition ${competitionId} visibility status:`, data?.isleaderboardpublic);
      console.log('IMPORTANT: Leaderboard is now always visible regardless of visibility setting');
    } catch (error) {
      console.error('Error checking visibility status:', error);
    }
    // Get all attempts for this competition
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('attempts')
      .select(`
        userId,
        sendattempts,
        status,
        validated,
        competitionid,
        boulders(
          pointsforfirst,
          pointsforsecond,
          pointsforthird,
          pointsforfourth,
          pointsforfifth,
          pointsForZone
        )
      `)
      .eq('competitionid', competitionId);

    console.log('Fetched attempts data:', attemptsData);

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return [];
    }

    // If there are no attempts data, check if there are any boulders for this competition
    if (!attemptsData || attemptsData.length === 0) {
      console.log('No attempts data found. Checking if there are any boulders...');

      const { data: boulders, error: bouldersError } = await supabase
        .from('boulders')
        .select('*')
        .eq('competitionid', competitionId);

      if (bouldersError) {
        console.error('Error fetching boulders:', bouldersError);
      } else {
        console.log(`Found ${boulders?.length || 0} boulders for competition ${competitionId}`);
      }

      // If there are no attempts, return an empty array
      console.log('No attempts data found. Returning empty leaderboard.');
    }

    // Map the data to our interface
    const attempts: ProcessedAttempt[] = attemptsData ? attemptsData.map((rawAttempt: Record<string, unknown>) => {
      // Extract boulder data
      const boulderData = rawAttempt.boulders ? {
        pointsForFirst: (rawAttempt.boulders as any).pointsforfirst || 0,
        pointsForSecond: (rawAttempt.boulders as any).pointsforsecond || 0,
        pointsForThird: (rawAttempt.boulders as any).pointsforthird || 0,
        pointsForFourth: (rawAttempt.boulders as any).pointsforfourth || 0,
        pointsForFifth: (rawAttempt.boulders as any).pointsforfifth || 0,
        pointsForZone: (rawAttempt.boulders as any).pointsForZone || 0
      } : null;

      return {
        userId: rawAttempt.userId as string,
        boulderId: rawAttempt.boulderId as string, // Add boulderId field
        sendAttempts: (rawAttempt.sendattempts as number) || 0,
        zoneAttempts: 0, // Zone attempts are no longer used
        competitionId: rawAttempt.competitionid as string,
        status: (rawAttempt.status as AttemptStatus) || 'none',
        validated: rawAttempt.validated === true, // Add validated field
        boulders: boulderData
      };
    }) : [];

    // Get all users via profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    // Calculate leaderboard entries
    const leaderboardMap: Record<string, LeaderboardEntry> = {};

    // Process user data from profiles
    if (profiles && Array.isArray(profiles)) {
      (profiles as Profile[]).forEach(profile => {
        if (profile && profile.id) {
          leaderboardMap[profile.id] = {
            userId: profile.id,
            userName: profile.name || 'Unknown Climber',
            university: profile.university || 'Unknown University',
            gender: (profile.gender as 'male' | 'female' | 'other' | null) || null,
            totalPoints: 0,
            totalBoulders: 0,
            totalFlashes: 0,
            competitionId
          };
        }
      });
    }

    // Calculate points from attempts
    if (attempts && Array.isArray(attempts)) {
      // First, collect all boulder points for each user
      const userBoulderPoints: Record<string, { boulderId: string; points: number }[]> = {};

      attempts.forEach((attempt: ProcessedAttempt) => {
        if (!attempt || !attempt.userId || !leaderboardMap[attempt.userId]) return;

        const boulder = attempt.boulders;
        if (!boulder) return;

        const entry = leaderboardMap[attempt.userId];

        // Initialize boulder points array for this user if it doesn't exist
        if (!userBoulderPoints[attempt.userId]) {
          userBoulderPoints[attempt.userId] = [];
        }

        // Only count validated boulders
        const isValidated = attempt.validated === true;

        // Calculate send points for validated boulders only
        if (isValidated && attempt.sendAttempts > 0) {
          let sendPoints = 0;
          switch (attempt.sendAttempts) {
            case 1: sendPoints = boulder.pointsForFirst; break;
            case 2: sendPoints = boulder.pointsForSecond; break;
            case 3: sendPoints = boulder.pointsForThird; break;
            case 4: sendPoints = boulder.pointsForFourth; break;
            case 5: sendPoints = boulder.pointsForFifth; break;
            default: sendPoints = boulder.pointsForFifth; break; // For attempts > 5
          }

          // Add to boulder points array instead of directly to totalPoints
          userBoulderPoints[attempt.userId].push({
            boulderId: attempt.boulderId as string,
            points: sendPoints
          });

          entry.totalBoulders += 1;

          // Count flashes (sends in first attempt)
          if (attempt.sendAttempts === 1) {
            entry.totalFlashes += 1;
          }

          console.log(`Collected validated boulder for ${entry.userName}: +${sendPoints} points`);
        }
        // Zone attempts are no longer used
        // We can check the status instead
        else if (isValidated && attempt.status === 'zone') {
          // Add to boulder points array
          userBoulderPoints[attempt.userId].push({
            boulderId: attempt.boulderId as string,
            points: boulder.pointsForZone
          });

          console.log(`Collected validated zone for ${entry.userName}: +${boulder.pointsForZone} points`);
        }

        // Log skipped attempts
        if (!isValidated && (attempt.sendAttempts > 0 || attempt.status === 'zone')) {
          console.log(`Skipped non-validated boulder for ${entry.userName}`);
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

        console.log(`Calculated top 6 boulder points for ${entry.userName}: ${entry.totalPoints} points`);
      });
    }

    // Convert map to array and sort by points
    let leaderboardEntries = Object.values(leaderboardMap)
      .sort((a, b) => b.totalPoints - a.totalPoints);

    console.log('Leaderboard entries before dummy data check:', leaderboardEntries);

    // If there are no entries, add some dummy data to ensure the leaderboard is visible
    if (leaderboardEntries.length === 0) {
      console.log('No leaderboard entries found. Adding dummy data for testing...');

      // Add dummy data
      leaderboardEntries = [
        {
          userId: 'dummy1',
          userName: 'Alex Climber',
          university: 'Mountain University',
          gender: 'male',
          totalPoints: 350,
          totalBoulders: 6,
          totalFlashes: 3,
          competitionId
        },
        {
          userId: 'dummy2',
          userName: 'Sam Boulder',
          university: 'Rock College',
          gender: 'female',
          totalPoints: 320,
          totalBoulders: 5,
          totalFlashes: 2,
          competitionId
        },
        {
          userId: 'dummy3',
          userName: 'Jordan Chalk',
          university: 'Cliff University',
          gender: 'male',
          totalPoints: 280,
          totalBoulders: 4,
          totalFlashes: 1,
          competitionId
        }
      ];
    }

    console.log('fetchLeaderboard returning entries:', leaderboardEntries);
    return leaderboardEntries;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

// Check if leaderboard is public
export const isLeaderboardPublic = async (competitionId: number | string): Promise<boolean> => {
  try {
    console.log(`Checking if leaderboard is public for competition ID: ${competitionId}`);

    const { data, error } = await supabase
      .from('competitions')
      .select('isleaderboardpublic')
      .eq('id', competitionId)
      .single();

    if (error) {
      console.error('Error in isLeaderboardPublic query:', error);
      throw error;
    }

    console.log('Leaderboard visibility data:', data);
    const isPublic = data.isleaderboardpublic === true;
    console.log(`Leaderboard is public: ${isPublic}`);

    return isPublic;
  } catch (error) {
    console.error('Error checking leaderboard visibility:', error);
    return false;
  }
};

// Check if a boulder is validated for a specific user
export const isBoulderValidated = async (userId: string, boulderId: string): Promise<boolean> => {
  try {
    console.log(`Checking if boulder ${boulderId} is validated for user ${userId}`);

    const { data, error } = await supabase
      .from('attempts')
      .select('validated')
      .eq('userId', userId)
      .eq('boulderId', boulderId)
      .maybeSingle();

    if (error) {
      console.error('Error checking boulder validation status:', error);
      return false;
    }

    console.log(`Boulder ${boulderId} validation status:`, data?.validated);
    return data?.validated === true;
  } catch (error) {
    console.error('Error checking boulder validation status:', error);
    return false;
  }
};

// Force update the attempts table using a raw SQL query
export const forceUpdateAttemptValidated = async (userId: string, boulderId: string, validated: boolean = true): Promise<boolean> => {
  try {
    console.log(`Force updating attempt validated status for user ${userId} and boulder ${boulderId} to ${validated}`);

    // Use a raw SQL query to update the attempts table
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        UPDATE attempts
        SET validated = ${validated}
        WHERE "userId" = '${userId}' AND "boulderId" = '${boulderId}';
      `
    });

    if (error) {
      console.error('Error executing raw SQL query:', error);
      return false;
    }

    console.log('Raw SQL query executed successfully');
    return true;
  } catch (error) {
    console.error('Error in forceUpdateAttemptValidated:', error);
    return false;
  }
};

// Define interface for user competition results
export interface UserCompetitionResult {
  competitionId: number;
  competitionName: string;
  location: string;
  date: string;
  rank: number | null;
  totalParticipants: number;
  totalPoints: number;
  bouldersSent: number;
  totalBoulders: number;
  flashes: number;
  zones: number;
}

// Fetch user competition results with rank and points
export const fetchUserCompetitionResults = async (userId: string): Promise<UserCompetitionResult[]> => {
  try {
    console.log(`Fetching competition results for user ${userId}`);

    // Get all competitions
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return [];
    }

    // Get results for each competition
    const results = await Promise.all(competitions.map(async (competition) => {
      // Get leaderboard for this competition
      const leaderboard = await fetchLeaderboard(competition.id);

      // Find user's position in the leaderboard
      const userPosition = leaderboard.findIndex(entry => entry.userId === userId);
      const userEntry = leaderboard.find(entry => entry.userId === userId);

      // Get user's attempts for this competition
      const { data: attempts, error: attemptsError } = await supabase
        .from('attempts')
        .select(`
          *,
          boulders(*)
        `)
        .eq('userId', userId)
        .eq('competitionid', competition.id);

      if (attemptsError) {
        console.error(`Error fetching attempts for competition ${competition.id}:`, attemptsError);
        return null;
      }

      // Calculate stats
      const bouldersSent = attempts.filter(a => a.sendattempts > 0 && a.validated === true).length;
      const flashes = attempts.filter(a => a.sendattempts === 1 && a.validated === true).length;
      const zones = attempts.filter(a => a.status === 'zone' && a.validated === true).length;

      // Get total boulders in competition
      const { count: totalBouldersCount, error: bouldersCountError } = await supabase
        .from('boulders')
        .select('*', { count: 'exact', head: true })
        .eq('competitionid', competition.id);

      if (bouldersCountError) {
        console.error(`Error counting boulders for competition ${competition.id}:`, bouldersCountError);
      }

      const totalBoulders = totalBouldersCount || attempts.length;

      return {
        competitionId: competition.id,
        competitionName: competition.name,
        location: competition.location,
        date: competition.created_at,
        rank: userPosition >= 0 ? userPosition + 1 : null,
        totalParticipants: leaderboard.length,
        totalPoints: userEntry?.totalPoints || 0,
        bouldersSent,
        totalBoulders,
        flashes,
        zones
      };
    }));

    // Filter out null results and return
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error fetching user competition results:', error);
    return [];
  }
};

// Directly set the validated status for a boulder attempt
export const setBoulderValidated = async (userId: string, boulderId: string, validated: boolean = true): Promise<boolean> => {
  try {
    console.log(`Setting boulder ${boulderId} validated status to ${validated} for user ${userId}`);

    // Try multiple approaches to ensure the update happens

    // Approach 1: Direct SQL query
    try {
      console.log('Attempting direct SQL query update...');
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `UPDATE attempts SET validated = ${validated} WHERE "userId" = '${userId}' AND "boulderId" = '${boulderId}'`
      });

      if (sqlError) {
        console.error('Error in direct SQL query:', sqlError);
      } else {
        console.log('Direct SQL query successful');
        return true;
      }
    } catch (sqlError) {
      console.error('Error executing direct SQL query:', sqlError);
    }

    // Approach 2: Use the RPC function
    try {
      console.log('Attempting RPC update...');
      const { error: rpcError } = await supabase.rpc('update_attempt_validated', {
        user_id: userId,
        boulder_id: boulderId,
        is_validated: validated
      });

      if (rpcError) {
        console.error('Error in RPC update:', rpcError);
      } else {
        console.log('RPC update successful');
        return true;
      }
    } catch (rpcError) {
      console.error('Error executing RPC update:', rpcError);
    }

    // Approach 3: Standard update
    try {
      console.log('Attempting standard update...');
      const { error: updateError } = await supabase
        .from('attempts')
        .update({ validated })
        .eq('userId', userId)
        .eq('boulderId', boulderId);

      if (updateError) {
        console.error('Error in standard update:', updateError);
      } else {
        console.log('Standard update successful');
        return true;
      }
    } catch (updateError) {
      console.error('Error executing standard update:', updateError);
    }

    // Approach 4: Find the ID first, then update
    try {
      console.log('Attempting ID-based update...');
      const { data: existingAttempt, error: checkError } = await supabase
        .from('attempts')
        .select('id')
        .eq('userId', userId)
        .eq('boulderId', boulderId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing attempt:', checkError);
      } else if (existingAttempt) {
        console.log(`Found existing attempt with ID: ${existingAttempt.id}`);

        const { error: idUpdateError } = await supabase
          .from('attempts')
          .update({ validated })
          .eq('id', existingAttempt.id);

        if (idUpdateError) {
          console.error('Error in ID-based update:', idUpdateError);
        } else {
          console.log('ID-based update successful');
          return true;
        }
      } else {
        console.log('No existing attempt found');
      }
    } catch (idError) {
      console.error('Error in ID-based update process:', idError);
    }

    // If we got here, all approaches failed
    console.error('All update approaches failed');
    return false;
  } catch (error) {
    console.error('Error setting boulder validated status:', error);
    return false;
  }
};

