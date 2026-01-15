#!/usr/bin/env node

/**
 * Database Migration Script
 * Updates all source_type from "Right / Conservative" to "Right / Traditionalist"
 * Also updates "Conservative" to "Traditionalist"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const News = require('../src/models/News');

const updateSourceTypes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Add database name to URI if not present
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri.includes('mongodb.net/') || mongoUri.includes('mongodb.net/?')) {
      mongoUri = mongoUri.replace('mongodb.net/?', 'mongodb.net/test?');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all news articles with Conservative in source_type
    console.log('🔍 Finding articles with Conservative source types...');
    const articles = await News.find({
      'source.source_type': { 
        $in: ['Right / Conservative', 'Conservative'] 
      }
    });

    console.log(`📊 Found ${articles.length} articles to update\n`);

    if (articles.length === 0) {
      console.log('✅ No articles need updating. All done!');
      process.exit(0);
    }

    let updatedCount = 0;
    let totalSourcesUpdated = 0;

    // Update each article
    for (const article of articles) {
      let articleModified = false;
      
      // Update each source in the article
      for (const source of article.source) {
        if (source.source_type === 'Right / Conservative') {
          console.log(`  📝 Updating: "${article.title.substring(0, 50)}..."`);
          console.log(`     Old: ${source.source_type}`);
          source.source_type = 'Right / Traditionalist';
          console.log(`     New: ${source.source_type}\n`);
          articleModified = true;
          totalSourcesUpdated++;
        } else if (source.source_type === 'Conservative') {
          console.log(`  📝 Updating: "${article.title.substring(0, 50)}..."`);
          console.log(`     Old: ${source.source_type}`);
          source.source_type = 'Traditionalist';
          console.log(`     New: ${source.source_type}\n`);
          articleModified = true;
          totalSourcesUpdated++;
        }
      }

      // Save the article if modified
      if (articleModified) {
        await article.save();
        updatedCount++;
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log(`📊 Articles updated: ${updatedCount}`);
    console.log(`📊 Total sources updated: ${totalSourcesUpdated}`);
    console.log('═══════════════════════════════════════\n');

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const remainingConservative = await News.find({
      'source.source_type': { 
        $in: ['Right / Conservative', 'Conservative'] 
      }
    });

    if (remainingConservative.length === 0) {
      console.log('✅ Verification passed! No Conservative entries remain.\n');
    } else {
      console.log(`⚠️  Warning: ${remainingConservative.length} articles still have Conservative entries.\n`);
    }

    // Show sample of updated data
    console.log('📋 Sample of updated source types:');
    const sampleArticles = await News.find({
      'source.source_type': { 
        $in: ['Right / Traditionalist', 'Traditionalist'] 
      }
    }).limit(3);

    sampleArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title.substring(0, 60)}...`);
      const traditionalistSources = article.source.filter(s => 
        s.source_type === 'Right / Traditionalist' || s.source_type === 'Traditionalist'
      );
      traditionalistSources.forEach(source => {
        console.log(`   - ${source.source_type}`);
      });
    });

    console.log('\n✅ All done! You can now close this script.');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the migration
console.log('═══════════════════════════════════════');
console.log('🚀 Starting Source Type Migration');
console.log('   Conservative → Traditionalist');
console.log('═══════════════════════════════════════\n');

updateSourceTypes();
