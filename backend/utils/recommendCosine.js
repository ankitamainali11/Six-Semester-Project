
const mongoose = require("mongoose");

function cosineSimilarity(vecA, vecB) {
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Main Recommendation Function
async function recommendOpportunities(user, opportunities) {
  // Step 1: Build vocabulary (all unique tags from user + opportunities)
  const normalize = (t) => (t || '').toString().toLowerCase().trim();
  let allTags = new Set();
  if (Array.isArray(user?.interests)) {
    user.interests.forEach(tag => allTags.add(normalize(tag)));
  }
  opportunities.forEach(op => {
    if (Array.isArray(op?.tags)) {
      op.tags.forEach(tag => allTags.add(normalize(tag)));
    }
  });

  const vocab = Array.from(allTags);
  const N = opportunities.length + 1; 

  // Step 2: Compute document frequency (df) for each tag
  let df = {};
  vocab.forEach(tag => { df[tag] = 0; });

  opportunities.forEach(op => {
    const uniqueTags = new Set((op.tags || []).map(normalize));
    uniqueTags.forEach(tag => { df[tag] = (df[tag] || 0) + 1; });
  });

  // Also count user profile as a "doc"
  if (Array.isArray(user?.interests)) {
    const uniqueUserTags = new Set(user.interests.map(normalize));
    uniqueUserTags.forEach(tag => { df[tag] = (df[tag] || 0) + 1; });
  }

  // Step 3: Compute IDF for each tag
  let idf = {};
  vocab.forEach(tag => {
    idf[tag] = Math.log(N / (1 + df[tag])); // smoothing with +1
  });

  // Step 4: Build TF-IDF vectors
  function buildVector(tags) {
    const counts = {};
    const normTags = (tags || []).map(normalize);
    normTags.forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; });
    const total = normTags.length || 1;

    return vocab.map(tag => {
      const tf = (counts[tag] || 0) / total;
      return tf * idf[tag];
    });
  }

  // User profile vector
  const userVector = buildVector(user.interests || []);

  // Step 5: Score each opportunity
  const scored = opportunities.map(op => {
    const opVector = buildVector(op.tags || []);
    const score = cosineSimilarity(userVector, opVector);
    const base = typeof op?.toObject === 'function' ? op.toObject() : op;
    return { ...base, score };
  });

  // Step 6: Sort by similarity score
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

// Backward-compatible alias (legacy name used in controller)
const recommendCosineBased = (user, opportunities) => recommendOpportunities(user, opportunities);

module.exports = { recommendOpportunities, recommendCosineBased };
