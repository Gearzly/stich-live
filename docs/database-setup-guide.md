# Database Setup Guide

## Overview
This guide covers the complete setup and management of the Firestore database for Stich Production.

## Quick Start

### 1. Initial Setup
```bash
# Deploy Firestore rules and indexes
npm run db:deploy

# Deploy with initial data seeding
npm run db:setup
```

### 2. Development Workflow
```bash
# Seed the database with sample data
npm run db:seed

# Run health check
npm run db:health

# Create backup
npm run db:backup
```

## Available Commands

### Deployment Commands
- `npm run db:deploy` - Deploy rules and indexes
- `npm run db:deploy:rules` - Deploy only security rules
- `npm run db:deploy:indexes` - Deploy only indexes
- `npm run db:setup` - Full setup with seeding

### Data Management Commands
- `npm run db:seed` - Seed database with initial data
- `npm run db:backup` - Create database backup
- `npm run db:restore <path>` - Restore from backup
- `npm run db:list-backups` - List available backups
- `npm run db:clear` - Clear all database data

### Monitoring Commands
- `npm run db:health` - Run comprehensive health check

## Database Collections

### Core Collections
1. **users** - User accounts and preferences
2. **apps** - User-created applications
3. **templates** - Reusable application templates
4. **generation_logs** - Audit trail for AI generations
5. **usage** - User quota and usage tracking

### Supporting Collections
1. **rate_limits** - Rate limiting data
2. **sessions** (subcollection of apps) - AI generation sessions

## Security Rules

The database uses comprehensive security rules that enforce:
- User data isolation
- App ownership verification
- Role-based access control
- Data validation at write time

### Key Security Features
- Users can only access their own data
- Apps are protected by ownership
- Public apps are discoverable but read-only
- Admin-only collections for sensitive operations
- Comprehensive validation functions

## Indexes

The database includes optimized indexes for:
- User queries by role and creation date
- App queries by user, status, and visibility
- Template discovery and filtering
- Generation log analysis
- Usage tracking and quotas

### Critical Indexes
- `apps: userId, status` - User's app filtering
- `apps: visibility, createdAt` - Public app discovery
- `generation_logs: userId, timestamp` - User activity logs
- `templates: category, featured` - Template browsing

## Data Validation

### Automatic Validation
The health check script validates:
- Required field presence
- Data type compliance
- Reference integrity
- Performance metrics
- Index coverage

### Manual Validation
```bash
# Run comprehensive health check
npm run db:health

# Check specific collection
firebase firestore:indexes --project your-project
```

## Performance Considerations

### Query Optimization
- Use proper indexes for all queries
- Implement pagination for large datasets
- Avoid deep subcollection queries
- Use compound queries efficiently

### Document Size Management
- Keep documents under 1MB
- Use subcollections for related data
- Implement data archiving strategies

### Cost Optimization
- Monitor read/write operations
- Use efficient query patterns
- Implement proper caching
- Regular cleanup of old data

## Backup Strategy

### Automated Backups
The backup system provides:
- Full database exports
- Timestamped backup files
- Easy restore functionality
- Backup verification

### Backup Schedule
Recommended backup frequency:
- **Production**: Daily automated backups
- **Staging**: Weekly backups
- **Development**: Manual backups before major changes

### Restore Process
```bash
# List available backups
npm run db:list-backups

# Restore from specific backup
npm run db:restore ./backups/firestore-backup-2024-01-01.json
```

## Monitoring and Alerting

### Health Checks
Regular health checks monitor:
- Data integrity
- Performance metrics
- Index efficiency
- Security compliance

### Key Metrics to Monitor
- Query latency
- Error rates
- Storage usage
- Bandwidth consumption
- Cost trends

### Firebase Console Monitoring
Monitor these metrics in Firebase Console:
- Firestore usage dashboard
- Performance monitoring
- Security rules evaluation
- Index building status

## Troubleshooting

### Common Issues

#### Index Building
```bash
# Check index status
firebase firestore:indexes --project your-project

# Force index rebuild
npm run db:deploy:indexes
```

#### Security Rules
```bash
# Test security rules
firebase emulators:start --only firestore

# Deploy updated rules
npm run db:deploy:rules
```

#### Performance Issues
```bash
# Run performance analysis
npm run db:health

# Check query efficiency in Firebase Console
```

### Error Resolution

#### "Missing Index" Errors
1. Check the error message for required fields
2. Add the index to `firestore.indexes.json`
3. Deploy indexes: `npm run db:deploy:indexes`
4. Wait for index building to complete

#### "Permission Denied" Errors
1. Verify user authentication
2. Check security rules in `firestore.rules`
3. Test with Firebase emulator
4. Deploy updated rules if needed

#### "Document Too Large" Errors
1. Identify large documents with health check
2. Restructure data using subcollections
3. Archive or remove unnecessary data
4. Implement data pagination

## Environment-Specific Configuration

### Development
- Use Firebase emulators for local development
- Minimal security for easier testing
- Sample data for UI development

### Staging
- Mirror production security rules
- Use staging project in Firebase
- Regular data synchronization with production

### Production
- Strict security rules
- Comprehensive monitoring
- Automated backups
- Performance optimization

## Data Migration

### Schema Changes
1. Plan backward-compatible changes
2. Deploy new indexes first
3. Update security rules
4. Migrate data in batches
5. Cleanup old structures

### Version Management
- Document all schema changes
- Maintain migration scripts
- Test migrations in staging
- Plan rollback strategies

## Best Practices

### Data Modeling
- Design for scalability
- Use appropriate collection structure
- Implement proper relationships
- Consider query patterns

### Security
- Principle of least privilege
- Regular security audits
- Input validation
- Rate limiting

### Performance
- Efficient indexing strategy
- Query optimization
- Proper caching
- Regular monitoring

### Maintenance
- Regular health checks
- Data cleanup procedures
- Index optimization
- Cost monitoring

This database setup provides a robust, scalable, and secure foundation for the Stich Production platform.