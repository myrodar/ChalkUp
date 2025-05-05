import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations } from '@/types';

// Default translations
const translations: Translations = {
  // General
  dashboard: {
    en: 'Dashboard',
    fr: 'Tableau de bord'
  },
  leaderboard: {
    en: 'Leaderboard',
    fr: 'Classement'
  },
  profile: {
    en: 'Profile',
    fr: 'Profil'
  },
  admin: {
    en: 'Admin',
    fr: 'Administration'
  },
  superAdmin: {
    en: 'Super Admin',
    fr: 'Super Administrateur'
  },
  logout: {
    en: 'Logout',
    fr: 'Déconnexion'
  },
  login: {
    en: 'Login',
    fr: 'Connexion'
  },
  signup: {
    en: 'Sign Up',
    fr: 'S\'inscrire'
  },
  signIn: {
    en: 'Sign In',
    fr: 'Se connecter'
  },
  loading: {
    en: 'Loading...',
    fr: 'Chargement...'
  },
  error: {
    en: 'Error',
    fr: 'Erreur'
  },
  success: {
    en: 'Success',
    fr: 'Succès'
  },
  save: {
    en: 'Save',
    fr: 'Enregistrer'
  },
  cancel: {
    en: 'Cancel',
    fr: 'Annuler'
  },
  delete: {
    en: 'Delete',
    fr: 'Supprimer'
  },
  edit: {
    en: 'Edit',
    fr: 'Modifier'
  },
  search: {
    en: 'Search',
    fr: 'Rechercher'
  },
  filter: {
    en: 'Filter',
    fr: 'Filtrer'
  },
  sort: {
    en: 'Sort',
    fr: 'Trier'
  },
  // Boulder Card
  points: {
    en: 'Points',
    fr: 'Points'
  },
  bestBoulder: {
    en: 'Top 6',
    fr: 'Top 6'
  },
  send: {
    en: 'send',
    fr: 'réussite'
  },
  zone: {
    en: 'zone',
    fr: 'zone'
  },
  sendAttempts: {
    en: 'Send Attempts',
    fr: 'Essais réussis'
  },
  zoneAttempts: {
    en: 'Zone Attempts',
    fr: 'Essais zone'
  },
  pointsEarned: {
    en: 'Points earned',
    fr: 'Points gagnés'
  },
  // Dashboard
  hi: {
    en: 'Hi',
    fr: 'Bonjour'
  },
  trackProgress: {
    en: 'Track your progress and record your climbs below.',
    fr: 'Suivez votre progression et enregistrez vos voies ci-dessous.'
  },
  totalPoints: {
    en: 'Total Points',
    fr: 'Points totaux'
  },
  bouldersSent: {
    en: 'Boulders Sent',
    fr: 'Blocs réussis'
  },
  flashes: {
    en: 'Flashes',
    fr: 'Flash'
  },
  myResults: {
    en: 'My Results',
    fr: 'Mes Résultats'
  },
  trackProgress: {
    en: 'Track your climbing progress and competition results',
    fr: 'Suivez votre progression en escalade et vos résultats de compétition'
  },
  noCompetitionsYet: {
    en: 'No Competition Data Yet',
    fr: 'Pas encore de données de compétition'
  },
  participateToSeeStats: {
    en: 'Participate in competitions to see your statistics and progress.',
    fr: 'Participez à des compétitions pour voir vos statistiques et votre progression.'
  },
  totalCompetitions: {
    en: 'Total Competitions',
    fr: 'Total des compétitions'
  },
  bestRank: {
    en: 'Best Rank',
    fr: 'Meilleur classement'
  },
  completionRate: {
    en: 'Completion Rate',
    fr: 'Taux de réussite'
  },
  overview: {
    en: 'Overview',
    fr: 'Aperçu'
  },
  competitions: {
    en: 'Competitions',
    fr: 'Compétitions'
  },
  progress: {
    en: 'Progress',
    fr: 'Progression'
  },
  pointsHistory: {
    en: 'Points History',
    fr: 'Historique des points'
  },
  pointsHistoryDesc: {
    en: 'Your points across all competitions',
    fr: 'Vos points à travers toutes les compétitions'
  },
  rankHistory: {
    en: 'Rank History',
    fr: 'Historique des classements'
  },
  rankHistoryDesc: {
    en: 'Your ranking position in each competition',
    fr: 'Votre position de classement dans chaque compétition'
  },
  boulderCompletion: {
    en: 'Boulder Completion',
    fr: 'Réussite des blocs'
  },
  boulderCompletionDesc: {
    en: 'Breakdown of your boulder completions by competition',
    fr: 'Répartition de vos réussites de blocs par compétition'
  },
  selectCompetition: {
    en: 'Select Competition',
    fr: 'Sélectionner une compétition'
  },
  viewDetailedStats: {
    en: 'View detailed statistics for a specific competition',
    fr: 'Voir les statistiques détaillées pour une compétition spécifique'
  },
  rank: {
    en: 'Rank',
    fr: 'Classement'
  },
  bouldersSent: {
    en: 'Boulders Sent',
    fr: 'Blocs réussis'
  },
  progressOverTime: {
    en: 'Progress Over Time',
    fr: 'Progression dans le temps'
  },
  progressDesc: {
    en: 'Track your improvement across competitions',
    fr: 'Suivez votre amélioration à travers les compétitions'
  },
  averageRank: {
    en: 'Average Rank',
    fr: 'Classement moyen'
  },
  totalBouldersSent: {
    en: 'Total Boulders Sent',
    fr: 'Total des blocs réussis'
  },
  totalFlashes: {
    en: 'Total Flashes',
    fr: 'Total des flashs'
  },
  improvementRate: {
    en: 'Improvement Rate',
    fr: 'Taux d\'amélioration'
  },
  fromFirstToLast: {
    en: 'From first to last competition',
    fr: 'De la première à la dernière compétition'
  },
  skillBreakdown: {
    en: 'Skill Breakdown',
    fr: 'Analyse des compétences'
  },
  flashRate: {
    en: 'Flash Rate',
    fr: 'Taux de flash'
  },
  rankPercentile: {
    en: 'Rank Percentile',
    fr: 'Percentile de classement'
  },
  sends: {
    en: 'Sends',
    fr: 'Réussites'
  },
  notAttempted: {
    en: 'Not Attempted',
    fr: 'Non tentés'
  },

  // Validation system
  attempts: {
    en: 'Attempts',
    fr: 'Essais'
  },
  requestValidation: {
    en: 'Request Validation',
    fr: 'Demander Validation'
  },
  requestValidationDescription: {
    en: 'Ask another climber to validate your send',
    fr: 'Demandez à un autre grimpeur de valider votre réussite'
  },
  findSomeoneToValidate: {
    en: 'Find someone nearby to validate your climb',
    fr: 'Trouvez quelqu\'un à proximité pour valider votre ascension'
  },
  confirmRequest: {
    en: 'Confirm Request',
    fr: 'Confirmer la Demande'
  },
  validationRequest: {
    en: 'Validation Request',
    fr: 'Demande de Validation'
  },
  validationRequestDescription: {
    en: 'A climber is requesting validation for a boulder',
    fr: 'Un grimpeur demande une validation pour un bloc'
  },
  requestingValidation: {
    en: 'Requesting validation',
    fr: 'Demande de validation'
  },
  validate: {
    en: 'Validate',
    fr: 'Valider'
  },
  reject: {
    en: 'Reject',
    fr: 'Rejeter'
  },
  validationRequestSent: {
    en: 'Validation Request Sent',
    fr: 'Demande de Validation Envoyée'
  },
  waitingForValidation: {
    en: 'Waiting for someone to validate your climb',
    fr: 'En attente de validation de votre ascension'
  },
  validated: {
    en: 'Validated',
    fr: 'Validé'
  },
  validatedBoulder: {
    en: 'Validated Boulder',
    fr: 'Bloc Validé'
  },
  cannotModifyValidatedBoulder: {
    en: 'You cannot modify a boulder that has been validated',
    fr: 'Vous ne pouvez pas modifier un bloc qui a été validé'
  },
  cannotBeModified: {
    en: 'Cannot be modified',
    fr: 'Ne peut pas être modifié'
  },
  validationApproved: {
    en: 'Validation Approved',
    fr: 'Validation Approuvée'
  },
  validationRejected: {
    en: 'Validation Rejected',
    fr: 'Validation Rejetée'
  },
  climbRecorded: {
    en: 'The climb has been recorded',
    fr: 'L\'ascension a été enregistrée'
  },
  validationRejectedDesc: {
    en: 'The validation request has been rejected',
    fr: 'La demande de validation a été rejetée'
  },
  errorCreatingRequest: {
    en: 'Error creating validation request',
    fr: 'Erreur lors de la création de la demande de validation'
  },
  errorRespondingToValidation: {
    en: 'Error responding to validation request',
    fr: 'Erreur lors de la réponse à la demande de validation'
  },
  mustBeLoggedIn: {
    en: 'You must be logged in to request validation',
    fr: 'Vous devez être connecté pour demander une validation'
  },
  scanQrCodeToValidate: {
    en: 'Ask another climber to scan this QR code to validate your send',
    fr: 'Demandez à un autre grimpeur de scanner ce QR code pour valider votre réussite'
  },
  showQrCodeToValidator: {
    en: 'Show this QR code to another climber to validate your send',
    fr: 'Montrez ce QR code à un autre grimpeur pour valider votre réussite'
  },
  scanQrCode: {
    en: 'Scan QR Code',
    fr: 'Scanner le QR Code'
  },
  scanQrCodeDescription: {
    en: 'Scan a climber\'s QR code to validate their send',
    fr: 'Scannez le QR code d\'un grimpeur pour valider sa réussite'
  },
  positionQrCodeInFrame: {
    en: 'Position the QR code within the frame',
    fr: 'Positionnez le QR code dans le cadre'
  },
  invalidQrCode: {
    en: 'Invalid QR Code',
    fr: 'QR Code Invalide'
  },
  qrCodeNotValidation: {
    en: 'This QR code is not a validation request',
    fr: 'Ce QR code n\'est pas une demande de validation'
  },
  qrCodeInvalidFormat: {
    en: 'Invalid QR code format',
    fr: 'Format de QR code invalide'
  },
  confirmValidation: {
    en: 'Confirm Validation',
    fr: 'Confirmer la Validation'
  },
  climber: {
    en: 'Climber',
    fr: 'Grimpeur'
  },
  scanAgain: {
    en: 'Scan Again',
    fr: 'Scanner à Nouveau'
  },
  switchCamera: {
    en: 'Switch Camera',
    fr: 'Changer de Caméra'
  },
  loadingCamera: {
    en: 'Loading camera...',
    fr: 'Chargement de la caméra...'
  },
  cameraAccessError: {
    en: 'Error accessing camera',
    fr: 'Erreur d\'accès à la caméra'
  },
  noCameraFound: {
    en: 'No camera found',
    fr: 'Aucune caméra trouvée'
  },
  qrScannerError: {
    en: 'QR scanner error',
    fr: 'Erreur du scanner QR'
  },
  errorProcessingValidation: {
    en: 'Error processing validation',
    fr: 'Erreur lors du traitement de la validation'
  },
  errorGeneratingQrCode: {
    en: 'Error generating QR code. Please try again.',
    fr: 'Erreur lors de la génération du QR code. Veuillez réessayer.'
  },
  regenerateQrCode: {
    en: 'Regenerate QR Code',
    fr: 'Régénérer le QR Code'
  },
  qrCodeRegenerated: {
    en: 'QR Code Regenerated',
    fr: 'QR Code Régénéré'
  },
  newQrCodeGenerated: {
    en: 'A new QR code has been generated',
    fr: 'Un nouveau QR code a été généré'
  },
  errorRegeneratingQrCode: {
    en: 'Error regenerating QR code. Please try again.',
    fr: 'Erreur lors de la régénération du QR code. Veuillez réessayer.'
  },
  validationRequestAlreadyPending: {
    en: 'A validation request is already pending for this boulder',
    fr: 'Une demande de validation est déjà en attente pour ce bloc'
  },
  positionQrCodeInFrame: {
    en: 'Position the QR code within the frame to scan',
    fr: 'Positionnez le QR code dans le cadre pour le scanner'
  },
  cameraNotAvailable: {
    en: 'Camera Not Available',
    fr: 'Caméra Non Disponible'
  },
  cameraPermissionRequired: {
    en: 'Camera permission is required to scan QR codes. Please allow camera access and try again.',
    fr: 'L\'autorisation de la caméra est nécessaire pour scanner les QR codes. Veuillez autoriser l\'accès à la caméra et réessayer.'
  },
  enterQrCodeManually: {
    en: 'Enter QR code data manually',
    fr: 'Entrez les données du QR code manuellement'
  },
  processQrCode: {
    en: 'Process QR Code',
    fr: 'Traiter le QR Code'
  },
  qrCodeManualInstructions: {
    en: 'Paste the JSON data from the QR code above and click Process',
    fr: 'Collez les données JSON du QR code ci-dessus et cliquez sur Traiter'
  },
  sampleQrData: {
    en: 'Sample QR Data',
    fr: 'Exemple de données QR'
  },
  copied: {
    en: 'Copied',
    fr: 'Copié'
  },
  qrDataCopied: {
    en: 'QR data copied to clipboard',
    fr: 'Données QR copiées dans le presse-papiers'
  },
  copyFailed: {
    en: 'Failed to copy to clipboard',
    fr: 'Échec de la copie dans le presse-papiers'
  },
  zones: {
    en: 'Zones',
    fr: 'Zones'
  },
  boulderProblems: {
    en: 'Boulder Problems',
    fr: 'Problèmes de bloc'
  },
  onlyBestSixBoulders: {
    en: 'Only your 6 best boulders count toward your final score',
    fr: 'Seuls vos 6 meilleurs blocs comptent pour votre score final'
  },
  // Leaderboard
  competitionLeaderboard: {
    en: 'Competition Leaderboard',
    fr: 'Classement de la compétition'
  },
  finalist: {
    en: 'Finalist',
    fr: 'Finaliste'
  },
  finalistsCutoff: {
    en: 'Finalists Cutoff',
    fr: 'Limite des finalistes'
  },
  qualifyForFinals: {
    en: 'climbers qualify for the finals',
    fr: 'grimpeurs se qualifient pour les finales'
  },
  perGender: {
    en: 'per gender',
    fr: 'par genre'
  },
  finalists: {
    en: 'Finalists',
    fr: 'Finalistes'
  },
  topSixAdvance: {
    en: 'Top 6 men and top 6 women advance to finals',
    fr: 'Les 6 meilleurs hommes et les 6 meilleures femmes passent en finale'
  },
  allClimbers: {
    en: 'All Climbers',
    fr: 'Tous les Grimpeurs'
  },
  menOnly: {
    en: 'Men',
    fr: 'Hommes'
  },
  womenOnly: {
    en: 'Women',
    fr: 'Femmes'
  },
  seeRanking: {
    en: 'See how climbers are ranking in real-time at the Bloc Shop Comp.',
    fr: 'Voir comment les grimpeurs se classent en temps réel à la compétition Bloc Shop.'
  },
  topClimber: {
    en: 'Top Climber',
    fr: 'Meilleur grimpeur'
  },
  mostActiveUniversity: {
    en: 'Most Active University',
    fr: 'Université la plus active'
  },
  totalParticipants: {
    en: 'Total Participants',
    fr: 'Nombre total de participants'
  },
  climbers: {
    en: 'climbers',
    fr: 'grimpeurs'
  },
  from: {
    en: 'from',
    fr: 'de'
  },
  universities: {
    en: 'universities',
    fr: 'universités'
  },
  // Admin
  leaderboardVisibility: {
    en: 'Leaderboard Visibility',
    fr: 'Visibilité du classement'
  },
  public: {
    en: 'Public',
    fr: 'Public'
  },
  private: {
    en: 'Private (Admin only)',
    fr: 'Privé (Admin uniquement)'
  },
  makePublic: {
    en: 'Make leaderboard public',
    fr: 'Rendre le classement public'
  },
  makePrivate: {
    en: 'Make leaderboard private',
    fr: 'Rendre le classement privé'
  },
  language: {
    en: 'Language',
    fr: 'Langue'
  },
  english: {
    en: 'English',
    fr: 'Anglais'
  },
  french: {
    en: 'French',
    fr: 'Français'
  },
  // Competition
  competition: {
    en: 'Competition',
    fr: 'Compétition'
  },
  competitionName: {
    en: 'Competition Name',
    fr: 'Nom de la compétition'
  },
  competitionLocation: {
    en: 'Location',
    fr: 'Lieu'
  },
  competitionDate: {
    en: 'Date',
    fr: 'Date'
  },
  competitionStatus: {
    en: 'Status',
    fr: 'Statut'
  },
  active: {
    en: 'Active',
    fr: 'Active'
  },
  inactive: {
    en: 'Inactive',
    fr: 'Inactive'
  },
  // User
  userName: {
    en: 'Name',
    fr: 'Nom'
  },
  userEmail: {
    en: 'Email',
    fr: 'Email'
  },
  userUniversity: {
    en: 'University',
    fr: 'Université'
  },
  userGender: {
    en: 'Gender',
    fr: 'Genre'
  },
  // Auth
  emailRequired: {
    en: 'Email is required',
    fr: 'L\'email est requis'
  },
  passwordRequired: {
    en: 'Password is required',
    fr: 'Le mot de passe est requis'
  },
  invalidEmail: {
    en: 'Invalid email address',
    fr: 'Adresse email invalide'
  },
  passwordTooShort: {
    en: 'Password must be at least 6 characters',
    fr: 'Le mot de passe doit contenir au moins 6 caractères'
  },
  passwordsDontMatch: {
    en: 'Passwords do not match',
    fr: 'Les mots de passe ne correspondent pas'
  },

  // Boulder points system
  maxPoints: {
    en: 'Max Points',
    fr: 'Points Maximum'
  },
  maxPointsHelp: {
    en: 'Maximum points for first attempt. Points decrease by 5% per attempt.',
    fr: 'Points maximum pour la première tentative. Les points diminuent de 5% par tentative.'
  },
  maxZonePoints: {
    en: 'Max Zone Points',
    fr: 'Points Maximum pour Zone'
  },
  maxZonePointsHelp: {
    en: 'Points awarded for reaching the zone hold.',
    fr: 'Points attribués pour atteindre la prise de zone.'
  },
  calculatedPoints: {
    en: 'Calculated Points',
    fr: 'Points Calculés'
  },
  firstAttempt: {
    en: '1st attempt',
    fr: '1ère tentative'
  },
  secondAttempt: {
    en: '2nd attempt',
    fr: '2ème tentative'
  },
  thirdAttempt: {
    en: '3rd attempt',
    fr: '3ème tentative'
  },
  fourthAttempt: {
    en: '4th attempt',
    fr: '4ème tentative'
  },
  fifthAttempt: {
    en: '5th attempt',
    fr: '5ème tentative'
  },
  zonePoints: {
    en: 'Zone points',
    fr: 'Points de zone'
  },

  // Landing page
  appTagline: {
    en: 'Climbing Competition Tracker',
    fr: 'Suivi de Compétition d\'Escalade'
  },
  appDescription: {
    en: 'Track your progress, record your climbs, and compete with other climbers in real-time.',
    fr: 'Suivez votre progression, enregistrez vos ascensions et affrontez d\'autres grimpeurs en temps réel.'
  },
  startClimbing: {
    en: 'Start Climbing',
    fr: 'Commencer à Grimper'
  },
  joinCompetition: {
    en: 'Join Competition',
    fr: 'Rejoindre la Compétition'
  },
  viewLeaderboard: {
    en: 'View Leaderboard',
    fr: 'Voir le Classement'
  },
  liveScoring: {
    en: 'Live Scoring',
    fr: 'Notation en Direct'
  },
  liveScoreDescription: {
    en: 'Real-time updates of your scores and rankings as you complete boulder problems.',
    fr: 'Mises à jour en temps réel de vos scores et classements au fur et à mesure que vous complétez les blocs.'
  },
  trackFlashes: {
    en: 'Track Flashes',
    fr: 'Suivre les Flashs'
  },
  trackFlashesDescription: {
    en: 'Log your flashes, sends and zones to maximize your competition score.',
    fr: 'Enregistrez vos flashs, réussites et zones pour maximiser votre score de compétition.'
  },
  universityRanking: {
    en: 'University Ranking',
    fr: 'Classement Universitaire'
  },
  universityRankingDescription: {
    en: 'Represent your university and see how your school ranks against the competition.',
    fr: 'Représentez votre université et voyez comment votre école se classe face à la compétition.'
  },
  participatingClubs: {
    en: 'Participating Clubs',
    fr: 'Clubs Participants'
  },
  moreDetails: {
    en: 'More Details',
    fr: 'Plus de Détails'
  },
  aboutUs: {
    en: 'About Us',
    fr: 'À Propos de Nous'
  },
  whoDeveloped: {
    en: 'Who developed this?',
    fr: 'Qui a développé ceci?'
  },
  ourTeam: {
    en: 'Our Team',
    fr: 'Notre Équipe'
  },
  contactUs: {
    en: 'Contact Us',
    fr: 'Contactez-Nous'
  },
  allRightsReserved: {
    en: 'All rights reserved',
    fr: 'Tous droits réservés'
  },

  // Rules page
  competitionRules: {
    en: 'Competition Rules',
    fr: 'Règles de la Compétition'
  },
  rules: {
    en: 'Rules',
    fr: 'Règles'
  },
  scoringSystem: {
    en: 'Scoring System',
    fr: 'Système de Notation'
  },
  schedule: {
    en: 'Schedule',
    fr: 'Horaire'
  },
  switchToEnglish: {
    en: 'Switch to English',
    fr: 'Passer à l\'anglais'
  },
  switchToFrench: {
    en: 'Switch to French',
    fr: 'Passer au français'
  },
  languageChanged: {
    en: 'Language Changed',
    fr: 'Langue Changée'
  },
  switchedToEnglish: {
    en: 'Switched to English',
    fr: 'Passé à l\'anglais'
  },
  switchedToFrench: {
    en: 'Switched to French',
    fr: 'Passé au français'
  },

  // Competition Flow
  competitionFlow: {
    en: 'Competition Flow',
    fr: 'Déroulement de la Compétition'
  },
  competitionSchedule: {
    en: 'Competition Schedule',
    fr: 'Horaire de la Compétition'
  },
  registration: {
    en: 'Registration',
    fr: 'Inscription'
  },
  registrationDescription: {
    en: 'Check in, get your participant package and warm up',
    fr: 'Enregistrez-vous, recevez votre trousse de participant et échauffez-vous'
  },
  qualificationRound: {
    en: 'Qualification Round',
    fr: 'Tour de Qualification'
  },
  qualificationDescription: {
    en: 'Climb as many boulders as you can, your 6 best scores count',
    fr: 'Grimpez autant de blocs que possible, vos 6 meilleurs scores comptent'
  },
  resultsAnnouncement: {
    en: 'Results & Break',
    fr: 'Résultats & Pause'
  },
  resultsDescription: {
    en: 'Finalists announced, time to rest and prepare',
    fr: 'Annonce des finalistes, temps de repos et de préparation'
  },
  technicalMeeting: {
    en: 'Technical Meeting',
    fr: 'Réunion Technique'
  },
  technicalMeetingDescription: {
    en: 'Rules explanation and last-minute information',
    fr: 'Explication des règles et informations de dernière minute'
  },
  isolationOpens: {
    en: 'Isolation Zone Opens',
    fr: 'Ouverture de la Zone d\'Isolation'
  },
  isolationOpensDescription: {
    en: 'Finalists must enter the isolation zone',
    fr: 'Les finalistes doivent entrer dans la zone d\'isolation'
  },
  isolationCloses: {
    en: 'Isolation Zone Closes',
    fr: 'Fermeture de la Zone d\'Isolation'
  },
  isolationClosesDescription: {
    en: 'No more finalists allowed to enter',
    fr: 'Plus aucun finaliste autorisé à entrer'
  },
  finals: {
    en: 'Finals',
    fr: 'Finales'
  },
  finalsDescription: {
    en: 'Top 6 men and women compete on 4 boulder problems',
    fr: 'Les 6 meilleurs hommes et femmes s\'affrontent sur 4 blocs'
  },
  awardsCeremony: {
    en: 'Awards Ceremony',
    fr: 'Cérémonie de Remise des Prix'
  },
  awardsDescription: {
    en: 'Winners announced and prizes awarded',
    fr: 'Annonce des gagnants et remise des prix'
  },

  // Sponsors
  ourSponsors: {
    en: 'Our Sponsors',
    fr: 'Nos Commanditaires'
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

// Get browser language
const getBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('fr') ? 'fr' : 'en';
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  // Get saved language from localStorage or detect browser language
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'fr' || saved === 'en') {
      return saved as Language;
    }
    return getBrowserLanguage();
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function with better error handling
  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    if (!translations[key][language]) {
      console.warn(`Translation missing for language ${language}: ${key}`);
      return translations[key]['en']; // Fallback to English
    }
    return translations[key][language];
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
