const supabase = require('../services/supabaseService');

/**
 * Get current authenticated user profile details.
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      user: req.user,
      profile: profile
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe
};
