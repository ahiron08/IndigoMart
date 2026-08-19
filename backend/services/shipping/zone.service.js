import ShippingZoneRule from '../../models/ShippingZoneRule.model.js';
import { getShippingConfig } from './config.service.js';
import { SHIPPING_ZONE_CODES } from './constants.js';
import { getPincodeMetadata } from './pincode.service.js';

/**
 * Zone engine.
 *
 * The zone is derived server-side from origin + destination PINs. Resolution
 * order:
 *   1. Explicit `zone` stored on the destination Pincode record (if any).
 *   2. Configurable ShippingZoneRule whose [fromPrefix..toPrefix] matches the
 *      destination PIN's leading digit.
 *   3. Configured default zone.
 *
 * These rules are stored in the database so zone boundaries can change without
 * code changes. Delhivery's exact zone grid is intentionally NOT hardcoded.
 */

const zoneRuleCache = new Map();
const ZONE_RULE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const now = () => Date.now();

const getActiveZoneRules = async () => {
  const cached = zoneRuleCache.get('rules');
  if (cached && now() - cached.cachedAt < ZONE_RULE_TTL_MS) return cached.value;
  const rules = await ShippingZoneRule.find({ isActive: true })
    .sort({ priority: 1, fromPrefix: 1 })
    .lean();
  zoneRuleCache.set('rules', { value: rules, cachedAt: now() });
  return rules;
};

/**
 * Map a PIN's leading digit to a zone using the active rules (first match).
 */
export const resolveZoneFromRules = (pincode, rules) => {
  const prefix = Number(String(pincode).charAt(0));
  if (!Number.isInteger(prefix)) return null;
  return (
    rules.find(
      (rule) => prefix >= rule.fromPrefix && prefix <= rule.toPrefix,
    )?.zoneCode || null
  );
};

/**
 * Resolve the shipping zone for a destination PIN relative to an origin PIN.
 *
 * @param {string} originPincode
 * @param {string} destinationPincode
 * @param {object} [deps] - injectables for testing.
 * @returns {Promise<{zone: string, source: 'local'|'pincode'|'rule'|'default', metadata?: object|null}>}
 */
export const determineZone = async (originPincode, destinationPincode, deps = {}) => {
  const destination = String(destinationPincode);
  const origin = String(originPincode);

  if (destination === origin) {
    return { zone: 'LOCAL', source: 'local', metadata: null };
  }

  const getMeta = deps.getPincodeMetadata || getPincodeMetadata;
  const getConfig = deps.getConfig || getShippingConfig;
  const getZoneRules = deps.getZoneRules || getActiveZoneRules;

  const meta = await getMeta(destination);

  if (meta?.zone && SHIPPING_ZONE_CODES.includes(meta.zone)) {
    return { zone: meta.zone, source: 'pincode', metadata: meta };
  }

  const rules = await getZoneRules();
  const ruleZone = resolveZoneFromRules(destination, rules);
  if (ruleZone) {
    return { zone: ruleZone, source: 'rule', metadata: meta };
  }

  const config = await getConfig();
  const defaultZone = config.defaultZone || 'REST_OF_INDIA';
  return { zone: defaultZone, source: 'default', metadata: meta };
};

export default {
  determineZone,
  resolveZoneFromRules,
};