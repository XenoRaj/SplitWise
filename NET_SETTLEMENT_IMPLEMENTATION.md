# Net Settlement Logic Implementation

## Summary
Implemented net settlement calculation for global settlements where bidirectional debts between two people cancel out.

## Changes Made

### Backend (Django) - `apps/expenses/views.py`

#### Enhanced `process_payment()` function:

1. **Added `settlement_type` parameter**: Now accepts 'individual', 'group', or 'global' to determine settlement behavior

2. **Net Balance Calculation for Global Settlements**:
   - For global settlements, calculates the net balance between current user and receiver
   - Formula: `balance = (amount_user_owes_receiver) - (amount_receiver_owes_user)`
   - Only processes payment for the net amount, not the full amount

3. **Bidirectional Debt Handling**:
   - When settling globally, processes TWO sets of splits:
     a. **User's debts** (where receiver paid, user owes): Marked as settled first
     b. **Receiver's debts** (where user paid, receiver owes): Credited against the remaining balance
   
4. **Expense Marking**: 
   - All related `ExpenseSplit` records are automatically marked as settled
   - Reduces `split.amount` to 0 for fully settled splits
   - Updates database immediately when payment is processed

5. **Response Enhancement**:
   - Now returns both `requested_amount` and `actual_amount`
   - Includes `settlement_type` in response
   - Returns `payments_made` array showing all settled expenses
   - Distinguishes between `amount_paid` and `amount_credited`

### Example Flow:
```
User A and User B scenario:
- User A owes B: ₹500 (for expense1)
- User B owes A: ₹300 (for expense2)

When A initiates global settlement with B:
- Backend calculates net: 500 - 300 = ₹200
- Only processes payment of ₹200 (not ₹500)
- Marks expense1 split for ₹500 as settled: split.amount = 0
- Marks expense2 split for ₹300 as settled: split.amount = 0
- Response shows both expenses in payments_made with their respective amounts
```

### Frontend (React Native) - `components/SettlePaymentScreen.tsx`

1. **Updated Type Definitions**:
   - Extended `RootStackParamList` to include 'global' settlement type
   - Added `recipientId` and `amount` as optional params for pre-filling

2. **Enhanced Payment Request**:
   - Now passes `settlement_type` to backend
   - Ensures backend knows what kind of settlement is being processed

3. **Payment Processing**:
   - Already handles field mapping for global settlements
   - Auto-selects recipient when coming from GlobalSettleUpScreen
   - Shows proper balance display (You Owe vs Owed to You)

## Data Flow

### Global Settlement Flow:
1. User navigates to GlobalSettleUpScreen
2. Selects person to settle with (pre-calculates net balance in UI)
3. Routes to SettlePaymentScreen with:
   - `settlementType: 'global'`
   - `recipientId: selected_user_id`
   - `amount: calculated_net_amount`
4. Frontend sends payment request with `settlement_type: 'global'`
5. Backend:
   - Calculates net balance between the two users
   - Processes payment for net amount only
   - Marks all mutual expenses as settled
   - Returns detailed settlement information

## Key Benefits

✅ **Accurate Settlement**: Only charge/pay net amounts, not full amounts  
✅ **Complete Clearing**: All related expenses marked as settled in database  
✅ **Bidirectional Handling**: Properly cancels out mutual debts  
✅ **Transparency**: Response shows exactly which expenses were settled  
✅ **Prevents Duplicate Payments**: Zero balance filtering prevents settling already-settled expenses  

## Database Changes Required
None - existing `ExpenseSplit` model already has `amount` field that tracks payment status.

## Testing Scenarios

1. **Unidirectional Settlement** (A owes B only):
   - User A pays User B ₹500
   - Only expense where B paid is settled

2. **Bidirectional Settlement** (A owes B AND B owes A):
   - User A owes B ₹500
   - User B owes A ₹300
   - A pays B ₹200 (net)
   - Both expenses marked as settled

3. **Reverse Settlement** (B owes A more):
   - User A owes B ₹200
   - User B owes A ₹500
   - A receives ₹300 (net)
   - Both expenses marked as settled

## Future Enhancements
- Add settlement history/audit trail
- Implement refund mechanism if needed
- Add settlement cancellation capability
- Store settlement records in database (currently in-memory)
