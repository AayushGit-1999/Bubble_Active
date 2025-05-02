import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { LogIn, UserPlus } from 'lucide-react';
import frame10 from '../Assets/Frame 10.png';
import bgImage from '../Assets/2cd25f408f43a8f2c47a487dd0f2b65b.png';

interface MinecraftAuthPageProps {
  mode?: 'login' | 'signup';
}

const MinecraftAuthPage: React.FC<MinecraftAuthPageProps> = ({ mode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isSignIn, setIsSignIn] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParam = searchParams.get('redirect_url');
    if (urlParam) {
      localStorage.setItem('auth_redirect_url', urlParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsSignIn(mode === 'login');
  }, [mode]);

  const generateSessionId = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const saveUserToMongo = async (
    uid: string,
    email: string,
    tokenId: string,
    provider?: string
  ) => {
    const sessionId = generateSessionId();
    const userAgent = navigator.userAgent;

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({
        firebaseUid: uid,
        email,
        password: provider ? `${provider}-auth-user` : password,
        tokenId,
        sessionId,
        provider,
      }),
    });

    if (!response.ok) throw new Error('Failed to save user to MongoDB');
    return sessionId;
  };

  const handleSuccess = async () => {
    const token = await auth.currentUser?.getIdToken();
    const redirectUrl = localStorage.getItem('auth_redirect_url') || '/dashboard';
    const finalUrl = `${redirectUrl}?jwt=${token}`;
    window.location.href = finalUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const userAgent = navigator.userAgent;

    try {
      let userCredential;

      if (isSignIn) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const tokenId = await userCredential.user.getIdToken();

        await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
          },
          body: JSON.stringify({
            email,
            password,
            tokenId,
            sessionId: generateSessionId(),
          }),
        });
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const tokenId = await userCredential.user.getIdToken();
        await saveUserToMongo(userCredential.user.uid, email, tokenId);
      }

      setEmail('');
      setPassword('');
      await handleSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const tokenId = await user.getIdToken();

      await saveUserToMongo(user.uid, user.email ?? '', tokenId, 'google');
      await handleSuccess();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const tokenId = await user.getIdToken();

      await saveUserToMongo(user.uid, user.email ?? '', tokenId, 'apple');
      await handleSuccess();
    } catch (err: any) {
      console.error('Apple sign-in error:', err);
      setError(err.message || 'Apple sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = (mode: 'signin' | 'signup') => {
    setIsSignIn(mode === 'signin');
    setShowForm(true);
    setError('');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        {!showForm ? (
          <div className="bg-gray-900 bg-opacity-80 rounded-[20px] p-8 w-[435px] h-[180px] text-center border-2 border-zinc-700 shadow-xl">
            <div className="mb-6">
              <img src={frame10} alt="Logo" className="h-6 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Minecraft mods, created in a flash</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => toggleForm('signin')}
                className="w-1/2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded shadow-md"
              >
                Sign in
              </button>
              <button
                onClick={() => toggleForm('signup')}
                className="w-1/2 bg-black hover:bg-blue-500 text-white py-2 px-4 rounded shadow-md"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 bg-opacity-85 rounded-lg p-8 w-96 text-center shadow-xl">
            <div className="mb-4">
              <img src={frame10} alt="Logo" className="h-12 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Minecraft mods, created in a flash</p>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              {isSignIn ? 'Sign in to your account' : 'Create a new account'}
            </h2>

            {error && (
              <div className="bg-red-900 text-red-100 px-4 py-3 rounded mb-4 text-sm border border-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-2 px-4 rounded hover:bg-gray-100 shadow-md"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
              </button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 rounded text-white shadow-md ${
                  isSignIn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : (
                  <>
                    {isSignIn ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isSignIn ? 'Sign in with Email' : 'Sign up with Email'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-sm text-blue-400">
              <button onClick={() => setIsSignIn(!isSignIn)}>
                {isSignIn ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              <button onClick={() => setShowForm(false)}>Back to main screen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinecraftAuthPage;
