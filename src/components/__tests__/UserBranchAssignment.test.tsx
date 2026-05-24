import { describe, it, expect } from 'vitest';

function canAssignBranches(currentUserRole: string, targetUserRole: string): boolean {
  // Only owners and super_admins can assign branches
  if (!['owner', 'super_admin'].includes(currentUserRole)) return false;
  // Cannot change another owner's assignments
  if (targetUserRole === 'owner' || targetUserRole === 'super_admin') return false;
  return true;
}

describe('UserBranchAssignment - permission logic', () => {
  it('allows owner to assign branches to cashier', () => {
    expect(canAssignBranches('owner', 'cashier')).toBe(true);
  });

  it('allows owner to assign branches to manager', () => {
    expect(canAssignBranches('owner', 'manager')).toBe(true);
  });

  it('allows owner to assign branches to kitchen_staff', () => {
    expect(canAssignBranches('owner', 'kitchen_staff')).toBe(true);
  });

  it('denies owner to assign branches to another owner', () => {
    expect(canAssignBranches('owner', 'owner')).toBe(false);
  });

  it('denies owner to assign branches to super_admin', () => {
    expect(canAssignBranches('owner', 'super_admin')).toBe(false);
  });

  it('denies manager (non-owner) to assign branches', () => {
    expect(canAssignBranches('manager', 'cashier')).toBe(false);
  });

  it('denies cashier to assign branches', () => {
    expect(canAssignBranches('cashier', 'cashier')).toBe(false);
  });

  it('allows super_admin to assign branches', () => {
    expect(canAssignBranches('super_admin', 'cashier')).toBe(true);
  });

  it('denies super_admin to assign branches to another super_admin', () => {
    expect(canAssignBranches('super_admin', 'super_admin')).toBe(false);
  });
});
