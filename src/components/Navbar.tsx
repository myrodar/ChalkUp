
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, Award, User, ChevronDown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/hooks/use-translation';

interface NavbarProps {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  userName?: string;
  onLogout: () => void;
  theme?: 'light' | 'dark';
}

const Navbar = ({ isLoggedIn, isAdmin = false, isSuperAdmin = false, userName, onLogout, theme = 'light' }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Define different styles based on theme
  const navbarStyles = {
    light: "w-full py-4 px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 z-50 transition-all duration-300",
    dark: "w-full py-4 px-6 md:px-8 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/30 fixed top-0 z-50 transition-all duration-300"
  };

  const textStyles = {
    light: "text-foreground/80",
    dark: "text-white/80"
  };

  const hoverStyles = {
    light: "hover:bg-gray-100",
    dark: "hover:bg-slate-800"
  };

  const mobileMenuStyles = {
    light: "bg-white border-gray-200",
    dark: "bg-slate-900 border-slate-800"
  };

  return (
    <nav className={navbarStyles[theme]}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-primary whitespace-nowrap">ChalkUp</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/leaderboard" className={`font-medium transition hover:text-primary ${location.pathname === '/leaderboard' ? 'text-primary' : textStyles[theme]}`}>
            {t('leaderboard')}
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className={`font-medium transition hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary' : textStyles[theme]}`}>
                {t('dashboard')}
              </Link>

              {isAdmin && (
                <Link to="/admin" className={`font-medium transition hover:text-primary ${location.pathname === '/admin' ? 'text-primary' : textStyles[theme]}`}>
                  {t('admin')}
                </Link>
              )}

              {isSuperAdmin && (
                <Link to="/superadmin" className={`font-medium transition hover:text-primary ${location.pathname === '/superadmin' ? 'text-primary' : textStyles[theme]}`}>
                  {t('superAdmin') || 'Super Admin'}
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 px-2">
                    <User size={16} className="mr-1" />
                    {userName || 'Account'}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                  <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate('/profile')}>
                    <User size={16} />
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate('/myresults')}>
                    <Award size={16} />
                    <span>{t('myResults') || 'My Results'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={onLogout}
                  >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate('/auth')} className="animate-scale-in">
              {t('signIn')}
            </Button>
          )}

          {/* Language Switcher in navbar */}
          <LanguageSwitcher />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-4">
          <LanguageSwitcher />
          <button
            className={`p-2 rounded-md ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} ${hoverStyles[theme]}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 ${mobileMenuStyles[theme]} animate-fade-in`}>
          <div className="flex flex-col space-y-2 p-4">
            <Link
              to="/leaderboard"
              className={`px-3 py-2 rounded-md ${hoverStyles[theme]}`}
              onClick={closeMenu}
            >
              {t('leaderboard')}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md ${hoverStyles[theme]}`}
                  onClick={closeMenu}
                >
                  {t('dashboard')}
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md ${hoverStyles[theme]}`}
                    onClick={closeMenu}
                  >
                    {t('admin')}
                  </Link>
                )}

                {isSuperAdmin && (
                  <Link
                    to="/superadmin"
                    className={`px-3 py-2 rounded-md ${hoverStyles[theme]}`}
                    onClick={closeMenu}
                  >
                    {t('superAdmin') || 'Super Admin'}
                  </Link>
                )}

                <Button
                  variant="ghost"
                  className="justify-start px-3"
                  onClick={onLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  {t('logout')}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                navigate('/auth');
                closeMenu();
              }} className="w-full">
                {t('signIn')}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
