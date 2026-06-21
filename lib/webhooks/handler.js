import crypto from "node:crypto";

/**
 * Verify the Whop webhook HMAC-SHA256 signature.
 * Whop sends: X-Whop-Signature-256: sha256=<hex>
 */
export function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

/**
 * Route an incoming webhook event to the right handler.
 */
export function handleEvent(event) {
  const { type, data } = event;
  console.log(`\n📨 Webhook: ${type}`, JSON.stringify(data, null, 2));

  switch (type) {
    case "payment.succeeded":   return onPaymentSucceeded(data);
    case "payment.failed":      return onPaymentFailed(data);
    case "membership.created":  return onMembershipCreated(data);
    case "membership.updated":  return onMembershipUpdated(data);
    case "membership.cancelled":return onMembershipCancelled(data);
    default:
      console.log(`ℹ️  Unhandled event type: ${type}`);
  }
}

/** Extract internal_member_id from checkout configuration metadata, if present. */
function getInternalMemberId(data) {
  return data?.metadata?.internal_member_id ?? null;
}

function onPaymentSucceeded(data) {
  const internalMemberId = getInternalMemberId(data);
  console.log(
    `✅ Payment succeeded: ${data.id} — $${data.amount / 100} ${data.currency?.toUpperCase()}` +
    (internalMemberId ? ` | internal_member_id: ${internalMemberId}` : ""),
  );
  if (internalMemberId) {
    console.log(`   → internal_member_id: ${internalMemberId}`);
  }
  // TODO: fulfil order, grant access, update DB
}

function onPaymentFailed(data) {
  const internalMemberId = getInternalMemberId(data);
  console.log(
    `❌ Payment failed: ${data.id} — ${data.failure_reason ?? "unknown reason"}` +
    (internalMemberId ? ` | internal_member_id: ${internalMemberId}` : ""),
  );
  // TODO: notify user, retry logic
}

function onMembershipCreated(data) {
  const internalMemberId = getInternalMemberId(data);
  console.log(
    `🎉 Membership created: ${data.id} for user ${data.user_id}` +
    (internalMemberId ? ` | internal_member_id: ${internalMemberId}` : ""),
  );
  if (internalMemberId) {
    console.log(`   → internal_member_id: ${internalMemberId}`);
  }
  // TODO: provision access, send welcome email
}

function onMembershipUpdated(data) {
  const internalMemberId = getInternalMemberId(data);
  console.log(
    `🔄 Membership updated: ${data.id} — status: ${data.status}` +
    (internalMemberId ? ` | internal_member_id: ${internalMemberId}` : ""),
  );
  // TODO: update access based on new status
}

function onMembershipCancelled(data) {
  const internalMemberId = getInternalMemberId(data);
  console.log(
    `🚫 Membership cancelled: ${data.id}` +
    (internalMemberId ? ` | internal_member_id: ${internalMemberId}` : ""),
  );
  // TODO: revoke access, send cancellation email
}
