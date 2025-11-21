import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, User, ShoppingCart } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import Cart from "@/components/Cart";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

const Navbar = () => {
  
  const { user, isAuthenticated, logout, updateUser } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {}, updateUser: async () => ({ ok: false }) };
  const { likedProducts } = useLiked();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Edit state for profile fields (moved to a dialog)
  const [editOpen, setEditOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    // keep inputs in sync when user or dropdown opens
    if (user) {
      setEmailInput(user.email || '');
      setPhoneInput(user.phone || '');
      // reset password fields when opening profile
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
    }
  }, [user, showProfile]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
          <img src="/logo1.jpg" alt=""  style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            marginRight: '8px',
          }}/>
              <h1 className="text-3xl md:text-4xl font-brand font-black tracking-wider bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
                MCA Fashion
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Recent Orders (removed from desktop navbar - available in profile dropdown and mobile menu) */}

            {/* Liked Products & Cart - hide entirely on admin pages/users */}
            {!(user?.isAdmin || location.pathname.startsWith('/admin')) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    navigate('/liked');
                  }}
                  className="relative"
                >
                  <Heart className="h-5 w-5" />
                  {likedProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                      {likedProducts.length}
                    </span>
                  )}
                </Button>

                {/* Cart */}
                <Cart />
              </>
            )}


            {/* Account */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                {/* Profile button */}
                <button
                  onClick={() => setShowProfile((s) => !s)}
                  aria-expanded={showProfile}
                  // keep static appearance; show initials inside an outlined circle
                  className="flex items-center gap-3 rounded-full border border-transparent bg-white px-3 py-1 text-sm text-gray-800 focus:outline-none"
                  title={user?.fullName || user?.username || 'Account'}
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary bg-transparent">
                    {user?.username ? user.username.slice(0,2).toUpperCase() : 'U'}
                  </div>
                </button>

                {/* Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-80 max-w-sm rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/5 z-60 border">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold bg-transparent">
                        {user?.username ? user.username.slice(0,2).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user?.fullName || user?.username || 'User'}</div>
                            {user?.role && (
                              <div className="mt-0.5 text-xs font-medium text-gray-500">{user.role}</div>
                            )}
                            <div className="mt-1 text-sm text-gray-600">{user?.email || 'no-email@example.com'}</div>
                            <div className="mt-0.5 text-sm text-gray-600">{user?.phone || '+91 00000 00000'}</div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <button onClick={() => { setShowProfile(false); setEditOpen(true); }} className="rounded-full bg-gray-100 px-3 py-1 text-sm">Edit</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit moved to modal/dialog — nothing inline here */}

                    <div className="mt-4 flex gap-2">
                      <Link to="/recent-orders" className="flex-1 rounded-md bg-secondary/5 border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">My Orders</Link>
                      <button onClick={logout} className="rounded-md border px-3 py-2 text-sm font-medium">Logout</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                  <Link
                    to="/contact"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                  <Link
                    to="/about"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    to="/recent-orders"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Orders
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            {/* Edit dialog - shows the edit form in a separate section/modal */}
            <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (open) setShowProfile(false); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>Update your email, phone, or password.</DialogDescription>
                </DialogHeader>

                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-600">Email</label>
                  <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />

                  <label className="block text-xs font-medium text-gray-600 mt-3">Phone</label>
                  <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />

                  <div className="mt-3">
                    <button type="button" onClick={() => setShowPasswordFields(s => !s)} className="text-sm text-primary underline">{showPasswordFields ? 'Hide password fields' : 'Change password'}</button>
                  </div>

                  {showPasswordFields && (
                    <div className="mt-3 border rounded-md p-3 bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600">Current password</label>
                      <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />

                      <label className="block text-xs font-medium text-gray-600 mt-3">New password</label>
                      <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />

                      <label className="block text-xs font-medium text-gray-600 mt-3">Confirm new password</label>
                      <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                    </div>
                  )}

                  {saveError && <div className="mt-2 text-sm text-red-600">{saveError}</div>}
                </div>

                <DialogFooter>
                  <div className="flex items-center gap-2">
                    <button disabled={saving} onClick={async () => {
                      setSaving(true); setSaveError(null);
                      if (showPasswordFields) {
                        if (!newPassword) {
                          setSaving(false);
                          setSaveError('New password cannot be empty');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setSaving(false);
                          setSaveError('New password and confirm do not match');
                          return;
                        }
                      }

                      const payload = { email: emailInput, phone: phoneInput };
                      if (showPasswordFields) {
                        payload.currentPassword = currentPassword;
                        payload.password = newPassword;
                      }

                      try {
                        const res = await updateUser(payload);
                        setSaving(false);
                        if (!res.ok) {
                          setSaveError(res.message || 'Failed to save');
                        } else {
                          // close dialog on success and reset password fields
                          setEditOpen(false);
                          setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordFields(false);
                        }
                      } catch (err) {
                        setSaving(false);
                        setSaveError(err?.message || 'Failed to save');
                      }
                    }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">{saving ? 'Saving...' : 'Save'}</button>

                    <button disabled={saving} onClick={() => { setEditOpen(false); setEmailInput(user?.email || ''); setPhoneInput(user?.phone || ''); setShowPasswordFields(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;