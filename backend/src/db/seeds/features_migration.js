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
 */
async function parseFeaturesFromMarkdown() {
  const filePath = path.join(__dirname, '../../../Docs/CodeMaestro_Future_Features.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const features = [];
  
  // Split by major sections (## headings)
  const sections = content.split(/^##\s+/gm).slice(1); // Skip first empty
  
  for (const section of sections) {
    // Get section title (first line)
    const lines = section.split('\n');
    const titleLine = lines[0].trim();
    
    // Skip non-feature sections
    const excludedSections = [
      'Vision Beyond MVP',
      'Phase Overview',
      'Critical Infrastructure Gaps',
      'Additional Agent Roles',
      'Database Migration',
      'Advanced Dashboard Features',
      'MCP / Inter-Agent Protocol',
      'Self-Improvement System',
      'Security & Compliance',
      'Integration Points',
      'Non-Goals',
      'Metrics',
      'Phase Acceptance Criteria',
      'Prioritized Backlog',
      'Timeline Estimate',
      'Agent Team Scaling',
      'Distribution & Business Models',
      'IDE Extension Strategy',
      'Auto-Generated Task Checklists',
      'Multi-Model AI Council',
      'Command Executor Safety',
      'Queue Infrastructure',
      'Split-Brain Orchestration',
      'Advanced Orchestration Features',
      'Persistent Agent Memory',
      'The Orchestrator Explained',
      'Maestro Studio',
      'Self-Evolution Loop',
      'References'
    ];
    
    if (excludedSections.some(excluded => titleLine.includes(excluded))) {
      continue;
    }
    
    // Clean up title
    let title = titleLine.replace(/^\d+\.\s*/, ''); // Remove leading numbers
    title = sanitizeText(title);
    
    // Get description (next lines until next ## or ###)
    let descriptionLines = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith('###') || lines[i].trim().startsWith('##')) {
        break;
      }
      descriptionLines.push(lines[i]);
    }
    
    let description = descriptionLines.join('\n').trim();
    description = sanitizeText(description);
    
    // Limit description length for database
    if (description.length > 2000) {
      description = description.substring(0, 2000) + '...';
    }
    
    // Determine priority based on keywords in title or description
    let priority = 'medium';
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    
    if (lowerTitle.includes('critical') || lowerTitle.includes('high') || 
        lowerDesc.includes('critical') || lowerDesc.includes('high')) {
      priority = 'high';
    } else if (lowerTitle.includes('low') || lowerDesc.includes('low')) {
      priority = 'low';
    }
    
    // Determine phase based on section numbering or content
    let phase = 'planning';
    if (titleLine.match(/^\d+\./)) {
      const sectionNum = parseInt(titleLine.match(/^\d+/)[0]);
      if (sectionNum <= 5) phase = 'phase-a';
      else if (sectionNum <= 10) phase = 'phase-b';
      else if (sectionNum <= 15) phase = 'phase-c';
      else phase = 'phase-d';
    }
    
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
  
  // Add some specific features we know should be in the database
  const additionalFeatures = [
    {
      title: 'AI Council',
      description: 'Multi-model AI council for complex problem solving with different LLMs collaborating.',
      priority: 'high',
      phase: 'phase-c',
      tags: ['ai', 'council', 'escalation']
    },
    {
      title: 'Real-time Collaboration',
      description: 'Multiple agents working in parallel on frontend and backend tasks.',
      priority: 'high',
      phase: 'phase-b',
      tags: ['parallel', 'scaling', 'collaboration']
    },
    {
      title: 'Self-Optimization Loop',
      description: 'System learns from successes and failures to improve its own processes.',
      priority: 'medium',
      phase: 'phase-c',
      tags: ['learning', 'optimization', 'ai']
    },
    {
      title: 'Feature Branch Workflow',
      description: 'Move from single-branch to feature branches for parallel development.',
      priority: 'high',
      phase: 'phase-b',
      tags: ['git', 'workflow', 'branches']
    }
  ];
  
  return [...features, ...additionalFeatures];
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
