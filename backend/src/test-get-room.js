const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

const roomId = 'e09cfbc2-e2e3-487a-9b61-d81197a89632';
const userId = 'c8a50b10-1da4-4662-884f-12d22c424710'; // User ID for mahreen1

async function test() {
  console.log(`Checking room details for room ${roomId} and user ${userId}...`);
  try {
    const start = Date.now();
    
    // 1. Verify user is member of the room
    console.log('1. Querying room_members...');
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('Membership check failed:', membershipError);
      return;
    }
    console.log('   Membership role:', membership ? membership.role : 'None');

    // 2. Fetch room details
    console.log('2. Querying rooms...');
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError) {
      console.error('Room details query failed:', roomError);
      return;
    }
    console.log('   Room details:', room);

    // 3. Fetch room members (with profiles)
    console.log('3. Querying room_members with profiles...');
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
      console.error('Members fetch failed:', membersError);
      return;
    }
    console.log('   Members list count:', members ? members.length : 0);
    if (members) {
      members.forEach((m, i) => {
        console.log(`     Member ${i+1}:`, m.user ? m.user.username : 'Unknown profile');
      });
    }

    console.log(`All queries finished successfully in ${Date.now() - start}ms`);
  } catch (err) {
    console.error('Exception caught:', err);
  }
}

test();
