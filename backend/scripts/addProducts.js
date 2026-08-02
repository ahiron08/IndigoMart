import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const uniqueProductSlug = async (title) => {
  const base = createSlug(title) || `product-${crypto.randomBytes(4).toString("hex")}`;
  let slug = base;
  while (await Product.exists({ slug })) {
    slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  }
  return slug;
};

const productsByCategory = {
  Electronics: {
    title: "Wireless Bluetooth Noise-Cancelling Headphones",
    description:
      "Experience premium sound quality with these wireless Bluetooth headphones featuring active noise cancellation technology. Enjoy up to 30 hours of battery life, comfortable over-ear cushions for extended listening sessions, and a foldable design for easy portability. The built-in microphone allows for hands-free calls, and the quick charge feature gives you 3 hours of playback with just 10 minutes of charging. Compatible with all Bluetooth-enabled devices including smartphones, tablets, and laptops. Perfect for commuters, travelers, and music enthusiasts who demand the best audio experience.",
    shortDescription: "Premium wireless headphones with ANC, 30hr battery, and foldable design",
    price: 4999,
    discountPrice: 3499,
    discountPercentage: 30,
    brand: "SoundMax",
    subcategory: "Audio & Headphones",
    stock: 150,
    tags: ["headphones", "wireless", "bluetooth", "noise-cancelling", "audio", "music"],
    specifications: [
      { key: "Connectivity", value: "Bluetooth 5.3" },
      { key: "Battery Life", value: "30 hours" },
      { key: "Charging", value: "USB-C, 10 min charge = 3 hrs playback" },
      { key: "Driver Size", value: "40mm" },
      { key: "Frequency Response", value: "20Hz - 20kHz" },
      { key: "Weight", value: "250g" },
      { key: "Warranty", value: "1 Year" },
    ],
    shippingDetails: {
      weight: 0.35,
      dimensions: { length: 20, width: 18, height: 8 },
      shippingTime: "3-5 business days",
      returnAvailable: true,
      returnWindow: 10,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "SM-HP-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    codAvailable: true,
    shippingCharge: 50,
    taxIncluded: true,
    featured: true,
    status: "published",
    isApproved: true,
    searchKeywords: "wireless headphones bluetooth noise cancelling earphones",
  },
  Fashion: {
    title: "Premium Cotton Slim Fit Casual Shirt",
    description:
      "Elevate your wardrobe with this premium cotton slim fit casual shirt crafted from 100% pure cotton fabric. Designed for the modern man who values both style and comfort, this shirt features a classic spread collar, button-down front, and adjustable cuffs. The breathable fabric ensures all-day comfort in any weather, while the tailored fit provides a sharp, contemporary silhouette. Available in multiple colors, this versatile shirt pairs perfectly with chinos, jeans, or dress trousers for a smart casual look that transitions effortlessly from office to evening outings.",
    shortDescription: "100% pure cotton slim fit shirt for men - breathable & stylish",
    price: 1899,
    discountPrice: 1299,
    discountPercentage: 32,
    brand: "UrbanThreads",
    subcategory: "Men's Clothing",
    stock: 200,
    tags: ["shirt", "cotton", "casual", "slim-fit", "mens-fashion", "formal"],
    specifications: [
      { key: "Material", value: "100% Pure Cotton" },
      { key: "Fit", value: "Slim Fit" },
      { key: "Collar Style", value: "Spread Collar" },
      { key: "Sleeve Length", value: "Full Sleeve" },
      { key: "Care Instructions", value: "Machine Wash Cold" },
      { key: "Size Range", value: "S - 3XL" },
      { key: "Warranty", value: "30 Days Exchange" },
    ],
    shippingDetails: {
      weight: 0.3,
      dimensions: { length: 30, width: 25, height: 3 },
      shippingTime: "2-4 business days",
      returnAvailable: true,
      returnWindow: 7,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "UT-SH-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 20,
    codAvailable: true,
    shippingCharge: 40,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "cotton shirt casual slim fit men fashion clothing",
  },
  "Home & Decor": {
    title: "Handcrafted Ceramic Vase Set - 3 Pieces",
    description:
      "Transform your living space with this elegant handcrafted ceramic vase set featuring three distinct sizes and complementary earthy tones. Each piece is meticulously shaped by skilled artisans using traditional pottery techniques, ensuring that no two sets are exactly alike. The minimalist yet organic design blends seamlessly with both modern and traditional decor styles. Use them as standalone statement pieces or arrange them together with dried flowers, pampas grass, or artificial botanicals for a stunning centerpiece that adds warmth and character to your home, office, or entryway.",
    shortDescription: "Set of 3 handcrafted ceramic vases - earthy tones, artisan made",
    price: 2499,
    discountPrice: 1799,
    discountPercentage: 28,
    brand: "ArtisanCraft",
    subcategory: "Home Decor Accents",
    stock: 75,
    tags: ["vase", "ceramic", "home-decor", "handcrafted", "artisan", "centerpiece"],
    specifications: [
      { key: "Material", value: "High-grade Ceramic" },
      { key: "Number of Pieces", value: "3" },
      { key: "Dimensions (Large)", value: "12 x 8 inches" },
      { key: "Dimensions (Medium)", value: "9 x 6 inches" },
      { key: "Dimensions (Small)", value: "6 x 4 inches" },
      { key: "Color", value: "Earthy Beige / Terracotta / Matte White" },
      { key: "Care Instructions", value: "Wipe with dry cloth" },
    ],
    shippingDetails: {
      weight: 2.5,
      dimensions: { length: 35, width: 25, height: 25 },
      shippingTime: "5-7 business days",
      returnAvailable: true,
      returnWindow: 5,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "AC-VS-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 5,
    codAvailable: true,
    shippingCharge: 100,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "ceramic vase set home decor handcrafted artisan centerpiece",
  },
  Beauty: {
    title: "Vitamin C Face Serum with Hyaluronic Acid - 30ml",
    description:
      "Revitalize your skin with our advanced Vitamin C Face Serum enriched with 20% pure Vitamin C, Hyaluronic Acid, and Vitamin E. This powerful antioxidant formula works to brighten dull skin, reduce dark spots and hyperpigmentation, boost collagen production, and deeply hydrate for a radiant, youthful complexion. The lightweight, non-greasy formula absorbs quickly into the skin and is suitable for all skin types including sensitive skin. Dermatologist tested and free from parabens, sulfates, and artificial fragrances. Use daily for visible results in just 2 weeks of consistent application.",
    shortDescription: "20% Vitamin C serum with Hyaluronic Acid - brightens, hydrates & anti-aging",
    price: 899,
    discountPrice: 599,
    discountPercentage: 33,
    brand: "GlowEssence",
    subcategory: "Skin Care",
    stock: 300,
    tags: ["vitamin-c", "serum", "skincare", "anti-aging", "brightening", "hyaluronic-acid"],
    specifications: [
      { key: "Active Ingredients", value: "20% Vitamin C, Hyaluronic Acid, Vitamin E" },
      { key: "Volume", value: "30ml" },
      { key: "Skin Type", value: "All Skin Types" },
      { key: "Shelf Life", value: "12 Months from Manufacture" },
      { key: "Free From", value: "Parabens, Sulfates, Phthalates" },
      { key: "Usage", value: "Apply 3-4 drops morning and night" },
      { key: "Manufactured In", value: "India" },
    ],
    shippingDetails: {
      weight: 0.08,
      dimensions: { length: 12, width: 4, height: 4 },
      shippingTime: "2-3 business days",
      returnAvailable: false,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "GE-SR-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    codAvailable: true,
    shippingCharge: 30,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "vitamin c serum face serum hyaluronic acid skincare brightening anti aging",
  },
  Sports: {
    title: "Professional Yoga Mat - Extra Thick Non-Slip Exercise Mat",
    description:
      "Achieve your fitness goals with our professional-grade yoga mat crafted from high-density TPE material. At 6mm thickness, this extra-thick mat provides superior cushioning for joints and bones during floor exercises, yoga poses, pilates, and stretching routines. The dual-layer non-slip texture on both sides ensures you stay stable and secure in every pose, while the moisture-resistant surface is easy to clean and maintain. Includes a carrying strap for convenient transport to the gym, studio, or park. Lightweight yet durable, this mat is designed to withstand daily use and maintain its shape over time.",
    shortDescription: "6mm thick TPE yoga mat with non-slip surface and carrying strap",
    price: 1499,
    discountPrice: 999,
    discountPercentage: 33,
    brand: "FlexFit",
    subcategory: "Yoga & Pilates",
    stock: 120,
    tags: ["yoga-mat", "exercise", "fitness", "non-slip", "pilates", "workout"],
    specifications: [
      { key: "Material", value: "High-Density TPE" },
      { key: "Thickness", value: "6mm" },
      { key: "Dimensions", value: "183cm x 61cm" },
      { key: "Weight", value: "1.2 kg" },
      { key: "Feature", value: "Dual-sided non-slip texture" },
      { key: "Includes", value: "Carrying Strap" },
      { key: "Warranty", value: "6 Months" },
    ],
    shippingDetails: {
      weight: 1.3,
      dimensions: { length: 65, width: 15, height: 15 },
      shippingTime: "3-5 business days",
      returnAvailable: true,
      returnWindow: 7,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "FF-YM-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 5,
    codAvailable: true,
    shippingCharge: 60,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "yoga mat exercise mat non slip fitness pilates workout mat",
  },
  Books: {
    title: "The Art of Mindful Living: A Practical Guide to Inner Peace",
    description:
      "Discover the transformative power of mindfulness with 'The Art of Mindful Living,' a comprehensive guide that takes you on a journey toward greater awareness, presence, and inner peace. Written by renowned meditation teacher Dr. Ananya Sharma, this book combines ancient wisdom with modern neuroscience to offer practical techniques for reducing stress, improving focus, and cultivating happiness in everyday life. Each chapter includes guided meditations, journaling prompts, and actionable exercises that you can integrate into your daily routine. Whether you're a complete beginner or an experienced practitioner, this book provides the tools you need to live a more mindful, meaningful life.",
    shortDescription: "A practical guide to mindfulness, meditation, and inner peace",
    price: 599,
    discountPrice: 449,
    discountPercentage: 25,
    brand: "Mindful Pages",
    subcategory: "Self-Help & Personal Development",
    stock: 500,
    tags: ["mindfulness", "meditation", "self-help", "personal-development", "wellness", "mental-health"],
    specifications: [
      { key: "Author", value: "Dr. Ananya Sharma" },
      { key: "Format", value: "Paperback" },
      { key: "Pages", value: "320" },
      { key: "Language", value: "English" },
      { key: "Publisher", value: "Mindful Pages Press" },
      { key: "ISBN", value: "978-93-91234-56-7" },
      { key: "Edition", value: "First Edition, 2025" },
    ],
    shippingDetails: {
      weight: 0.4,
      dimensions: { length: 22, width: 14, height: 2 },
      shippingTime: "2-4 business days",
      returnAvailable: true,
      returnWindow: 7,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "MP-BK-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 50,
    codAvailable: true,
    shippingCharge: 30,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "mindfulness book meditation guide self help inner peace mental wellness",
  },
  Toys: {
    title: "STEM Educational Building Blocks Kit - 500 Pieces",
    description:
      "Ignite your child's creativity and love for learning with our STEM Educational Building Blocks Kit featuring 500 high-quality, non-toxic ABS plastic pieces. This comprehensive set includes gears, wheels, connectors, and interlocking blocks in a vibrant array of colors that allow children aged 4-12 to build cars, robots, towers, animals, and unlimited imaginative creations. The kit comes with a detailed instruction booklet featuring 50+ model designs that progressively challenge young minds. Designed to develop fine motor skills, spatial awareness, problem-solving abilities, and logical thinking. Compatible with all major building block brands for endless expansion possibilities.",
    shortDescription: "500-piece STEM building blocks kit - educational, creative, and fun for ages 4-12",
    price: 1999,
    discountPrice: 1399,
    discountPercentage: 30,
    brand: "BrainBuilder",
    subcategory: "Educational Toys",
    stock: 80,
    tags: ["building-blocks", "stem", "educational", "toys", "creative", "learning"],
    specifications: [
      { key: "Piece Count", value: "500" },
      { key: "Material", value: "Non-toxic ABS Plastic" },
      { key: "Age Range", value: "4 - 12 Years" },
      { key: "Model Designs", value: "50+ included" },
      { key: "Compatibility", value: "Compatible with major brands" },
      { key: "Includes", value: "Storage box + Instruction booklet" },
      { key: "Safety Certified", value: "ISO 8124, EN71" },
    ],
    shippingDetails: {
      weight: 1.8,
      dimensions: { length: 30, width: 25, height: 15 },
      shippingTime: "3-5 business days",
      returnAvailable: true,
      returnWindow: 7,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "BB-TY-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 5,
    codAvailable: true,
    shippingCharge: 70,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "building blocks stem toys educational kids creative learning",
  },
  Jewelry: {
    title: "Elegant Sterling Silver Hoop Earrings - Minimalist Design",
    description:
      "Add a touch of timeless elegance to your jewelry collection with these handcrafted sterling silver hoop earrings. Made from genuine 925 sterling silver with a brilliant rhodium plating that prevents tarnishing and maintains lasting shine, these earrings feature a sleek minimalist design with a subtle hammered texture that catches the light beautifully. Measuring 1.5 inches in diameter, they are the perfect size for everyday wear while making a sophisticated statement. The secure latch-back closure ensures they stay comfortably in place all day. Hypoallergenic and nickel-free, these earrings are ideal for sensitive ears. Comes beautifully packaged in a velvet gift box, making it a perfect present for birthdays, anniversaries, or festive occasions.",
    shortDescription: "925 sterling silver hoop earrings with rhodium plating - hypoallergenic & tarnish-free",
    price: 3299,
    discountPrice: 2499,
    discountPercentage: 24,
    brand: "SilverLuxe",
    subcategory: "Earrings",
    stock: 60,
    tags: ["earrings", "sterling-silver", "jewelry", "minimalist", "hoop-earrings", "silver"],
    specifications: [
      { key: "Metal", value: "925 Sterling Silver" },
      { key: "Plating", value: "Rhodium (Tarnish-resistant)" },
      { key: "Diameter", value: "1.5 inches (3.8 cm)" },
      { key: "Closure", value: "Latch-back" },
      { key: "Hypoallergenic", value: "Yes - Nickel-free" },
      { key: "Packaging", value: "Velvet Gift Box" },
      { key: "Warranty", value: "6 Months" },
    ],
    shippingDetails: {
      weight: 0.05,
      dimensions: { length: 8, width: 6, height: 3 },
      shippingTime: "2-4 business days",
      returnAvailable: true,
      returnWindow: 7,
      shippingRegions: ["All India"],
    },
    pickupAddress: "tarajan kakoti gaon jorhat, 785001",
    productCondition: "new",
    sku: "SL-JR-001",
    stockStatus: "in_stock",
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    codAvailable: true,
    shippingCharge: 30,
    taxIncluded: true,
    featured: false,
    status: "published",
    isApproved: true,
    searchKeywords: "sterling silver earrings hoop earrings silver jewelry minimalist handmade",
  },
};

const addProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find the user
    const user = await User.findOne({ email: "samrat@gmail.com" });
    if (!user) {
      console.error("User with email samrat@gmail.com not found");
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    console.log(`Found ${categories.length} categories`);

    let createdCount = 0;

    for (const category of categories) {
      const productData = productsByCategory[category.name];
      if (!productData) {
        console.log(`No product data defined for category: ${category.name}, skipping...`);
        continue;
      }

      // Create the product
      const product = await Product.create({
        ...productData,
        slug: await uniqueProductSlug(productData.title),
        category: category._id,
        creator: user._id,
        sellerId: user._id,
        sellerName: user.name,
        shopName: user.shopName || "Indigo Mart",
        images: [],
        specifications: productData.specifications || [],
        shippingDetails: productData.shippingDetails || {},
        discountPrice: productData.discountPrice || undefined,
        discountPercentage: productData.discountPercentage || 0,
        stockStatus: productData.stockStatus || "in_stock",
        status: "published",
        isApproved: true,
        minOrderQuantity: productData.minOrderQuantity || 1,
        maxOrderQuantity: productData.maxOrderQuantity || 99,
      });

      console.log(`✅ Created product in "${category.name}": ${product.title} (₹${product.price})`);
      createdCount++;
    }

    console.log(`\n🎉 Successfully created ${createdCount} products across ${categories.length} categories!`);
    console.log("All products are published and approved.");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error adding products:", error);
    process.exit(1);
  }
};

addProducts();