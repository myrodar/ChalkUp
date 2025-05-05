// This script runs before the build in Vercel to ensure environment variables are properly set
console.log('Running pre-build script for Vercel deployment...');

// Check if Supabase environment variables are set
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Warning: Supabase environment variables are not set. Using default values from the codebase.');
  
  // Default values are already in the codebase, so we don't need to set them here
  // This is just a warning for deployment logs
}

console.log('Pre-build script completed successfully.');
