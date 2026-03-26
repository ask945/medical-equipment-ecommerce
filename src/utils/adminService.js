import { doc, runTransaction, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../adminFirebase';

/**
 * Admin RBAC Service
 * All admin mutations use Firestore transactions to prevent race conditions.
 * All actions write to admin_audit_logs for traceability.
 */

// ==================== AUDIT LOGGING ====================

const writeAuditLog = (action, targetId, targetEmail, performerId, performerEmail, details = {}) => {
    // Fire-and-forget — don't block the caller
    addDoc(collection(db, 'admin_audit_logs'), {
        action,
        targetAdminId: targetId,
        targetEmail: targetEmail || '',
        performedBy: performerId,
        performerEmail: performerEmail || '',
        timestamp: serverTimestamp(),
        details
    }).catch(err => console.error('Audit log write failed:', err));
};

// ==================== HELPERS ====================

const countActiveSuperAdmins = (adminList) => {
    return adminList.filter(a => a.role === 'Super Admin' && !a.isDisabled && !a.isDeleted).length;
};

// ==================== TRANSACTION-BASED OPERATIONS ====================

/**
 * Promote Admin → Super Admin
 * Only Super Admins can do this. Cannot promote self.
 */
export const promoteToSuperAdmin = async (targetId, currentAdminId, currentAdminEmail, adminList) => {
    const targetRef = doc(db, 'admins', targetId);

    await runTransaction(db, async (transaction) => {
        const targetSnap = await transaction.get(targetRef);

        if (!targetSnap.exists()) throw new Error('Admin not found');
        const targetData = targetSnap.data();

        if (targetData.isDeleted) throw new Error('Cannot modify a deleted admin');
        if (targetData.isDisabled) throw new Error('Cannot promote a disabled admin');
        if (targetId === currentAdminId) throw new Error('You cannot modify your own role');
        if (targetData.role === 'Super Admin') throw new Error('Admin is already a Super Admin');

        // Verify caller is Super Admin from the list
        const caller = adminList.find(a => a.id === currentAdminId || a.email === currentAdminEmail);
        if (!caller || caller.role !== 'Super Admin') throw new Error('Only Super Admins can promote to Super Admin');

        transaction.update(targetRef, { role: 'Super Admin' });
    });

    writeAuditLog('PROMOTE_SUPER_ADMIN', targetId, null, currentAdminId, currentAdminEmail, {
        previousRole: 'Admin',
        newRole: 'Super Admin'
    });
};

/**
 * Demote Super Admin → Admin
 * Must keep at least 1 active Super Admin.
 */
export const demoteToAdmin = async (targetId, currentAdminId, currentAdminEmail, adminList) => {
    const targetRef = doc(db, 'admins', targetId);

    await runTransaction(db, async (transaction) => {
        const targetSnap = await transaction.get(targetRef);

        if (!targetSnap.exists()) throw new Error('Admin not found');
        const targetData = targetSnap.data();

        if (targetData.isDeleted) throw new Error('Cannot modify a deleted admin');
        if (targetId === currentAdminId) throw new Error('You cannot modify your own role');
        if (targetData.role !== 'Super Admin') throw new Error('Admin is not a Super Admin');

        const caller = adminList.find(a => a.id === currentAdminId || a.email === currentAdminEmail);
        if (!caller || caller.role !== 'Super Admin') throw new Error('Only Super Admins can demote');

        // Check: after demotion, will there still be at least 1 active Super Admin?
        const activeSuperAdmins = countActiveSuperAdmins(adminList);
        if (activeSuperAdmins <= 1) throw new Error('Cannot demote the last active Super Admin');

        transaction.update(targetRef, { role: 'Admin' });
    });

    writeAuditLog('DEMOTE_TO_ADMIN', targetId, null, currentAdminId, currentAdminEmail, {
        previousRole: 'Super Admin',
        newRole: 'Admin'
    });
};

/**
 * Disable an admin
 * Cannot disable self. Cannot disable last active Super Admin.
 */
export const disableAdmin = async (targetId, currentAdminId, currentAdminEmail, adminList) => {
    const targetRef = doc(db, 'admins', targetId);

    await runTransaction(db, async (transaction) => {
        const targetSnap = await transaction.get(targetRef);

        if (!targetSnap.exists()) throw new Error('Admin not found');
        const targetData = targetSnap.data();

        if (targetData.isDeleted) throw new Error('Cannot modify a deleted admin');
        if (targetData.isDisabled) throw new Error('Admin is already disabled');
        if (targetId === currentAdminId) throw new Error('You cannot disable your own account');

        const caller = adminList.find(a => a.id === currentAdminId || a.email === currentAdminEmail);
        if (!caller || caller.role !== 'Super Admin') throw new Error('Only Super Admins can disable admins');

        // Prevent disabling last active Super Admin
        if (targetData.role === 'Super Admin') {
            const activeSuperAdmins = countActiveSuperAdmins(adminList);
            if (activeSuperAdmins <= 1) throw new Error('Cannot disable the last active Super Admin');
        }

        transaction.update(targetRef, {
            isDisabled: true,
            disabledAt: serverTimestamp(),
            disabledBy: currentAdminId
        });
    });

    writeAuditLog('DISABLE_ADMIN', targetId, null, currentAdminId, currentAdminEmail, {
        role: adminList.find(a => a.id === targetId)?.role || 'Admin'
    });
};

/**
 * Enable a disabled admin
 */
export const enableAdmin = async (targetId, currentAdminId, currentAdminEmail, adminList) => {
    const targetRef = doc(db, 'admins', targetId);

    await runTransaction(db, async (transaction) => {
        const targetSnap = await transaction.get(targetRef);

        if (!targetSnap.exists()) throw new Error('Admin not found');
        const targetData = targetSnap.data();

        if (targetData.isDeleted) throw new Error('Cannot modify a deleted admin');
        if (!targetData.isDisabled) throw new Error('Admin is not disabled');
        if (targetId === currentAdminId) throw new Error('You cannot modify your own account');

        const caller = adminList.find(a => a.id === currentAdminId || a.email === currentAdminEmail);
        if (!caller || caller.role !== 'Super Admin') throw new Error('Only Super Admins can enable admins');

        transaction.update(targetRef, {
            isDisabled: false,
            enabledAt: serverTimestamp(),
            enabledBy: currentAdminId
        });
    });

    writeAuditLog('ENABLE_ADMIN', targetId, null, currentAdminId, currentAdminEmail, {
        role: adminList.find(a => a.id === targetId)?.role || 'Admin'
    });
};

/**
 * Soft delete an admin (sets isDeleted flag instead of removing doc)
 * Cannot delete self. Cannot delete last active Super Admin.
 */
export const softDeleteAdmin = async (targetId, currentAdminId, currentAdminEmail, adminList) => {
    const targetRef = doc(db, 'admins', targetId);

    await runTransaction(db, async (transaction) => {
        const targetSnap = await transaction.get(targetRef);

        if (!targetSnap.exists()) throw new Error('Admin not found');
        const targetData = targetSnap.data();

        if (targetData.isDeleted) throw new Error('Admin is already deleted');
        if (targetId === currentAdminId) throw new Error('You cannot delete your own account');

        const caller = adminList.find(a => a.id === currentAdminId || a.email === currentAdminEmail);
        if (!caller || caller.role !== 'Super Admin') throw new Error('Only Super Admins can delete admins');

        // Prevent deleting last active Super Admin
        if (targetData.role === 'Super Admin' && !targetData.isDisabled) {
            const activeSuperAdmins = countActiveSuperAdmins(adminList);
            if (activeSuperAdmins <= 1) throw new Error('Cannot delete the last active Super Admin');
        }

        transaction.update(targetRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: currentAdminId
        });
    });

    writeAuditLog('DELETE_ADMIN', targetId, null, currentAdminId, currentAdminEmail, {
        role: adminList.find(a => a.id === targetId)?.role || 'Admin',
        softDelete: true
    });
};

/**
 * Add a new admin (promote user → admin)
 * Both Admin and Super Admin can do this, but Admin can only create Admin role.
 */
export const addNewAdmin = async (adminData, currentAdminId, currentAdminEmail, currentAdminRole) => {
    // Force Admin role if caller is not Super Admin
    const roleToSet = currentAdminRole === 'Super Admin' ? (adminData.role || 'Admin') : 'Admin';

    const docRef = await addDoc(collection(db, 'admins'), {
        name: adminData.name || 'Administrator',
        email: adminData.email,
        password: adminData.password,
        role: roleToSet,
        isDisabled: false,
        isDeleted: false,
        sourceUserId: adminData.userId,
        createdAt: serverTimestamp(),
        createdBy: currentAdminId
    });

    writeAuditLog('ADD_ADMIN', docRef.id, adminData.email, currentAdminId, currentAdminEmail, {
        role: roleToSet,
        sourceUserId: adminData.userId
    });

    return { id: docRef.id, role: roleToSet };
};
