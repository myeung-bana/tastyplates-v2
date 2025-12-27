# Final Cleanup Steps

After the WordPress migration is complete, follow these steps to finalize the cleanup:

## 1. Remove Unused Dependencies

Run the following command to remove Apollo Client and GraphQL packages:

```bash
npm uninstall @apollo/client @apollo/server @as-integrations/next graphql
```

Or if using yarn:

```bash
yarn remove @apollo/client @apollo/server @as-integrations/next graphql
```

**Expected Bundle Size Reduction:** ~50-70KB

## 2. Update Environment Variables

Remove these from your `.env.local` and `.env.production`:

```bash
# Remove these lines:
NEXT_PUBLIC_WP_API_URL=
NEXT_PUBLIC_WP_GRAPHQL_API_URL=
NEXT_PUBLIC_USE_WP_PROXY=
USE_RESTAURANT_V2_API=
```

## 3. Archive WordPress Documentation

Move WordPress-specific documentation to an archive folder:

```bash
mkdir -p documentation/archived/wordpress
mv documentation/wordpress/* documentation/archived/wordpress/ 2>/dev/null || true
```

Or keep them for reference (recommended during transition period).

## 4. Test the Application

Run comprehensive tests:

```bash
# Start development server
npm run dev

# Test these pages:
# - http://localhost:3000/restaurants
# - http://localhost:3000/restaurants/[any-slug]
# - http://localhost:3000/terms-of-service
# - http://localhost:3000/privacy-policy  
# - http://localhost:3000/content-guidelines
# - Create/edit reviews
# - Like/comment on reviews
# - User profile pages
```

## 5. Check Browser Console

Open Developer Tools and check:
- ✅ No 404 errors to WordPress URLs
- ✅ No errors about missing Apollo Client
- ✅ All API calls go to `/api/v1/...` endpoints
- ⚠️ **Note:** Some user authentication endpoints still use `/wp-json/...` (see Known Limitations below)

## 6. Verify Build

Build the production version and check for errors:

```bash
npm run build

# Check for:
# - No build errors
# - No warnings about missing modules
# - Successful compilation
```

## 7. Update Documentation

Update these files if they reference WordPress:
- README.md
- documentation/tech_improvements.md
- Any API documentation

## 8. Deployment

Before deploying to production:

1. **Test on staging first**
2. **Backup current production database**
3. **Update environment variables on hosting platform**
4. **Deploy new version**
5. **Monitor for errors**

### Environment Variables for Production

Ensure these are set (remove WordPress ones):

```bash
# Hasura
NEXT_PUBLIC_HASURA_GRAPHQL_API_URL=https://your-hasura.com/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase config

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 9. Monitor Post-Deployment

After deployment, monitor:
- Error logs
- API response times
- User feedback
- Analytics for any drops

## 10. Cleanup Old WordPress Instance

**⚠️ Wait 2-4 weeks before doing this!**

Once you're confident everything works:

1. Export any remaining data from WordPress
2. Take a final backup
3. Shut down WordPress hosting
4. Cancel WordPress hosting subscription (if separate)

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous version
git revert <migration-commit-hash>

# Or restore previous deployment
# (depends on your hosting platform)

# Re-enable WordPress backend
# Restore environment variables
```

## Success Criteria

Migration is complete when:
- ✅ All pages load correctly
- ✅ No WordPress API calls in Network tab
- ✅ All features work (reviews, likes, profiles)
- ✅ Static content pages load from markdown
- ✅ No console errors
- ✅ Performance is same or better
- ✅ Users report no issues

## Known Limitations

### User Repository Still Uses WordPress Endpoints

The `src/repositories/http/user/userRepository.ts` file still uses WordPress `/wp-json/` endpoints for:

- User registration
- Login/authentication
- Email/username checking
- Password reset
- Profile updates
- Follow/unfollow functionality
- User palates

**Future Migration Needed:**
These should be migrated to either:
1. Hasura REST API endpoints (similar to restaurant/review migrations)
2. Firebase Authentication (for auth-related operations)
3. A combination of both

**Estimated Effort:** 2-3 days for complete migration

**Priority:** Medium (system works with WordPress backend for now)

---

## Questions?

If you encounter any issues:
1. Check `WORDPRESS_MIGRATION_COMPLETE.md` for details
2. Review git history for changes
3. Check browser console for specific errors
4. Contact development team

---

**Migration Date:** December 27, 2024  
**Status:** Ready for cleanup ✅  
**Note:** User authentication still uses WordPress endpoints (future migration needed)

