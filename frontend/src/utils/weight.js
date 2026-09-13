/**
 * Weight conversion helpers for product weights.
 *
 * The product weight is always persisted in kilograms. Sellers may enter it
 * in either grams (`g`) or kilograms (`kg`) on the product form, so we convert
 * to the stored unit at the submission boundary.
 */

/**
 * Convert a seller-entered weight (in the given unit) into the stored
 * kilograms. Returns `''` for a blank value or an invalid/negative input so
 * the caller can preserve the optional-weight behaviour.
 *
 * @param {string|number} raw   The value the seller typed.
 * @param {'g'|'kg'} unit       The unit the value is expressed in.
 * @returns {string}            Value in kilograms, or `''` when not usable.
 */
export const toStoredKilograms = (raw, unit) => {
  if (raw === '' || raw == null) return '';
  const normalized = String(raw).replace(',', '.');
  const value = Number(normalized);
  if (Number.isNaN(value) || value < 0) return '';
  return unit === 'g' ? String(value / 1000) : String(value);
};

/**
 * Re-express a value from one unit to another, preserving the physical weight.
 * Used when the seller switches the unit selector.
 *
 * @param {string|number} raw      The current numeric value.
 * @param {'g'|'kg'} fromUnit      The unit of `raw`.
 * @param {'g'|'kg'} toUnit        The target unit.
 * @returns {string}               Re-expressed value.
 */
export const convertWeightUnit = (raw, fromUnit, toUnit) => {
  if (raw === '' || raw == null) return '';
  const value = Number(String(raw).replace(',', '.'));
  if (Number.isNaN(value) || value < 0) return '';
  if (fromUnit === toUnit) return String(value);
  if (fromUnit === 'g' && toUnit === 'kg') return String(value / 1000);
  return String(value * 1000); // kg -> g
};