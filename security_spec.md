# Security Specification: Inventory System

## 1. Data Invariants

1. **Product Isolation**: An inventory item must always belong to a specific authenticated user account (`userId`), and can only be accessed or modified by that exact user.
2. **Audit Log Immutability**: All stock history logs (`history` collection) are write-once. Once written, they cannot be updated or deleted by any user (including admins).
3. **SKU Validation**: SKUs must be short, alphanumeric with dashes/underscores (`^[A-Z0-9_-]+$`).
4. **Non-Negative Quantities**: Stock quantity and minimum quantities must never be negative numbers.
5. **Strict Timestamps**: Timestamps (`createdAt`, `updatedAt`, `timestamp`) must match the server-generated `request.time` exactly to prevent client-side time skew spoofing.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following malicious payloads must be rejected by the security rules:

1. **Unauthenticated Read**: Attempting to list items without being signed in.
2. **Unauthenticated Create**: Attempting to create a product without a valid session.
3. **Identity Spoofing (Creative Write)**: Authenticated user `A` attempts to create an inventory item with `userId = "B"`.
4. **Data Overlap Reading**: User `A` attempts to fetch a product owned by user `B`.
5. **Audit Log Deletion**: User attempts to delete a stock history record.
6. **Audit Log Update**: User attempts to alter a previously written log entry (e.g., changes a stock subtraction of -50 to a subtraction of -5).
7. **Negative Stock Insertion**: Creating or updating a product with `quantity = -5`.
8. **Junk SKU Injection**: Specifying a SKU containing 10,000 characters to trigger denial-of-wallet or storage attacks.
9. **Timestamp Spoofing**: Sending a client timestamp 3 months in the future for `createdAt` to falsify report history.
10. **Ownership Hijacking**: User `A` tries to update a product belonging to user `B`.
11. **Immutability Bypass**: User attempts to edit their own product's `createdAt` or change the product's `userId` ownership.
12. **Shadow Field Injection**: Sending additional properties like `isAdminOverride: true` or `restrictedRole: "owner"` into the product schema.

---

## 3. Security Test Profiles & Verification

All of the above payloads result in immediate validation fail and return a `PERMISSION_DENIED` status.
