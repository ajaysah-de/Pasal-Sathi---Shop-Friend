# Multi-User Feature Testing Guide

## ✅ Completed Features

### 1. Backend Multi-User System
- ✅ User model with roles (owner, manager, cashier)
- ✅ User authentication with individual PINs
- ✅ JWT tokens include user_id
- ✅ Sales tracking per user (user_id and user_name fields)
- ✅ User CRUD endpoints with role-based permissions

### 2. Frontend Updates
- ✅ Login page with user selection interface
- ✅ User name and role displayed in Layout header
- ✅ User management tab in Settings (owner-only)
- ✅ Sales by user summary in Reports page
- ✅ AuthContext updated with multi-user support

## 🧪 Testing Instructions

### Test 1: Shop Setup
1. **Start Services:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   python -m uvicorn server:app --reload
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

2. **Access Application:**
   - Open http://localhost:3000
   - You should see the Setup screen

3. **Setup Shop:**
   - Enter Shop Name (English): "Suman Sah Traders"
   - Enter पसलको नाम (Nepali): "सुमन साह ट्रेडर्स"
   - Create PIN: 1234
   - Click "Start Setup"
   - ✅ Should redirect to Dashboard
   - ✅ Header should show shop name and user "Owner / मालिक (owner)"

### Test 2: User Management (Owner)
1. **Navigate to Settings:**
   - Click Settings tab in bottom nav
   - ✅ Should see 4 tabs: Suppliers, Categories, Locations, **Users**

2. **Create Cashier User:**
   - Click "Users" tab
   - ✅ Should see Owner user listed
   - Click "Add User"
   - Enter:
     - Name: "Ram Prasad"
     - PIN: 5678
     - Role: Cashier / कर्मचारी
   - Click "Add User"
   - ✅ Should see success toast
   - ✅ Should see both users in the list

3. **Create Manager User:**
   - Click "Add User" again
   - Enter:
     - Name: "Shyam Kumar"
     - PIN: 9012
     - Role: Manager / प्रबन्धक
   - Click "Add User"
   - ✅ Should see 3 users total

4. **Edit User:**
   - Click edit (pencil icon) on Ram Prasad
   - Change name to "Ram Prasad Sharma"
   - Leave PIN empty (to keep current)
   - Click "Update User"
   - ✅ Name should update

5. **Delete User:**
   - Create a test user: "Test User", PIN: 1111, Role: Cashier
   - Click delete (trash icon) on Test User
   - Confirm deletion
   - ✅ User should be removed
   - ✅ Cannot delete Owner user (no delete button shown)

### Test 3: Multi-User Login Flow
1. **Logout:**
   - In Settings, click "Logout"
   - ✅ Should return to Login page

2. **User Selection Screen:**
   - ✅ Should see "Select User" heading
   - ✅ Should see 3 user cards:
     * Owner / मालिक (owner)
     * Ram Prasad Sharma (cashier)
     * Shyam Kumar (manager)

3. **Login as Cashier:**
   - Click on "Ram Prasad Sharma" card
   - ✅ Should see PIN entry screen
   - ✅ Header should show "PIN for Ram Prasad Sharma"
   - Enter PIN: 5678
   - Click "Login as Ram Prasad Sharma"
   - ✅ Should redirect to Dashboard
   - ✅ Header should show "Ram Prasad Sharma (cashier)"

4. **Test Cashier Permissions:**
   - Go to Settings
   - ✅ Should NOT see "Users" tab (cashier has no access)
   - ✅ Can see Suppliers, Categories, Locations tabs

5. **Logout and Login as Manager:**
   - Logout
   - Select "Shyam Kumar"
   - Enter PIN: 9012
   - ✅ Should login successfully
   - ✅ Header shows "Shyam Kumar (manager)"

6. **Test Manager Permissions:**
   - Go to Settings → Users tab
   - ✅ Should see Users tab (manager can view)
   - ✅ Should see all users listed
   - ✅ Should NOT see "Add User" button (manager cannot create)
   - ✅ Should NOT see edit/delete buttons (manager cannot modify)

7. **Login as Owner:**
   - Logout and login as Owner with PIN: 1234
   - ✅ Should see "Add User" button
   - ✅ Should see edit/delete buttons on all users

### Test 4: Sales Tracking by User
1. **Create Sale as Cashier:**
   - Login as Ram Prasad Sharma (5678)
   - Go to Inventory, add some test products if needed
   - Go to Sale
   - Add items to cart
   - Complete sale (Cash payment)
   - ✅ Sale should be created

2. **Create Sale as Manager:**
   - Logout and login as Shyam Kumar (9012)
   - Go to Sale
   - Create another sale
   - ✅ Sale should be created

3. **Create Sale as Owner:**
   - Logout and login as Owner (1234)
   - Create another sale

4. **View Sales by User Report:**
   - Go to Reports
   - ✅ Should see "Sales by User" section
   - ✅ Should see breakdown by user:
     * Ram Prasad Sharma: X sales, ₹ XXX
     * Shyam Kumar: X sales, ₹ XXX
     * Owner / मालिक: X sales, ₹ XXX
   - ✅ Each sale item should show "Sold by: [user name]"

### Test 5: Error Handling
1. **Wrong PIN:**
   - Logout
   - Select any user
   - Enter wrong PIN
   - ✅ Should show error: "Invalid PIN"
   - ✅ PIN inputs should clear
   - ✅ Focus should return to first input

2. **Back Navigation:**
   - Select a user
   - Click "Back to user selection"
   - ✅ Should return to user selection screen
   - ✅ PIN should be cleared

3. **Empty User List:**
   - (Should never happen in production, but good to test)
   - If /auth/users returns empty array
   - ✅ Should show empty state

## 🎯 Success Criteria

### User Authentication
- [ ] Owner user created automatically during setup
- [ ] User selection screen shows all active users
- [ ] Each user has their own PIN (4-6 digits)
- [ ] Correct user name and role displayed in header
- [ ] JWT token includes user_id

### Role-Based Permissions
- [ ] **Owner**: Can create/edit/delete users, full access
- [ ] **Manager**: Can view users, cannot modify them
- [ ] **Cashier**: Cannot access Users tab at all
- [ ] All roles can manage inventory, make sales, view reports

### Sales Tracking
- [ ] Each sale records user_id and user_name
- [ ] Reports page shows "Sales by User" summary
- [ ] Each sale item displays "Sold by: [user name]"
- [ ] Sales stats correctly grouped by user

### User Experience
- [ ] Smooth login flow: Select user → Enter PIN → Login
- [ ] User cards show name, role, and avatar
- [ ] Back button works on PIN entry screen
- [ ] Toast notifications for success/error states
- [ ] Loading states during API calls

## 🐛 Known Issues & Limitations

1. **Cannot delete owner user**: By design, at least one owner must exist
2. **PIN change requires old PIN**: Security feature (not implemented yet in UI)
3. **No user deactivation toggle in UI**: Can only delete users
4. **User role cannot be changed after creation**: Must delete and recreate

## 📝 Future Enhancements

1. User profile page with statistics
2. User activity log (login history)
3. PIN reset functionality (owner can reset any user's PIN)
4. User deactivation instead of deletion
5. User-specific permissions (custom access levels)
6. User photos/avatars
7. Multi-shop support (one user, multiple shops)

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is already in use
netstat -ano | findstr :8000

# Restart backend
cd backend
python -m uvicorn server:app --reload
```

### Frontend shows CORS errors
- Ensure backend is running on http://localhost:8000
- Check frontend/.env.local has REACT_APP_BACKEND_URL=http://localhost:8000

### MongoDB connection failed
```bash
# Start MongoDB service
net start MongoDB

# Or if using manual installation
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Users not showing in login screen
- Check backend logs for errors
- Test /api/auth/users endpoint directly
- Clear localStorage and try fresh setup

### Sales not tracking user correctly
- Check that JWT token includes user_id
- Verify create_sale() uses get_current_user dependency
- Check Sale model has user_id and user_name fields

## ✅ Testing Checklist

- [ ] Fresh setup creates owner user
- [ ] Owner can create cashier user
- [ ] Owner can create manager user
- [ ] Cashier login works
- [ ] Manager login works
- [ ] Owner login works
- [ ] User name shows in header
- [ ] Cashier cannot see Users tab
- [ ] Manager can see but not edit Users tab
- [ ] Owner can add/edit/delete users
- [ ] Sales created by cashier show correct user
- [ ] Sales created by manager show correct user
- [ ] Reports page shows sales by user
- [ ] Each sale shows "Sold by" field
- [ ] Wrong PIN shows error
- [ ] Back button works on PIN screen
- [ ] Logout returns to user selection
- [ ] All users visible after logout

---

**Test Date**: _____________  
**Tester**: _____________  
**Results**: ✅ Pass / ❌ Fail  
**Notes**: _____________
