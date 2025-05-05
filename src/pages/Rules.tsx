import { useTranslation } from '@/hooks/use-translation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Rules = () => {
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
        <h1 className="text-3xl font-bold mb-6">{t('competitionRules')}</h1>

        {language === 'en' ? (
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Competition Format</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Welcome to the 3rd edition of the University Competition at Bloc Shop.</li>
                <li>25 boulder problems set in order of difficulty; climbers may attempt all 25.</li>
                <li>Each climber has two qualification waves: Wave 1 ends at 2:15 PM, Wave 2 ends at 5:00 PM.</li>
                <li>Only the 6 highest scoring boulders count towards the qualification score.</li>
                <li>Prize draws take place at 1:00 PM (Wave 1) and 4:00 PM (Wave 2); winners should come to the prize table to collect their prize and take a photo.</li>
                <li>Finalist results are announced on Polygrimpe social media and here at 5:30 PM; the isolation zone closes at 5:40 PM.</li>
                <li>The final round follows the IFSC format and starts at 6:30 PM.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Rules and Conduct</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Climbers must start with both hands on the designated start holds (marked by arrows).</li>
                <li>Only the marked holds of the same color can be used for a specific boulder.</li>
                <li>Control the finish hold with both hands to complete a problem.</li>
                <li>Scan the QR codes on the posts to validate each boulder.</li>
                <li>Stay outside crash pads and look before jumping.</li>
                <li>No bleeding on walls, mats, or holds; control any bleeding and inform staff before continuing.</li>
                <li>Climbers must respect other competitors and follow the instructions of the judges.</li>
                <li>Unsportsmanlike conduct may result in disqualification.</li>
                <li>The decision of the chief judge is final.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Competition Schedule</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Prize Draws (Wave 1):</strong> 1:00 PM</li>
                <li><strong>Prize Draws (Wave 2):</strong> 4:00 PM</li>
                <li><strong>Wave 1 Deadline:</strong> 2:15 PM</li>
                <li><strong>Wave 2 Deadline:</strong> 5:00 PM</li>
                <li><strong>Running Order Announcement:</strong> 5:20 PM (ISO at the back of the gym at the spread wall)</li>
                <li><strong>Finalist Announcement:</strong> 5:30 PM</li>
                <li><strong>Isolation Zone Closes:</strong> 5:40 PM</li>
                <li><strong>Final Round:</strong> 6:30 PM</li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Format de la Compétition</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Bienvenue à cette 3e édition 2025 de la Compétition Universitaire chez Bloc Shop.</li>
                <li>25 blocs classés par ordre de difficulté ; les grimpeurs peuvent essayer les 25.</li>
                <li>Deux vagues de qualification : la vague 1 se termine à 14h15, la vague 2 se termine à 17h00.</li>
                <li>Seuls les 6 meilleurs blocs réussis comptent pour le score de qualification.</li>
                <li>Tirages des prix à 13h00 (vague 1) et 16h00 (vague 2) ; les gagnants se présentent à la table des prix pour récupérer leur lot et prendre une photo.</li>
                <li>Annonce des finalistes sur les réseaux sociaux de Polygrimpe et ici même à 17h30 ; la zone d'isolement ferme à 17h40.</li>
                <li>La finale suit le format IFSC et commence à 18h30.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Règles et Conduite</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les grimpeurs doivent commencer avec les deux mains sur les prises de départ (indiquées par des flèches).</li>
                <li>Seules les prises marquées de la même couleur peuvent être utilisées pour un bloc donné.</li>
                <li>Contrôlez la prise de fin avec les deux mains pour réussir un bloc.</li>
                <li>Scannez les codes QR sur les poteaux pour valider chaque bloc.</li>
                <li>Restez à l’extérieur des matelas et regardez avant de sauter.</li>
                <li>Pas le droit de saigner sur le mur, les matelas ou les prises ; contrôlez le saignement et prévenez le staff avant de continuer.</li>
                <li>Les grimpeurs doivent respecter les autres compétiteurs et suivre les instructions des juges.</li>
                <li>Une conduite antisportive peut entraîner une disqualification.</li>
                <li>La décision du juge en chef est définitive.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Horaire de la Compétition</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tirage des prix (vague 1) :</strong> 13h00</li>
                <li><strong>Tirage des prix (vague 2) :</strong> 16h00</li>
                <li><strong>Fin de la vague 1 :</strong> 14h15</li>
                <li><strong>Fin de la vague 2 :</strong> 17h00</li>
                <li><strong>Annonce du running order :</strong> 17h20 (ISO au fond du gym, au spread wall)</li>
                <li><strong>Annonce des finalistes :</strong> 17h30</li>
                <li><strong>Fermeture de l’ISO :</strong> 17h40</li>
                <li><strong>Finale :</strong> 18h30</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rules;
