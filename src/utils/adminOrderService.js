import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    runTransaction,
    writeBatch,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Order status constants for consistent admin management
 */
export const ORDER_STATUSES = {
    PLACED: 'Placed',
    APPROVED: 'Approved',
    PACKED: 'Packed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    DECLINED: 'Declined',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded'
};

/**
 * Priority levels for order processing
 */
export const ORDER_PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

/**
 * Shipping carrier configuration
 */
export const SHIPPING_CARRIERS = {
    INDIA_POST: {
        name: 'IndiaPost',
        code: 'INDIAPOST',
        trackingUrl: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
        estimatedDays: { standard: 7, express: 3 }
    },
    DHL: {
        name: 'DHL',
        code: 'DHL',
        trackingUrl: 'https://www.dhl.com/in-en/home/tracking.html',
        estimatedDays: { standard: 3, express: 1 }
    },
    FEDEX: {
        name: 'FedEx',
        code: 'FEDEX',
        trackingUrl: 'https://www.fedex.com/en-in/tracking.html',
        estimatedDays: { standard: 3, express: 1 }
    },
    BLUEDART: {
        name: 'BlueDart',
        code: 'BLUEDART',
        trackingUrl: 'https://www.bluedart.com/web/guest/trackdartresult',
        estimatedDays: { standard: 2, express: 1 }
    }
};

class AdminOrderService {

    static async getAllOrders(filters = {}, pagination = {}) {
        try {
            let ordersQuery = collection(db, "orders");

            if (filters.status && filters.status !== 'all') {
                // If it's pure firestore query, we might miss case-sensitive matches.
                // We'll handle exact case if matches, but also do client-side filtering below.
                // ordersQuery = query(ordersQuery, where("status", "==", filters.status));
            }

            if (filters.userId) {
                ordersQuery = query(ordersQuery, where("userId", "==", filters.userId));
            }

            // We will filter dates client-side to avoid needing compound indexes with status
            // that may not exist in this project yet.

            // Ordering
            const orderField = filters.orderBy || "orderDate"; // Use orderDate as primary
            const orderDirection = filters.orderDirection || "desc";

            // We will do all ordering client-side to avoid missing index errors in Firestore
            // since 'orderDate' and 'status' compound indexes are likely not created.
            
            if (pagination.limit) {
                ordersQuery = query(ordersQuery, limit(pagination.limit));
                if (pagination.lastDoc) {
                    ordersQuery = query(ordersQuery, startAfter(pagination.lastDoc));
                }
            }

            let ordersSnapshot;
            try {
                ordersSnapshot = await getDocs(ordersQuery);
            } catch (fetchError) {
                console.warn("Firestore query failed, falling back to client-side filtering:", fetchError.message);
                const fallbackQuery = collection(db, "orders");
                ordersSnapshot = await getDocs(fallbackQuery);
            }

            const orders = ordersSnapshot.docs.map(doc => {
                const data = doc.data();

                let orderDate = null;
                if (data.orderDate?.toDate) {
                    orderDate = data.orderDate.toDate();
                } else if (data.createdAt?.toDate) {
                    orderDate = data.createdAt.toDate();
                } else if (data.orderDate) {
                    orderDate = new Date(data.orderDate);
                } else if (data.createdAt) {
                    orderDate = new Date(data.createdAt);
                }

                return {
                    id: doc.id,
                    ...data,
                    total: data.total || data.totalAmount || data.amount || data.netAmount || 0,
                    orderDate: orderDate,
                };
            });

            // Client-side filtering (handles fallback cases where Firestore query couldn't filter)
            let filteredOrders = orders;

            // Re-apply status filter if fallback was used
            // Re-apply status filter — supports group filters
            if (filters.status && filters.status !== 'all') {
                const statusLower = filters.status.toLowerCase();
                if (statusLower === 'processing') {
                    // Processing = Placed + Approved + Packed
                    filteredOrders = filteredOrders.filter(o =>
                        ['placed', 'approved', 'packed'].includes((o.status || '').toLowerCase())
                    );
                } else if (statusLower === 'cancelled/declined') {
                    // Cancelled/Declined = Cancelled + Declined + Refunded
                    filteredOrders = filteredOrders.filter(o =>
                        ['cancelled', 'declined', 'refunded'].includes((o.status || '').toLowerCase())
                    );
                } else {
                    filteredOrders = filteredOrders.filter(o =>
                        (o.status || '').toLowerCase() === statusLower
                    );
                }
            }

            // Client-side date filtering
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                filteredOrders = filteredOrders.filter(o => o.orderDate >= startDate);
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                filteredOrders = filteredOrders.filter(o => o.orderDate <= endDate);
            }

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                filteredOrders = filteredOrders.filter(order => {
                    return (
                        order.orderId?.toLowerCase().includes(searchTerm) ||
                        order.id?.toLowerCase().includes(searchTerm) ||
                        order.userName?.toLowerCase().includes(searchTerm) ||
                        order.userEmail?.toLowerCase().includes(searchTerm) ||
                        order.items?.some(item =>
                            (item.name || item.title || '').toLowerCase().includes(searchTerm)
                        )
                    );
                });
            }

            // Re-apply sorting client-side
            const sortField = filters.sortBy || 'date';
            const sortDir = filters.sortDirection || 'desc';
            filteredOrders.sort((a, b) => {
                if (sortField === 'amount') {
                    return sortDir === 'desc' ? (b.total || 0) - (a.total || 0) : (a.total || 0) - (b.total || 0);
                }
                // Default: sort by date
                const aDate = a.orderDate || new Date(0);
                const bDate = b.orderDate || new Date(0);
                return sortDir === 'desc' ? bDate - aDate : aDate - bDate;
            });

            return {
                success: true,
                orders: filteredOrders,
                totalCount: filteredOrders.length,
                lastDoc: ordersSnapshot.docs[ordersSnapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error('Error fetching orders:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    static async getOrderById(orderId) {
        try {
            const orderRef = doc(db, "orders", orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const data = orderSnap.data();
                let orderDate = null;
                if (data.orderDate?.toDate) {
                    orderDate = data.orderDate.toDate();
                } else if (data.createdAt?.toDate) {
                    orderDate = data.createdAt.toDate();
                } else if (data.orderDate) {
                    orderDate = new Date(data.orderDate);
                } else if (data.createdAt) {
                    orderDate = new Date(data.createdAt);
                }

                return {
                    success: true,
                    order: {
                        id: orderSnap.id,
                        ...data,
                        total: data.total || data.totalAmount || data.amount || data.netAmount || 0,
                        orderDate: orderDate,
                    }
                };
            }

            // Fallback: search by orderId field
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("orderId", "==", orderId));
            const qSnap = await getDocs(q);

            if (!qSnap.empty) {
                const doc = qSnap.docs[0];
                const data = doc.data();
                let orderDate = null;
                if (data.orderDate?.toDate) {
                    orderDate = data.orderDate.toDate();
                } else if (data.createdAt?.toDate) {
                    orderDate = data.createdAt.toDate();
                } else if (data.orderDate) {
                    orderDate = new Date(data.orderDate);
                } else if (data.createdAt) {
                    orderDate = new Date(data.createdAt);
                }

                return {
                    success: true,
                    order: {
                        id: doc.id,
                        ...data,
                        total: data.total || data.totalAmount || data.amount || data.netAmount || 0,
                        orderDate: orderDate,
                    }
                };
            }

            return { success: false, error: "Order not found" };
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateOrderStatus(orderId, newStatus, updateInfo = {}, adminUserId = 'admin') {
        try {
            const orderRef = doc(db, "orders", orderId);
            const orderSnapshot = await getDoc(orderRef);

            if (!orderSnapshot.exists()) throw new Error("Order not found");

            const currentOrder = orderSnapshot.data();

            const statusHistoryEntry = {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: updateInfo.note || `Order ${newStatus.toLowerCase()} by admin`,
                updatedBy: adminUserId
            };

            const updateData = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                statusHistory: [...(currentOrder.statusHistory || []), statusHistoryEntry]
            };

            if (updateInfo.tracking) {
                updateData.tracking = updateInfo.tracking;
            }

            await updateDoc(orderRef, updateData);

            // Restore stock when order is cancelled/declined/refunded
            // (only if previous status was not already one of these)
            const cancelStatuses = ['cancelled', 'declined', 'refunded'];
            const oldStatus = (currentOrder.status || '').toLowerCase();
            const newStatusLower = newStatus.toLowerCase();

            if (cancelStatuses.includes(newStatusLower) && !cancelStatuses.includes(oldStatus)) {
                // Restore stock for each product item
                if (currentOrder.items && Array.isArray(currentOrder.items)) {
                    for (const item of currentOrder.items) {
                        if (item.category === 'Services' || String(item.id).startsWith('service-')) continue;
                        try {
                            const productRef = doc(db, 'products', item.id);
                            await updateDoc(productRef, { stock: increment(item.quantity || 1) });
                        } catch (err) {
                            console.warn(`Failed to restore stock for ${item.id}:`, err.message);
                        }
                    }
                }
            }

            return { success: true, newStatus };
        } catch (error) {
            console.error('Error updating order status:', error);
            return { success: false, error: error.message };
        }
    }

    static async bulkOperation(operation, orderIds, operationData, adminUserId = 'admin') {
        try {
            const batch = writeBatch(db);
            for (const orderId of orderIds) {
                const orderRef = doc(db, "orders", orderId);
                const orderSnapshot = await getDoc(orderRef);
                if (!orderSnapshot.exists()) continue;

                const currentOrder = orderSnapshot.data();
                let updateData = {};

                if (operation === 'update_status') {
                    updateData = {
                        status: operationData.status,
                        updatedAt: serverTimestamp(),
                        statusHistory: [...(currentOrder.statusHistory || []), {
                            status: operationData.status,
                            timestamp: new Date().toISOString(),
                            note: operationData.note || `Bulk update`,
                            updatedBy: adminUserId
                        }]
                    };
                } else if (operation === 'update_priority') {
                    updateData = { priority: operationData.priority, updatedAt: serverTimestamp() };
                }

                if (Object.keys(updateData).length > 0) {
                    batch.update(orderRef, updateData);
                }
            }
            await batch.commit();
            return { success: true, successCount: orderIds.length, failureCount: 0 };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default AdminOrderService;
