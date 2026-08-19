# Shipping Cost Calculator

A production-ready, PIN-code + weight (and dimension) based delivery cost calculator.
Supports serviceability checks, zone mapping, slab-based rate cards, COD/express/remote-area
surcharges, tax, and pluggable provider integrations.

> Pricing is data-driven: no code changes are needed to add or change a rate — edit the rate
> cards/zones/pincodes via the admin API (or seed script) and the engine picks them up on the
> next request.


```
backend/services/shipping/
  constants.js        ← shared enums, cache keys, rounding helpers
  config.service.js   ← active ShippingConfig (singleton) + update persistence
  zone.service.js     ← resolves destination PIN -> zone (rule-based, with fallback)
  pincode.service.js  ← serviceability + COD availability checks
  weight.service.js   ← dead vs. volumetric weight, packaging dimensions
  package.service.js  ← combines dimensions + gross weight for a basket
  rate.service.js     ← slab lookup (zone + mode + weight -> price)
  engine.js           ← orchestrator: runs the full pipeline and returns a quote
  seed.js             ← idempotent default data seeder
  providers/          ← pluggable carrier adapters (provider.base, internal, delhivery, shiprocket)

backend/services/shipping.service.js              ← public facade (used by controllers)
backend/controllers/shipping.controller.js        ← public endpoints
backend/controllers/shipping-admin.controller.js  ← admin CRUD endpoints
backend/models/ShippingConfig.model.js
backend/models/ShippingZone.model.js
backend/models/ShippingZoneRule.model.js
backend/models/ShippingRate.model.js
backend/models/Pincode.model.js
```

The engine (`services/shipping/engine.js`) is the single entry point: it receives a normalized
request, runs the pipeline, and returns a fully itemized quote. The public facade
`services/shipping.service.js` exposes:

| Method | Purpose |
|---|---|
| `calculate(request)` | Returns `{ quote, breakdown, selectedProvider }`. |
| `checkServiceability({ destinationPincode, originPincode })` | Returns `{ serviceable, codAvailable, zone }`. |

## Data Model

**ShippingConfig (singleton)** — global switches + default surcharges.

| Field | Type | Default | Description |
|---|---|---|---|
| `baseCharge` | Number | `0` | Flat handling charge added to every quote. |
| `perKmRate` | Number | `0` | Distance-based fallback (km x rate). |
| `expressSurcharge` | Number | `15` | Added when `shippingMode === 'EXPRESS'`. |
| `codCharge` | `{ fixed, percentage }` | `{ 0, 0 }` | COD fee = `max(fixed, orderValue * percentage)`. |
| `remoteAreaSurcharge` | Number | `0` | Added only when resolved zone is `REMOTE`. |
| `volumetricDivisor` | Number | `5000` | `L*B*H (cm) / divisor = volumetric weight (kg)`. |
| `roundingRule` | `'CEIL' | 'ROUND' | 'FLOOR'` | `'CEIL'` | How chargeable weight rounds onto slabs. |
| `defaultZoneId` | ObjectId -> ShippingZone | — | Zone used when a PIN cannot be mapped. |
| `originPincode` | String | — | Origin PIN; same origin/destination => `LOCAL`. |
| `currency` | String | `'INR'` | ISO code. |

**ShippingZone** — logical bands: `LOCAL`, `STANDARD`, `REMOTE` (or `L`/`M`/`H`/`R`).
`priority` (lower first), `isActive` soft-delete.

**ShippingZoneRule** — maps a destination PIN (single or range) or state/district to a zone.
Rules evaluated in `priority` order, first match wins; `isExclusive` short-circuits.

**ShippingRate (rate card)** — core pricing. For `(zone, mode, carrier)` define weight slabs:

| Field | Type | Notes |
|---|---|---|
| `weightFrom` / `weightTo` | Number | Slab bounds (kg). |
| `baseCharge` | Number | Slab base price. |
| `perKgCharge` | Number | Added per kg above `weightFrom` within the slab. |
| `minChargeable` | Number | Payable floor. |
| `mode` | `'SURFACE' | 'EXPRESS' | 'AIR'` | Shipping mode. |
| `carrier` | String | e.g. `internal`, `delhivery`, `shiprocket`. |

**Pincode** — serviceability truth table. `serviceable=false` => quote fails with
`SHIP_NOT_SERVICEABLE`; `codAvailable=false` blocks COD.

**Product** — carries `weight`, `packagedWeight` (preferred), `dimensions`,
`packagedDimensions` (preferred). The engine falls back to system defaults
(`DEFAULT_WEIGHT_KG = 1`, package `50x40x20 cm`) so calculations never crash on incomplete data.

## How Pricing Is Computed

The engine runs this pipeline (see `services/shipping/engine.js`):

1. **Validate request** — items, quantities, payment/shipping mode.
2. **Validate PINs** — origin/destination must be 6-digit Indian PINs.
3. **Serviceability check** — destination must be `serviceable`; COD must be available if
   `paymentMethod === 'COD'`.
4. **Zone resolution** — walk `ShippingZoneRule`s in priority order -> zone. `LOCAL` if
   origin == destination. Fallback to `defaultZoneId`.
5. **Package calculation** — aggregate weight (`SUM packagedWeight * qty`) and dimensions.
6. **Chargeable weight** — `max(deadWeight, volumetricWeight)` where
   `volumetricWeight = (L*B*H) / volumetricDivisor`.
7. **Slab rounding** — round chargeable weight onto slab boundaries per `roundingRule`.
8. **Rate lookup** — find the slab `(zone, mode, carrier)` whose `[weightFrom, weightTo)`
   contains the rounded chargeable weight; fallback to the lowest above-slab.
9. **Base charge** — `slab.baseCharge + perKgCharge * max(0, cw - weightFrom)`, floored by
   `minChargeable`.
10. **Surcharges** — express / COD / remote-area.
11. **Tax** — `taxRate%` on the **pre-tax subtotal** (`base + surcharges`).
12. **Total** — `preTaxSubtotal + taxAmount + config.baseCharge`.

The response includes a full `breakdown` object (weights, surcharges, tax, currency) plus a
`selectedProvider` name.

**Error codes:** `SHIP_INVALID_PINCODE`, `SHIP_NOT_SERVICEABLE`, `SHIP_COD_NOT_AVAILABLE`,
`SHIP_NO_RATES`.

## Provider Integrations

`providers/provider.base.js` defines a `ShippingProvider` interface so carriers can be swapped
without touching the engine:

```
class ShippingProvider {
  async getName()                            // e.g. "Internal"
  async calculate(ctx)                       // { zone, mode, chargeableWeight, dimensions }
                                             // -> { shippingCharges, currency, provider, etb }
  async track(trackingId)                    // optional
  async cancel(bookingId)                    // optional
}
```

The engine always falls back to `internal.provider.js` (data-driven rate cards from
`ShippingRate`). External providers (`delhivery`, `shiprocket`) delegate to each carrier's API
and are selected by `ShippingConfig.carrierPreferences` order.

## Public API

Mounted without admin gating (see `routes/shipping.routes.js`):

```
GET /api/shipping/serviceability?deliveryPincode=560001&pickupPincode=110001
-> { serviceable, codAvailable, zone }

GET /api/shipping/estimate
    ?destinationPincode=560001&originPincode=110001
    &items[0][productId]=...&items[0][quantity]=2
    &paymentMethod=PREPAID&shippingMode=SURFACE&orderValue=499
-> { quote, breakdown, selectedProvider }

GET /api/shipping/products/:productId/dimensions
-> { weight, packagedWeight, dimensions, packagedDimensions }
```

## Admin API (rate management)

All routes are under `/api/admin/shipping/*` and require an admin (`authenticate` +
`authorize('admin')`). Write endpoints are validated with Zod schemas.

| Method | Route | Description |
|---|---|---|
| `GET` | `/admin/shipping/stats` | Counts of zones/rules/rates/pincodes. |
| `GET` | `/admin/shipping/config` | Get active config. |
| `PUT` | `/admin/shipping/config` | Update config (partial; `configSchema`). |
| `GET` | `/admin/shipping/zones` | List zones (page/limit). |
| `POST` | `/admin/shipping/zones` | Create zone (`createZoneSchema`). |
| `PUT` | `/admin/shipping/zones/:id` | Update zone. |
| `DELETE` | `/admin/shipping/zones/:id` | Delete zone. |
| `GET` | `/admin/shipping/zones/rules` | List zone rules. |
| `POST` | `/admin/shipping/zones/rules` | Create rule (`createZoneRuleSchema`). |
| `PUT` | `/admin/shipping/zones/rules/:id` | Update rule. |
| `DELETE` | `/admin/shipping/zones/rules/:id` | Delete rule. |
| `GET` | `/admin/shipping/rates` | List rates (filter by mode/zone/carrier). |
| `POST` | `/admin/shipping/rates` | Create rate (`createRateSchema`). |
| `PUT` | `/admin/shipping/rates/:id` | Update rate. |
| `DELETE` | `/admin/shipping/rates/:id` | Delete rate. |
| `GET` | `/admin/shipping/pincodes` | List pincodes (search + serviceable filter). |
| `POST` | `/admin/shipping/pincodes` | Upsert pincode by PIN (`upsertPincodeSchema`). |
| `POST` | `/admin/shipping/seed` | (Re)seed defaults — idempotent. |

## How to Add / Update a Rate

1. Ensure the destination zone exists: `POST /admin/shipping/zones` with
   `{ zoneCode: 'STANDARD', name: 'Standard', priority: 20 }`.
2. Map PINs to the zone: `POST /admin/shipping/zones/rules` with
   `{ zone: 'STANDARD', pincodeRanges: [{ from: 560001, to: 560099 }], priority: 20 }`.
3. Add the rate card: `POST /admin/shipping/rates` with
   `{ zone: 'STANDARD', mode: 'SURFACE', carrier: 'internal', weightFrom: 0.5, weightTo: 1.0, baseCharge: 50, perKgCharge: 10, minChargeable: 50 }`.

**Common ops:** change a price -> `PUT /admin/shipping/rates/:id`; add heavier tiers -> POST
additional `ShippingRate` docs for the same `zone+mode+carrier`; retire a zone -> set
`ShippingZone.isActive = false`; block a PIN -> set `Pincode.serviceable = false`.

## Configuration

Environment variables (see `backend/.env.example`):

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string. |
| `SHIPPING_DEFAULT_CONFIG` | no | JSON string merged onto the default config at startup/seed. |
| `SHIPPING_TAX_RATE` | no | Override the default tax rate (percent on pre-tax subtotal). |

## Database Seeding

- `npm run seed:shipping` (`backend/scripts/seedShipping.js`) runs `seedShippingDefaults()`,
  which is **idempotent**: creates a `ShippingConfig` if missing, upserts zones
  (`LOCAL/STANDARD/REMOTE`), upserts zone rules (major metros + a REST-OF-INDIA default), and
  upserts `SURFACE`/`EXPRESS` rate slabs. Re-running never overwrites manual edits.
- `POST /admin/shipping/seed` runs the same seeder via the admin API.

## Caching

`cache.service.js` provides an in-process TTL cache. `ShippingConfig` and the flat PIN->zone map
are cached by key (`shipping:config`, `shipping:zoneMap`). Config writes, zone-rule writes, and
the seeder **invalidate** the affected cache entries so changes are picked up immediately.

## Frontend

The checkout uses the estimate endpoint through a typed hook:

```js
import { useShippingEstimate } from '../hooks/useShippingEstimate';
const { estimate, loading, error } = useShippingEstimate();
const quote = await estimate({
  destinationPincode, items, paymentMethod, shippingMode, orderValue,
});
// -> { quote, breakdown, selectedProvider }
```

`components/shipping/ShippingEstimateCard.jsx` renders the quote with a full itemized
breakdown and stable error states. `utils/format.js` exposes
`formatCurrency(amount, currency)` for display.


