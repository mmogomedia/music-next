# User Management System

## Overview

The user management system allows administrators to view, manage, and control user access across the platform. Deactivated users are prevented from logging in, ensuring proper access control.

## Core Features

### 1. User Status Management

- **Active Users**: Can log in and access the platform normally
- **Inactive Users**: Cannot log in, blocked at authentication level
- **Status Toggle**: Admins can activate/deactivate users instantly

### 2. User Information Display

- User profile details (name, email, avatar)
- Role assignment (USER, ARTIST, ADMIN)
- Premium status
- Artist profile information (if applicable)
- Account creation and last update dates
- Activity statistics (tracks, plays, etc.)

### 3. Search and Filtering

- Search by name, email, or artist name
- Filter by role (USER, ARTIST, ADMIN)
- Filter by status (Active, Inactive)
- Pagination for large user lists

## Database Schema

### User Model Updates

```sql
-- Added isActive field to users table
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;
```

### User Model Structure

```typescript
model User {
  id                  String               @id @default(cuid())
  name                String?
  email               String               @unique
  emailVerified       DateTime?
  image               String?
  password            String?
  role                UserRole             @default(USER)
  isPremium           Boolean              @default(false)
  isActive            Boolean              @default(true)  // NEW FIELD
  stripeCustomerId    String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  // ... other relations
}
```

## Authentication Integration

### Login Prevention

```typescript
// In auth.ts authorize function
const user = await prisma.user.findFirst({
  where: {
    OR: [{ email: identifier }, { name: identifier }],
  },
});

if (!user || !user.password) return null;

// Check if user is active - NEW CHECK
if (!user.isActive) return null;

const ok = await bcrypt.compare(password, user.password);
if (!ok) return null;
```

### Session Data

```typescript
// JWT and session callbacks include isActive
return {
  id: user.id,
  email: user.email,
  name: user.name ?? undefined,
  role: user.role,
  isPremium: user.isPremium,
  isActive: user.isActive, // NEW FIELD
} as any;
```

## API Endpoints

### 1. Get Users List

```
GET /api/admin/users
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for name/email/artist name
- `role`: Filter by role (USER, ARTIST, ADMIN, all)
- `status`: Filter by status (active, inactive, all)

**Response:**

```json
{
  "users": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "USER",
      "isActive": true,
      "isPremium": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "artistProfile": {
        "id": "profile_id",
        "artistName": "Artist Name",
        "isVerified": false
      },
      "_count": {
        "tracks": 5,
        "playEvents": 100
      }
    }
  ],
  "totalCount": 100,
  "totalPages": 10,
  "currentPage": 1
}
```

### 2. Get User Details

```
GET /api/admin/users/[id]
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "ARTIST",
    "isActive": true,
    "isPremium": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "artistProfile": {
      "id": "profile_id",
      "artistName": "Artist Name",
      "isVerified": true,
      "bio": "Artist bio",
      "location": "City, Country",
      "genre": "Hip Hop"
    },
    "_count": {
      "tracks": 25,
      "playEvents": 5000,
      "likeEvents": 200,
      "saveEvents": 50,
      "shareEvents": 30,
      "downloadEvents": 10
    }
  }
}
```

### 3. Update User

```
PATCH /api/admin/users/[id]
```

**Request Body:**

```json
{
  "action": "activate|deactivate|update|delete",
  "name": "New Name", // for update action
  "role": "ARTIST", // for update action
  "isPremium": true // for update action
}
```

**Actions:**

- `activate`: Set isActive to true
- `deactivate`: Set isActive to false
- `update`: Update user fields
- `delete`: Permanently delete user and all related data

## Admin Dashboard Integration

### User Management Tab

Located at `/admin/dashboard` → Users tab

**Features:**

- User list with search and filters
- User details modal
- Action dropdown for each user
- Bulk operations (future enhancement)
- Real-time status updates

### Quick Actions

- "Manage Users" button on overview tab
- Direct navigation to users tab
- User count display in system metrics

## User Interface Components

### UserManagement Component

```typescript
// Location: /src/components/dashboard/admin/UserManagement.tsx
interface UserManagementProps {
  onUserAction?: (action: string, user: User) => void;
}
```

**Features:**

- Responsive table layout
- Search and filter controls
- Pagination
- User action modals
- Status indicators with color coding
- Role badges
- Artist profile integration

### User Actions

1. **View Details**: Show complete user information
2. **Edit User**: Update user fields (name, role, premium status)
3. **Activate/Deactivate**: Toggle user access
4. **Delete User**: Permanent removal (with confirmation)

## Security Considerations

### Admin-Only Access

- All user management endpoints require ADMIN role
- Session validation on every request
- Proper error handling for unauthorized access

### Data Protection

- Sensitive user data only accessible to admins
- Audit trail for user status changes (future enhancement)
- Secure deletion of user data

### Authentication Bypass Prevention

- isActive check at authentication level
- No way for deactivated users to regain access
- Immediate effect on status changes

## Usage Guidelines

### For Administrators

#### Viewing Users

1. Navigate to Admin Dashboard
2. Click "Users" tab
3. Use search and filters to find specific users
4. Click "View Details" for complete information

#### Managing User Status

1. Find the user in the list
2. Click the action dropdown (three dots)
3. Select "Activate" or "Deactivate"
4. Confirm the action in the modal

#### Editing User Information

1. Click "Edit User" from the action dropdown
2. Update the desired fields
3. Save changes

#### Deleting Users

1. Click "Delete User" from the action dropdown
2. Confirm the permanent deletion
3. User and all related data will be removed

### For Developers

#### Adding New User Fields

1. Update the User model in `schema.prisma`
2. Create and run migration
3. Update API endpoints to include new fields
4. Update UserManagement component UI
5. Update authentication if needed

#### Extending User Actions

1. Add new action to API endpoint
2. Update UserManagement component
3. Add appropriate UI controls
4. Test thoroughly

## Testing

### Manual Testing Checklist

- [ ] Admin can view user list
- [ ] Search functionality works
- [ ] Filter by role works
- [ ] Filter by status works
- [ ] Pagination works correctly
- [ ] User details modal displays correctly
- [ ] Activate user works
- [ ] Deactivate user works
- [ ] Deactivated user cannot log in
- [ ] Activated user can log in
- [ ] Edit user works
- [ ] Delete user works
- [ ] Non-admin users cannot access endpoints

### Unit Tests

- Test user API endpoints
- Test authentication with isActive check
- Test user management component
- Test search and filter functionality

### Integration Tests

- Test complete user management flow
- Test authentication integration
- Test admin dashboard integration

## Future Enhancements

### Planned Features

1. **Bulk Operations**: Select multiple users for batch actions
2. **User Activity Logs**: Track user actions and changes
3. **Email Notifications**: Notify users of status changes
4. **Advanced Filtering**: Date ranges, activity levels, etc.
5. **Export Functionality**: Export user data to CSV/Excel
6. **User Groups**: Organize users into groups
7. **Temporary Suspensions**: Time-based access restrictions

### Performance Optimizations

1. **Database Indexing**: Optimize queries for large user lists
2. **Caching**: Cache user data for faster loading
3. **Pagination**: Implement cursor-based pagination
4. **Search Optimization**: Full-text search capabilities

## Troubleshooting

### Common Issues

**User cannot log in after activation:**

- Check if user is actually active in database
- Verify authentication code includes isActive check
- Clear user session and try again

**Admin cannot see users:**

- Verify admin role in session
- Check API endpoint permissions
- Verify database connection

**Search not working:**

- Check search query format
- Verify database indexes
- Check API endpoint implementation

### Debug Mode

Enable debug logging in:

- Authentication middleware
- User API endpoints
- UserManagement component

## Maintenance

### Regular Tasks

1. Monitor user activity and status changes
2. Review deactivated users for cleanup
3. Update user management interface as needed
4. Monitor system performance with large user lists

### Database Maintenance

1. Regular cleanup of deleted user data
2. Index optimization for user queries
3. Archive old user data if needed

## Related Documentation

- [Authentication System](./02-authentication-setup.md)
- [Admin Dashboard](./12-admin-dashboard.md)
- [Database Schema](./03-database-schema.md)
- [API Documentation](./25-api-client-and-utilities.md)
