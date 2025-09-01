# Scripts Directory

## D-ID Dependencies Cleanup

### Quick Execution

```bash
# From project root
node scripts/remove-did-dependencies.js

# Or if you have execute permissions
./scripts/remove-did-dependencies.js
```

### What the Script Does

1. **Frontend Cleanup**:
   - Removes `/src/components/d-id/` directory
   - Removes `/src/hooks/d-id/` directory
   - Removes `/src/services/d-id/` directory (if exists)
   - Removes individual D-ID components
   - Removes D-ID pages
   - Updates `App.jsx` to remove D-ID imports and routes
   - Removes `@d-id/client-sdk` from `package.json`

2. **Backend Cleanup**:
   - Removes D-ID route files
   - Removes D-ID service files
   - Scans for remaining D-ID references

3. **Documentation**:
   - Generates cleanup summary
   - Provides migration guidance

### After Running the Script

1. Install updated dependencies:
   ```bash
   cd frontend && npm install
   ```

2. Review the generated `DID_CLEANUP_SUMMARY.md` file

3. Follow the `MIGRATION_GUIDE.md` for replacing D-ID functionality

4. Test the application to ensure no broken imports or functionality

### Safety Features

- Generates detailed logs of all operations
- Creates a summary of changes made
- Identifies potential issues that need manual review
- Preserves backup information in the summary file