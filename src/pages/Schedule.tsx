import { useTranslation } from '@/hooks/use-translation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Calendar, Mountain, Flag, Award, Trophy } from 'lucide-react';

const Schedule = () => {
  const { t, language } = useTranslation();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={!!session}
        userName={session?.user?.user_metadata?.name}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
          toast({
            title: t('loggedOut'),
            description: t('loggedOutSuccessfully'),
          });
        }}
      />

      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-10 text-center">{t('competitionSchedule')}</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20 z-0"></div>
            
            {/* Timeline steps */}
            <div className="relative z-10 space-y-16">
              {/* Step 1: Registration */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold">{t('registration')}</h3>
                  <p className="text-muted-foreground mt-2">{t('registrationDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">8:00 AM - 9:00 AM</p>
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 mt-4 md:mt-0 md:text-left">
                  {/* Empty for alignment */}
                </div>
              </div>
              
              {/* Step 2: Technical Meeting */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right order-1 md:order-1 mb-4 md:mb-0 hidden md:block">
                  {/* Empty for alignment */}
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10 order-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 order-3 mt-4 md:mt-0 md:text-left">
                  <h3 className="text-xl font-semibold">{t('technicalMeeting')}</h3>
                  <p className="text-muted-foreground mt-2">{t('technicalMeetingDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">9:15 AM</p>
                </div>
              </div>
              
              {/* Step 3: Qualification Round */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold">{t('qualificationRound')}</h3>
                  <p className="text-muted-foreground mt-2">{t('qualificationDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">10:00 AM - 1:00 PM</p>
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10">
                  <Mountain className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 mt-4 md:mt-0 md:text-left">
                  {/* Empty for alignment */}
                </div>
              </div>
              
              {/* Step 4: Results & Break */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right order-1 md:order-1 mb-4 md:mb-0 hidden md:block">
                  {/* Empty for alignment */}
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10 order-2">
                  <Flag className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 order-3 mt-4 md:mt-0 md:text-left">
                  <h3 className="text-xl font-semibold">{t('resultsAnnouncement')}</h3>
                  <p className="text-muted-foreground mt-2">{t('resultsDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">1:00 PM - 2:30 PM</p>
                </div>
              </div>
              
              {/* Step 5: Isolation Zone Opens */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold">{t('isolationOpens')}</h3>
                  <p className="text-muted-foreground mt-2">{t('isolationOpensDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">2:30 PM</p>
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 mt-4 md:mt-0 md:text-left">
                  {/* Empty for alignment */}
                </div>
              </div>
              
              {/* Step 6: Isolation Zone Closes */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right order-1 md:order-1 mb-4 md:mb-0 hidden md:block">
                  {/* Empty for alignment */}
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10 order-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 order-3 mt-4 md:mt-0 md:text-left">
                  <h3 className="text-xl font-semibold">{t('isolationCloses')}</h3>
                  <p className="text-muted-foreground mt-2">{t('isolationClosesDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">3:00 PM</p>
                </div>
              </div>
              
              {/* Step 7: Finals */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold">{t('finals')}</h3>
                  <p className="text-muted-foreground mt-2">{t('finalsDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">3:30 PM - 5:30 PM</p>
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 mt-4 md:mt-0 md:text-left">
                  {/* Empty for alignment */}
                </div>
              </div>
              
              {/* Step 8: Awards */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 md:text-right order-1 md:order-1 mb-4 md:mb-0 hidden md:block">
                  {/* Empty for alignment */}
                </div>
                <div className="rounded-full w-12 h-12 bg-primary/10 border-4 border-background flex items-center justify-center z-10 order-2">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="md:w-1/2 md:pl-12 order-3 mt-4 md:mt-0 md:text-left">
                  <h3 className="text-xl font-semibold">{t('awardsCeremony')}</h3>
                  <p className="text-muted-foreground mt-2">{t('awardsDescription')}</p>
                  <p className="text-sm font-medium text-primary mt-2">6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Schedule;
