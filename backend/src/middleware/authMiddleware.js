const supabase = require('../services/supabaseService');

/**
 * Express middleware to verify Supabase JWT and attach user context.
 */
async function authMiddleware(req, res, next) {
  console.log('[AUTH] Checking request authentication...');
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH] Missing or invalid Authorization header format');
      return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
    }

    const token = authHeader.split(' ')[1];
    
    console.log('[AUTH] Token found, verifying with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('[AUTH] Supabase verification error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token: ' + error.message });
    }

    if (!user) {
      console.warn('[AUTH] No user profile returned for token');
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    console.log('[AUTH] Successfully authenticated user:', user.email, `(${user.id})`);
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Unexpected auth middleware exception:', error);
    return res.status(401).json({ error: 'Authentication failed: ' + error.message });
  }
}

module.exports = authMiddleware;

