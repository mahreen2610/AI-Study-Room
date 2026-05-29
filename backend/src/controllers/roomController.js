const crypto = require('crypto');
const supabase = require('../services/supabaseService');

// Helper to generate 8-character code
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new study room and join as owner.
 */
async function createRoom(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const userId = req.user.id;
    const inviteCode = generateInviteCode();

    // 1. Insert room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        description,
        owner_id: userId,
        invite_code: inviteCode
      })
      .select()
      .single();

    if (roomError) {
      throw roomError;
    }

    // 2. Add owner to room_members
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) {
      // Cleanup created room if member join fails
      await supabase.from('rooms').delete().eq('id', room.id);
      throw memberError;
    }

    res.status(201).json({ ...room, role: 'owner' });
  } catch (error) {
    next(error);
  }
}

/**
 * Join an existing study room using an invite code.
 */
async function joinRoom(req, res, next) {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const userId = req.user.id;

    // 1. Find room by invite code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found with the provided invite code' });
    }

    // 2. Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      return res.status(200).json({ ...room, role: existingMember.role, message: 'Already a member of this room' });
    }

    // 3. Add user to room_members
    const { error: joinError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'member'
      });

    if (joinError) {
      throw joinError;
    }

    res.status(200).json({ ...room, role: 'member' });
  } catch (error) {
    next(error);
  }
}

/**
 * List all study rooms the current user is a member of.
 */
async function listRooms(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: memberships, error } = await supabase
      .from('room_members')
      .select(`
        role,
        joined_at,
        rooms (
          id,
          name,
          description,
          owner_id,
          invite_code,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Format list of rooms
    const rooms = memberships
      .filter(m => m.rooms !== null)
      .map(m => ({
        ...m.rooms,
        role: m.role,
        joined_at: m.joined_at
      }));

    res.status(200).json(rooms);
  } catch (error) {
    next(error);
  }
}

/**
 * Get room details and its members.
 */
async function getRoomDetails(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 1. Verify user is member of the room
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You do not have access to this room' });
    }

    // 2. Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError) {
      throw roomError;
    }

    // 3. Fetch room members (with profiles)
    const { data: members, error: membersError } = await supabase
      .from('room_members')
      .select(`
        role,
        joined_at,
        user:profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('room_id', roomId);

    if (membersError) {
      throw membersError;
    }

    res.status(200).json({
      ...room,
      role: membership.role,
      members: members.map(m => ({
        id: m.user.id,
        username: m.user.username,
        avatar_url: m.user.avatar_url,
        role: m.role,
        joined_at: m.joined_at
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRoom,
  joinRoom,
  listRooms,
  getRoomDetails
};
