require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../connection');

/**
 * Sanitize text to fix common mojibake (encoding artifacts).
 * Replaces common Unicode artifacts with proper characters.
 */
function sanitizeText(text) {
  if (!text) return '';
  
  const replacements = [
    // Common Windows-1252 to UTF-8 mojibake
    ['ΓÇö', '—'],  // em dash
    ['ΓÇ£', '“'],  // left double quote
    ['ΓÇØ', '”'],  // right double quote
    ['ΓÇÖ', '’'],  // right single quote
    ['ΓÇ£', '"'],  // alternative for quotes
    ['ΓÇØ', '"'],
    ['ΓåÆ', '→'],  // arrow
    ['ΓÇô', '-'],  // en dash or hyphen
    ['ΓÇ╣', '›'],  // single right angle quote
    ['ΓÇ║', '‹'],  // single left angle quote
    ['Γé╛', '★'],  // star
    ['Γé┐', '✓'],  // checkmark
    ['Γäó', '™'],  // trademark
    ['Γä⌐', '©'],  // copyright
    // Add more as needed
  ];
  
  let sanitized = text;
  for (const [from, to] of replacements) {
    sanitized = sanitized.replace(new RegExp(from, 'g'), to);
  }
  
  // Also fix any remaining encoding issues
  // Convert Windows-1252 to UTF-8 if needed
  try {
    // If the string has mojibake patterns, try to fix
    if (sanitized.includes('Ã') || sanitized.includes('Â')) {
      // This is a complex fix that might require iconv, but we'll keep it simple
      // and just replace common patterns
      const commonMojibake = [
        ['Ã©', 'é'],
        ['Ã¨', 'è'],
        ['Ãª', 'ê'],
        ['Ã«', 'ë'],
        ['Ã¡', 'á'],
        ['Ã ', 'à'],
        ['Ã¢', 'â'],
        ['Ã£', 'ã'],
        ['Ã¤', 'ä'],
        ['Ã¦', 'æ'],
        ['Ã§', 'ç'],
        ['Ã±', 'ñ'],
        ['Ã´', 'ô'],
        ['Ã¶', 'ö'],
        ['Ã¸', 'ø'],
        ['Ãº', 'ú'],
        ['Ã¼', 'ü'],
        ['Ã¿', 'ÿ'],
        ['Â°', '°'],
        ['Â£', '£'],
        ['Â¥', '¥'],
        ['Â©', '©'],
        ['Â®', '®'],
        ['Â±', '±'],
        ['Âµ', 'µ'],
        ['Â·', '·'],
      ];
      
      for (const [from, to] of commonMojibake) {
        sanitized = sanitized.replace(new RegExp(from, 'g'), to);
      }
    }
  } catch (error) {
    console.warn('Error in sanitization:', error.message);
  }
  
  return sanitized;
}

/**
 * Parse the future features markdown file and extract features.
 * Captures all numbered sections (## X. Title) except meta sections.
 */
async function parseFeaturesFromMarkdown() {
  const filePath = path.join(__dirname, '../../../../Docs/CodeMaestro_Future_Features.md');
  // File is UTF-16 LE encoded
  const content = fs.readFileSync(filePath, 'utf16le');
  
  const features = [];
  
  // Match all numbered sections: ## 1. Title, ## 2. Title, etc.
  const sectionRegex = /^## (\d+)\. (.+)$/gm;
  const sections = [];
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      number: parseInt(match[1]),
      title: match[2].trim(),
      startIndex: match.index
    });
  }
  
  // Meta sections to skip (not actual features)
  const metaSections = [
    'Vision Beyond MVP',
    'Phase Overview',
    'Non-Goals',
    'Metrics',
    'Phase Acceptance Criteria',
    'Prioritized Backlog',
    'Timeline Estimate',
    'References'
  ];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Skip meta sections
    if (metaSections.some(meta => section.title.includes(meta))) {
      continue;
    }
    
    // Get content between this section and the next
    const startIndex = section.startIndex;
    const endIndex = sections[i + 1]?.startIndex || content.length;
    const sectionContent = content.substring(startIndex, endIndex);
    
    // Extract description (everything after the title line, before subsections)
    const lines = sectionContent.split('\n').slice(1); // Skip title line
    let descriptionLines = [];
    
    for (const line of lines) {
      // Stop at subsections or next major section
      if (line.trim().startsWith('###') || line.trim().startsWith('## ')) {
        break;
      }
      descriptionLines.push(line);
    }
    
    // Clean up
    let title = sanitizeText(section.title);
    let description = descriptionLines.join('\n').trim();
    description = sanitizeText(description);
    
    // Limit description length
    if (description.length > 2000) {
      description = description.substring(0, 2000) + '...';
    }
    
    // Skip empty features
    if (!title || title.length < 3) {
      continue;
    }
    
    // Determine priority based on keywords
    let priority = 'medium';
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    
    if (lowerTitle.includes('critical') || lowerTitle.includes('high') || 
        lowerDesc.includes('critical') || lowerDesc.includes('high')) {
      priority = 'high';
    } else if (lowerTitle.includes('low') || lowerDesc.includes('low')) {
      priority = 'low';
    }
    
    // Determine phase based on section numbering
    let phase = 'planning';
    const sectionNum = section.number;
    if (sectionNum <= 5) phase = 'phase-a';
    else if (sectionNum <= 10) phase = 'phase-b';
    else if (sectionNum <= 15) phase = 'phase-c';
    else phase = 'phase-d';
    
    // Skip empty features
    if (!title || title.length < 3) {
      continue;
    }
    
    features.push({
      title,
      description,
      priority,
      phase,
      tags: ['backlog', 'future']
    });
  }
  
  return features;
}

/**
 * Seed the features table.
 */
async function seedFeatures() {
  console.log('Starting features migration...');
  
  try {
    // Parse features from markdown
    const features = await parseFeaturesFromMarkdown();
    console.log(`Found ${features.length} features to insert`);
    
    // Clear existing features
    await db.query('TRUNCATE features RESTART IDENTITY');
    console.log('Cleared existing features');
    
    // Insert features
    for (const feature of features) {
      const query = `
        INSERT INTO features (title, description, priority, phase, tags, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await db.query(query, [
        feature.title,
        feature.description,
        feature.priority,
        feature.phase,
        feature.tags
      ]);
    }
    
    console.log(`Successfully inserted ${features.length} features`);
    
    // Verify insertion
    const result = await db.query('SELECT COUNT(*) FROM features');
    console.log(`Total features in database: ${result.rows[0].count}`);
    
    // Test query for AI Council
    const testResult = await db.query('SELECT * FROM features WHERE title ILIKE $1', ['%AI Council%']);
    console.log(`Test query found ${testResult.rows.length} AI Council features`);
    
  } catch (error) {
    console.error('Error seeding features:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedFeatures()
    .then(() => {
      console.log('Features migration completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Features migration failed:', err);
      process.exit(1);
    });
}

module.exports = { seedFeatures, sanitizeText };
