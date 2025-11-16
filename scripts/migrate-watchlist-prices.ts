/**
 * Migration script to populate addedPrice for existing watchlist entries
 * This is OPTIONAL - the app works fine without running this
 * 
 * Run with: npx tsx scripts/migrate-watchlist-prices.ts
 */

import { connectToDb } from '../database/mongoose';
import { Watchlist } from '../database/models/watchlist.model';
import { getQuotes } from '../lib/actions/finnhub.actions';

async function migrateWatchlistPrices() {
    console.log('🚀 Starting watchlist price migration...');
    
    try {
        // Connect to database
        await connectToDb();
        console.log('✅ Connected to database');
        
        // Find all watchlist entries without addedPrice
        const entriesWithoutPrice = await Watchlist.find({
            $or: [
                { addedPrice: { $exists: false } },
                { addedPrice: null }
            ]
        }).lean();
        
        console.log(`📊 Found ${entriesWithoutPrice.length} entries without addedPrice`);
        
        if (entriesWithoutPrice.length === 0) {
            console.log('✨ All entries already have addedPrice set. Nothing to do!');
            process.exit(0);
        }
        
        // Get unique symbols
        const symbols = Array.from(new Set(entriesWithoutPrice.map(e => e.symbol)));
        console.log(`🔍 Fetching current prices for ${symbols.length} unique symbols...`);
        
        // Fetch current prices
        const quotes = await getQuotes(symbols);
        
        // Update each entry
        let updated = 0;
        let skipped = 0;
        
        for (const entry of entriesWithoutPrice) {
            const quote = quotes[entry.symbol];
            if (quote && quote.price) {
                // Extract numeric price from formatted string (e.g., "$123.45" -> 123.45)
                const priceMatch = quote.price.match(/[\d.]+/);
                if (priceMatch) {
                    const priceNum = parseFloat(priceMatch[0]);
                    
                    await Watchlist.updateOne(
                        { _id: entry._id },
                        { $set: { addedPrice: priceNum } }
                    );
                    
                    updated++;
                    console.log(`  ✓ Updated ${entry.symbol} with price $${priceNum}`);
                } else {
                    skipped++;
                    console.log(`  ⚠ Skipped ${entry.symbol} - could not parse price`);
                }
            } else {
                skipped++;
                console.log(`  ⚠ Skipped ${entry.symbol} - no quote available`);
            }
        }
        
        console.log('\n📈 Migration complete!');
        console.log(`  ✅ Updated: ${updated}`);
        console.log(`  ⚠ Skipped: ${skipped}`);
        console.log(`  📊 Total: ${entriesWithoutPrice.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateWatchlistPrices();
