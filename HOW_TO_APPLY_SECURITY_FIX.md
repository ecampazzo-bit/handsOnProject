# How to Apply the Security Fix

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx
   - Navigate to SQL Editor

2. **Backup First** (Recommended)
   - Go to Database → Backups
   - Create a manual backup before making changes

3. **Apply the Fix**
   - Open the file `fix_security_rls_policies.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify the Fix**
   - After running, scroll to the bottom of the script
   - Run the verification queries provided
   - All tables should show `rls_enabled = true`

5. **Check Security Advisor**
   - Go to Settings → Security Advisor
   - The 18 errors should now be resolved

## What the Script Does

- ✅ Enables RLS on 20 tables that were missing it
- ✅ Creates appropriate security policies for each table
- ✅ Ensures users can only access data they're authorized for
- ✅ Prevents unauthorized read/write/delete operations

## Testing After Applying

Test these key flows:

1. **Client Flow**
   - Create a service request
   - View your requests
   - Accept/reject quotes
   - View your jobs
   - Rate a prestador

2. **Prestador Flow**
   - View available requests
   - Create quotes
   - View your jobs
   - Update job status
   - Manage your profile/services

3. **Search Functionality**
   - Search for prestadores
   - View prestador profiles
   - View ratings and reviews

## If Something Breaks

If you encounter issues after applying:

1. **Check Error Messages**
   - Look for specific table/operation errors
   - Note which policies might be too restrictive

2. **Adjust Policies**
   - You can modify individual policies in Supabase Dashboard
   - Go to Authentication → Policies
   - Edit the specific policy that's causing issues

3. **Rollback if Needed**
   - Restore from backup if necessary
   - Or disable RLS temporarily: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

## Common Issues

### "Permission denied" errors
- **Cause**: Policy is too restrictive
- **Fix**: Review the policy and adjust the `using` clause

### Can't insert/update data
- **Cause**: Missing INSERT/UPDATE policy
- **Fix**: Add appropriate policy for the operation

### Search not working
- **Cause**: SELECT policy too restrictive
- **Fix**: Allow authenticated users to read (for search)

## Need Help?

- Review `SECURITY_FIX_SUMMARY.md` for detailed policy explanations
- Check Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Test policies in SQL Editor before applying to production

## Important Notes

⚠️ **Some operations require Service Role**:
- Payment operations
- Coupon management
- System configuration
- Notification creation

These should be handled server-side using the Service Role key, not from the client.
