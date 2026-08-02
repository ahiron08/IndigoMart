# IndigoMart AI-Powered Semantic Search System

## Overview

This document describes the production-ready AI-powered semantic search system implemented for IndigoMart. The system uses vector embeddings and Approximate Nearest Neighbor (ANN) search to understand the meaning and intent behind user queries, rather than relying solely on keyword matching.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Query    │────▶│  Query Expansion │────▶│  Embedding Gen  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Search Results │◀────│  Hybrid Ranking  │◀────│  Vector Search  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        ▲
                                                        │
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Product Create │────▶│  Product Embed   │────▶│   Qdrant DB     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Components

### 1. Embedding Service (`services/embedding.service.js`)

**Responsibilities:**
- Generate embeddings for products using OpenAI's `text-embedding-3-small` model
- Generate embeddings for user search queries
- Expand queries using AI to improve recall
- Build comprehensive product documents for embedding

**Key Functions:**
- `generateProductEmbedding(product)` - Creates vector embedding from product data
- `generateQueryEmbedding(query)` - Creates vector embedding from search query
- `expandQuery(query)` - Expands query with synonyms and related terms
- `buildProductDocument(product)` - Combines product fields into searchable text

**Product Document Fields:**
- Title
- Description / Short Description
- Category Name
- Brand
- Subcategory
- Creator Name
- Shop Name / Seller Name
- Product Condition
- SKU
- Tags
- Specifications (key: value pairs)
- Shipping Time
- Meta Title / Description
- Search Keywords

### 2. Vector Database Service (`services/vector.service.js`)

**Responsibilities:**
- Manage Qdrant vector database connection
- Create and maintain the product embeddings collection
- Index products for semantic search
- Perform ANN (Approximate Nearest Neighbor) search
- Handle batch indexing for bulk operations

**Key Functions:**
- `ensureCollection()` - Creates Qdrant collection if it doesn't exist
- `indexProduct(product)` - Indexes a single product
- `batchIndexProducts(products)` - Batch indexes multiple products
- `searchSimilarProducts(queryVector, options)` - Performs vector similarity search
- `deleteProductIndex(productId)` - Removes product from index
- `rebuildProductEmbedding(product)` - Regenerates embedding for a product
- `getIndexingStats()` - Returns collection statistics
- `getProductEmbeddingStatus(productId)` - Checks if product is indexed

**Collection Configuration:**
- Distance Metric: Cosine
- Vector Dimensions: 1536 (configurable)
- Indexing Threshold: 20,000 vectors
- Optimized for production workloads

### 3. Search Ranking Service (`services/search-ranking.service.js`)

**Responsibilities:**
- Combine multiple ranking signals into a final score
- Normalize scores for fair comparison
- Sort results by relevance

**Ranking Formula:**
```
Final Score = 
  40% Semantic Similarity
+ 25% Exact Title Match
+ 25% Keyword Match Score
+ 10% Popularity (order count)
+ 10% Rating
+ 10% Sales (order count)
```

**Key Functions:**
- `rankSearchResults(results, query)` - Ranks vector search results
- `getSearchSuggestions(products, query)` - Generates search suggestions
- `getTrendingSearches()` - Returns trending search terms

### 4. Search Service (`services/search.service.js`)

**Responsibilities:**
- Orchestrate the complete search flow
- Implement hybrid search (semantic + filters)
- Handle query expansion and caching
- Provide similar product recommendations
- Generate search suggestions

**Key Functions:**
- `semanticSearch(query)` - Main search function with hybrid ranking
- `getSimilarProducts(productId, limit)` - Find similar products
- `getSearchSuggestions(query)` - Real-time search suggestions
- `getTrendingSearches()` - Popular search terms

**Search Flow:**
1. Check cache for existing results
2. Expand query using AI (if enabled)
3. Generate query embedding
4. Perform vector search in Qdrant
5. Apply MongoDB filters
6. Rank results using hybrid scoring
7. Fetch full product details from MongoDB
8. Cache results
9. Return paginated results

### 5. Cache Service (`services/cache.service.js`)

**Responsibilities:**
- Cache search results (60s TTL)
- Cache query embeddings (1 hour TTL)
- Reduce API calls and improve latency

**Cache Strategy:**
- Search results: 60 seconds TTL, max 1000 entries
- Embeddings: 1 hour TTL, max 2000 entries
- LRU eviction when limits exceeded

## API Endpoints

### Public Endpoints

#### `GET /api/search`
Main semantic search endpoint.

**Query Parameters:**
- `q` or `keyword` (required) - Search query
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `category` - Category ID or slug
- `brand` - Brand name
- `minPrice` / `maxPrice` - Price range
- `inStock` - Filter by availability (true/false)
- `minRating` - Minimum rating (0-5)
- `tags` - Comma-separated tags
- `sort` - Sort order (newest, oldest, price-asc, price-desc, popularity, rating, views, best-selling)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Oversized Black Anime Hoodie",
      "price": 49.99,
      "_score": 0.89,
      "_scores": {
        "semantic": 0.85,
        "exactTitleMatch": 0,
        "keywordMatch": 0.75,
        "popularity": 0.5,
        "rating": 0.8,
        "sales": 0.6,
        "final": 0.89
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "meta": {
    "mode": "semantic",
    "expandedQuery": "hoodie sweatshirt fleece pullover winter clothing"
  }
}
```

#### `GET /api/search/suggestions`
Real-time search suggestions.

**Query Parameters:**
- `q` or `keyword` - Partial search query (min 2 characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "Oversized Black Anime Hoodie",
        "productId": "...",
        "score": 0.92,
        "type": "product"
      }
    ]
  }
}
```

#### `GET /api/search/trending`
Trending search terms.

**Response:**
```json
{
  "success": true,
  "data": {
    "trending": [
      {
        "text": "black oversized anime hoodie",
        "count": 245
      }
    ]
  }
}
```

#### `GET /api/search/:id/similar`
Similar products for a given product.

**Query Parameters:**
- `limit` - Number of results (default: 6)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "...",
        "title": "Similar Product",
        "_score": 0.85
      }
    ]
  }
}
```

### Admin Endpoints

#### `GET /api/admin/search/embeddings/stats`
Get vector database statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "pointsCount": 1250,
    "vectorsCount": 1250,
    "status": "green"
  }
}
```

#### `GET /api/admin/search/embeddings/missing`
Find products missing embeddings.

**Query Parameters:**
- `page` - Page number
- `limit` - Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "missing": [
      {
        "_id": "...",
        "title": "Product Name",
        "embeddingStatus": {
          "exists": false
        }
      }
    ],
    "pagination": { ... }
  }
}
```

#### `POST /api/admin/search/embeddings/rebuild-all`
Rebuild all product embeddings.

**Response:**
```json
{
  "success": true,
  "message": "Embedding rebuild completed.",
  "data": {
    "success": 1250,
    "failed": 0,
    "skipped": 0
  }
}
```

#### `POST /api/admin/search/embeddings/rebuild/:productId`
Rebuild embedding for a specific product.

**Response:**
```json
{
  "success": true,
  "message": "Product embedding rebuilt.",
  "data": {
    "productId": "...",
    "previousStatus": { "exists": false },
    "result": { "success": true, "indexed": true }
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Optional, for Qdrant Cloud
QDRANT_COLLECTION_NAME=indigomart_products

# Embedding Configuration
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Feature Flags
ENABLE_SEMANTIC_SEARCH=true
QUERY_EXPANSION_ENABLED=true
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Qdrant

**Option A: Docker (Recommended)**
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

**Option B: Qdrant Cloud**
Sign up at [cloud.qdrant.io](https://cloud.qdrant.io) and get your API key.

### 3. Configure Environment

Add the required environment variables to `.env`:
- `OPENAI_API_KEY` - Your OpenAI API key
- `QDRANT_URL` - Qdrant instance URL
- `QDRANT_API_KEY` - Optional, for Qdrant Cloud

### 4. Initialize Search System

```bash
node scripts/initSearch.js
```

This will:
1. Create the Qdrant collection
2. Index all existing products

### 5. Start the Server

```bash
npm run dev
```

## How It Works

### Product Indexing

When a product is created or updated:

1. Product data is saved to MongoDB
2. Asynchronously, the product is converted to a searchable document
3. OpenAI generates a 1536-dimensional embedding vector
4. The vector and metadata are stored in Qdrant
5. The product is now searchable via semantic search

**Note:** Indexing happens asynchronously to avoid blocking the API response.

### Search Flow

When a user searches:

1. **Query Expansion** (optional): AI expands the query with related terms
   - Example: "hoodie" → "hoodie sweatshirt fleece pullover winter clothing"

2. **Embedding Generation**: Query is converted to a vector using the same model

3. **Vector Search**: Qdrant finds the top 100 most similar product vectors

4. **Filtering**: MongoDB filters are applied (category, price, availability, etc.)

5. **Hybrid Ranking**: Results are re-ranked using:
   - Semantic similarity (40%)
   - Exact title match (25%)
   - Keyword match (25%)
   - Popularity, rating, and sales (10% each)

6. **Caching**: Results are cached for 60 seconds

7. **Response**: Paginated results with relevance scores

### Natural Language Understanding

The system understands intent and context:

**Query:** "gaming mouse"
**Finds:** RGB Wireless Mouse, Ultra-Light Esports Mouse, Pro Gaming Mouse

**Query:** "study lamp"
**Finds:** LED Desk Lamp, Minimal Reading Light

**Query:** "things for coding"
**Finds:** Mechanical Keyboard, Laptop Stand, Wireless Mouse, Monitor Light Bar

**Query:** "cute gifts"
**Finds:** Plush Toys, Keychains, Custom Mugs, Decor Items

### Typo Tolerance

The semantic search naturally handles typos:

- "iphnoe" → finds iPhones
- "hoodiee" → finds hoodies
- "mechnical keybord" → finds mechanical keyboards
- "wireles mouse" → finds wireless mice

## Performance Optimization

### Caching Strategy

1. **Search Results Cache**: 60s TTL
   - Reduces repeated vector searches
   - Invalidated on product updates

2. **Embedding Cache**: 1 hour TTL
   - Avoids regenerating embeddings for identical queries
   - Significant cost savings on OpenAI API

### Batch Operations

- `batchIndexProducts()` - Indexes multiple products in a single Qdrant upsert
- Reduces API calls and improves throughput
- Used for initial indexing and rebuilds

### Async Indexing

- Product indexing happens asynchronously after creation/update
 - API responses are not blocked
- Failed indexing is logged but doesn't fail the request

## Admin Tools

### Rebuild All Embeddings

```bash
POST /api/admin/search/embeddings/rebuild-all
```

Use this when:
- Changing embedding models
- Updating product document structure
- Fixing corrupted embeddings

### Check Embedding Status

```bash
GET /api/admin/search/embeddings/stats
GET /api/admin/search/embeddings/missing
```

### Rebuild Single Product

```bash
POST /api/admin/search/embeddings/rebuild/:productId
```

## Monitoring

### Key Metrics to Track

1. **Search Latency**: Target < 300ms
   - Vector search: ~50-100ms
   - MongoDB fetch: ~20-50ms
   - Embedding generation: ~100-200ms (cached after first call)

2. **Cache Hit Rate**: Aim for > 60%
   - Indicates effective caching

3. **Indexing Success Rate**: Should be > 95%
   - Monitor for failed embeddings

4. **Qdrant Collection Size**: Track growth over time

### Logging

All operations are logged:
- Embedding generation failures
- Indexing errors
- Vector search failures
- Cache hits/misses (in production, use a metrics system)

## Scaling Considerations

### Current Architecture (Up to 100K Products)

- Single Qdrant instance
- In-memory caching
- Synchronous vector search

### Scaling to 1M+ Products

1. **Qdrant Cluster**: Deploy Qdrant in distributed mode
2. **Redis Cache**: Replace in-memory cache with Redis
3. **Async Search**: Use message queues for embedding generation
4. **CDN**: Cache trending searches and suggestions at CDN level
5. **Read Replicas**: MongoDB read replicas for product data

## Future Enhancements

### Personalization (Ready for Implementation)

The architecture supports adding personalization signals:

```javascript
// Future: Add to vector search filter
const personalizationFilter = {
  preferredCategories: user.preferences.categories,
  preferredBrands: user.preferences.brands,
  priceRange: user.preferences.priceRange,
};
```

### Multi-Modal Search

Extend to support image-based search:

```javascript
// Future: Image embeddings
const imageEmbedding = await generateImageEmbedding(productImage);
```

### Conversational Search

The modular design supports adding conversational context:

```javascript
// Future: Conversation-aware search
const context = await getConversationContext(sessionId);
const contextualQuery = `${query} ${context.previousQueries.join(' ')}`;
```

## Troubleshooting

### Qdrant Connection Issues

```bash
# Check if Qdrant is running
curl http://localhost:6333/healthz

# Check collection status
curl http://localhost:6333/collections/indigomart_products
```

### Embedding Generation Failures

- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota and billing
- Review logs for specific error messages

### Missing Embeddings

```bash
# Find products without embeddings
GET /api/admin/search/embeddings/missing

# Rebuild all embeddings
POST /api/admin/search/embeddings/rebuild-all
```

### Slow Search Performance

- Check cache hit rate
- Verify Qdrant indexing is complete
- Consider reducing `scoreThreshold` to return fewer results
- Monitor OpenAI API latency

## Cost Estimation

### OpenAI API Costs (text-embedding-3-small)

- $0.02 per 1M tokens
- Average product document: ~200 tokens
- Average query: ~10 tokens

**Example:**
- 10,000 products = 2M tokens = $0.04 (one-time indexing)
- 100,000 searches/month = 1M tokens = $0.02/month

### Qdrant Costs

- Self-hosted: Free (infrastructure only)
- Qdrant Cloud: Free tier available, paid plans start at ~$25/month

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Review Qdrant dashboard at `http://localhost:6333/dashboard`
3. Verify environment variables are set correctly
4. Test with the admin endpoints to diagnose issues