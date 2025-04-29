import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Schema for creating a staff user
const createStaffUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

// Schema for removing a staff user
const removeStaffUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
});

// Log the schema for debugging
console.log('removeStaffUserSchema:', removeStaffUserSchema);

// Create staff user server function
export const createStaffUserFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof createStaffUserSchema>) => createStaffUserSchema.parse(data))
  .handler(async (ctx) => {
    const { firstName, lastName, email, role } = ctx.data;
    const supabase = createServerClient();

    console.log(
      `Received request to create staff user: ${email}, ${firstName} ${lastName}, role: ${role}`
    );

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Unauthorized: No active session');
    }

    // Check if the current user is an admin or super admin
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single();

    if (currentUserError) {
      console.error(`Error checking current user role: ${currentUserError.message}`);
      throw new Error(`Error checking user role: ${currentUserError.message}`);
    }

    // Get the role ID for the role to be assigned
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      console.error(`Error fetching role '${role}': ${roleError?.message || 'Role not found'}`);
      throw new Error(`Error fetching role: ${roleError?.message || 'Role not found'}`);
    }

    console.log(`Retrieved role ID for '${role}': ${roleData.id}`);

    // Check if the current user is a super admin if trying to create a super admin
    const isSuperAdmin =
      currentUserData.role_id ===
      (await supabase.from('roles').select('id').eq('name', 'super_admin').single()).data?.id;

    if (role === 'super_admin' && !isSuperAdmin) {
      throw new Error('Unauthorized: Only super admins can create super admin users');
    }

    // Create the user with admin auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        is_staff: true,
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (userError) {
      console.error(`Error creating user ${email}: ${userError.message}`);
      throw new Error(`Error creating user: ${userError.message}`);
    }

    const userId = userData.user.id;
    console.log(`Successfully created user ID: ${userId}`);

    // Upsert the user in the user_profiles table
    const { error: upsertError } = await supabase.from('user_profiles').upsert(
      {
        id: userId,
        first_name: firstName,
        surname: lastName,
        full_name: `${firstName} ${lastName}`,
        email: email,
        is_active: true,
        role_id: roleData.id,
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error(
        `Error upserting user ${userId} to user_profiles table: ${upsertError.message}`
      );
      throw new Error(`Error upserting user to user_profiles: ${upsertError.message}`);
    }

    console.log(`Successfully upserted user ${userId} to user_profiles table`);

    return { success: true, message: 'User created successfully', userId };
  });

// Remove staff user server function
export const removeStaffUserFn = createServerFn({ method: 'POST' })
  .validator((data: { user_id: string }) => {
    console.log('Validating data in removeStaffUserFn:', data);
    return { user_id: data.user_id };
  })
  .handler(async (ctx) => {
    console.log('Handler received data:', ctx.data);

    // Extract user_id from the data
    const { user_id } = ctx.data;
    console.log('User ID to delete:', user_id);

    const supabase = createServerClient();

    console.log(`Received request to delete user: ${user_id}`);

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Unauthorized: No active session');
    }

    // Check if the current user is an admin or super admin
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single();

    if (currentUserError) {
      console.error(`Error checking current user role: ${currentUserError.message}`);
      throw new Error(`Error checking user role: ${currentUserError.message}`);
    }

    // Get the role of the user to be deleted
    const { data: userToDeleteData, error: userToDeleteError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', user_id)
      .single();

    if (userToDeleteError) {
      console.error(`Error fetching user to delete: ${userToDeleteError.message}`);
      throw new Error(`Error fetching user to delete: ${userToDeleteError.message}`);
    }

    // Check if the current user is a super admin if trying to delete a super admin
    const { data: superAdminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    const isSuperAdmin = currentUserData.role_id === superAdminRole?.id;
    const isUserToDeleteSuperAdmin = userToDeleteData.role_id === superAdminRole?.id;

    if (isUserToDeleteSuperAdmin && !isSuperAdmin) {
      throw new Error('Unauthorized: Only super admins can delete super admin users');
    }

    try {
      // First, delete the user from auth.users
      // This will cascade delete from user_profiles due to foreign key constraints
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user_id);

      if (deleteAuthError) {
        console.error(`Error deleting user ${user_id} from auth.users: ${deleteAuthError.message}`);
        throw new Error(`Error deleting user from auth.users: ${deleteAuthError.message}`);
      }

      console.log(`Successfully deleted user ID: ${user_id} from auth.users`);

      return { success: true, message: 'User deleted successfully' };
    } catch (error: any) {
      console.error(`Error deleting user: ${error.message}`);
      throw new Error(`Error deleting user: ${error.message}`);
    }
  });
