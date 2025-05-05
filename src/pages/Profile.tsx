
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Upload, User, Camera, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserAttempts } from '@/lib/database';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/components/ui/use-toast';

const Profile = () => {
  const { session, loading, currentCompetitionId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Check if user is logged in; if not, redirect
  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  // Form setup
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      gender: '',
      university: ''
    }
  });

  // Query to get user profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile
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

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      form.reset({
        name: profileData.name || '',
        email: session?.user?.email || '',
        gender: profileData.gender || '',
        university: profileData.university || ''
      });
      
      // Set avatar URL if available
      setAvatarUrl(profileData.avatar_url || null);
    }
  }, [profileData, session, form]);

  // Query to get user attempts for points calculation
  const {
    data: userAttempts = [],
    isLoading: isLoadingAttempts,
  } = useQuery({
    queryKey: ['attempts', session?.user?.id, currentCompetitionId],
    queryFn: async () => {
      if (!session?.user?.id || !currentCompetitionId) return [];
      return await fetchUserAttempts(session.user.id, currentCompetitionId);
    },
    enabled: !!session?.user?.id && !!currentCompetitionId
  });

  // Calculate total points from attempts
  const totalPoints = userAttempts.reduce((acc, attempt) => {
    return acc + (attempt.pointsEarned ?? 0);
  }, 0);

  // Handle profile update
  const onSubmit = async (data) => {
    if (!session?.user?.id) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          gender: data.gender,
          university: data.university
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      // Refetch profile data
      refetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle avatar upload
  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', session.user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setAvatarUrl(avatarUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      });
      
      // Refetch profile data
      refetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your avatar.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // If data is still loading, show a spinner
  if (loading || isLoadingProfile || isLoadingAttempts) {
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
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-muted text-4xl">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera size={16} />
                  <span className="sr-only">Upload avatar</span>
                </label>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </div>
              
              <CardTitle className="text-2xl">{userName}</CardTitle>
              <CardDescription className="text-center">
                {session?.user?.email}
                {userProfile.university && (
                  <div className="mt-1 font-medium text-primary">{userProfile.university}</div>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Points</span>
                <span className="font-bold text-xl">{totalPoints}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Boulders Completed</span>
                <span className="font-bold">{userAttempts.filter(a => a.sendAttempts > 0).length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Flashes</span>
                <span className="font-bold">{userAttempts.filter(a => a.sendAttempts === 1).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University</FormLabel>
                        <FormControl>
                          <Input placeholder="Your university" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating Profile
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
