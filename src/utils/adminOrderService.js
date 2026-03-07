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
    writeBatch
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
                ordersQuery = query(ordersQuery, where("status", "==", filters.status));
            }

            if (filters.userId) {
                ordersQuery = query(ordersQuery, where("userId", "==", filters.userId));
            }

            // Date range filters
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                ordersQuery = query(ordersQuery, where("createdAt", ">=", startDate));
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                ordersQuery = query(ordersQuery, where("createdAt", "<=", endDate));
            }

            // Ordering
            const orderField = filters.orderBy || "orderDate"; // Use orderDate as primary
            const orderDirection = filters.orderDirection || "desc";

            try {
                ordersQuery = query(ordersQuery, orderBy(orderField, orderDirection));
            } catch (orderError) {
                // Fallback to createdAt or no ordering if index is missing
                try {
                    ordersQuery = query(ordersQuery, orderBy("createdAt", "desc"));
                } catch (e) {
                    console.warn("No index for ordering, fetching unordered");
                }
            }

            if (pagination.limit) {
                ordersQuery = query(ordersQuery, limit(pagination.limit));
                if (pagination.lastDoc) {
                    ordersQuery = query(ordersQuery, startAfter(pagination.lastDoc));
                }
            }

            const ordersSnapshot = await getDocs(ordersQuery);

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

            // Search filter (client-side)
            let filteredOrders = orders;
            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                filteredOrders = orders.filter(order => {
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
                orders: [],
                totalCount: 0
            };
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
