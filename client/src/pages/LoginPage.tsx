import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../services/api';
import { loginSuccess, loginFailure } from '../../store/slices/auth.slice';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(username, password);
      dispatch(
        loginSuccess({
          user: response.data.user,
          token: response.data.token,
        })
      );
      navigate('/game');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      dispatch(loginFailure(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            🎮 MMORTS
          </h1>
          <p className="text-gray-300 text-lg">Modern Geopolitics Simulation</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

          {error && (
            <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded transition duration-200"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            <p>
              No account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
