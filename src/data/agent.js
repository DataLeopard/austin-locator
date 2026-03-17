import { queryNeighborhoods, queryProperties, getNeighborhoodByName, getNeighborhoodStats } from './austin-db.js';

const CONVERSATION_STATES = {
  WELCOME: 'welcome',
  ASK_BUDGET: 'ask_budget',
  ASK_BEDS: 'ask_beds',
  ASK_LIFESTYLE: 'ask_lifestyle',
  ASK_PETS: 'ask_pets',
  ASK_PRIORITIES: 'ask_priorities',
  RESULTS: 'results',
  FREEFORM: 'freeform',
};

function scoreNeighborhood(neighborhood, prefs) {
  let score = 0;
  let maxScore = 0;
  const reasons = [];

  // Budget scoring (weight: 30)
  if (prefs.budget) {
    maxScore += 30;
    const rentKey = prefs.beds === 3 ? 'avgRent3br' : prefs.beds === 2 ? 'avgRent2br' : 'avgRent1br';
    const rent = neighborhood[rentKey];
    if (rent <= prefs.budget) {
      const ratio = 1 - (rent / prefs.budget);
      score += 20 + Math.min(10, ratio * 30);
      if (rent <= prefs.budget * 0.8) {
        reasons.push(`Well within budget at $${rent}/mo avg`);
      } else {
        reasons.push(`Fits budget at $${rent}/mo avg`);
      }
    } else if (rent <= prefs.budget * 1.1) {
      score += 10;
      reasons.push(`Slightly above budget at $${rent}/mo avg`);
    } else {
      reasons.push(`Over budget at $${rent}/mo avg`);
    }
  }

  // Lifestyle scoring (weight: 25)
  if (prefs.lifestyle && prefs.lifestyle.length > 0) {
    maxScore += 25;
    const lifestyleMap = {
      nightlife: 'nightlife',
      outdoors: 'outdoors',
      family: 'familyFriendly',
      tech: 'techHub',
    };
    let lifestyleScore = 0;
    let lifestyleCount = 0;
    for (const pref of prefs.lifestyle) {
      const key = lifestyleMap[pref];
      if (key && neighborhood[key] !== undefined) {
        lifestyleScore += neighborhood[key];
        lifestyleCount++;
        if (neighborhood[key] >= 70) {
          const label = pref === 'tech' ? 'tech scene' : pref;
          reasons.push(`Great ${label} (${neighborhood[key]}/100)`);
        }
      }
    }
    if (lifestyleCount > 0) {
      score += (lifestyleScore / lifestyleCount / 100) * 25;
    }
  }

  // Walk score (weight: 10)
  maxScore += 10;
  if (prefs.walkable) {
    score += (neighborhood.walkScore / 100) * 10;
    if (neighborhood.walkScore >= 75) {
      reasons.push(`Very walkable (${neighborhood.walkScore}/100)`);
    }
  } else {
    score += 5; // neutral
  }

  // Pet-friendliness (weight: 15)
  if (prefs.pets) {
    maxScore += 15;
    if (neighborhood.petFriendly) {
      score += 15;
      reasons.push('Pet-friendly neighborhood');
    } else {
      reasons.push('Limited pet options');
    }
  }

  // Transit (weight: 10)
  maxScore += 10;
  score += (neighborhood.transitScore / 100) * 10;

  // Vibe match (weight: 10)
  if (prefs.vibes && prefs.vibes.length > 0) {
    maxScore += 10;
    const vibes = (neighborhood.vibe || '').toLowerCase().split(',');
    let vibeMatch = 0;
    for (const v of prefs.vibes) {
      if (vibes.some(nv => nv.trim().includes(v.toLowerCase()))) {
        vibeMatch++;
      }
    }
    score += (vibeMatch / prefs.vibes.length) * 10;
  }

  const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
  return { score: Math.min(100, Math.max(0, normalizedScore)), reasons };
}

function formatNeighborhoodInfo(n) {
  const vibes = n.vibe ? n.vibe.split(',').map(v => v.trim()).join(', ') : '';
  return `**${n.name}** (${n.area})
${n.description}
- Vibe: ${vibes}
- Avg Rent: 1BR $${n.avgRent1br} | 2BR $${n.avgRent2br} | 3BR $${n.avgRent3br}
- Walk Score: ${n.walkScore}/100 | Transit: ${n.transitScore}/100
- Nightlife: ${n.nightlife}/100 | Outdoors: ${n.outdoors}/100
- Family: ${n.familyFriendly}/100 | Tech Hub: ${n.techHub}/100
- Pet Friendly: ${n.petFriendly ? 'Yes' : 'Limited'}`;
}

function findNeighborhoodMention(input) {
  const neighborhoods = queryNeighborhoods();
  const lower = input.toLowerCase();
  for (const n of neighborhoods) {
    const nameLower = n.name.toLowerCase();
    if (lower.includes(nameLower)) return n;
    // Handle common abbreviations
    if (nameLower.includes('south congress') && (lower.includes('soco') || lower.includes('south congress'))) return n;
    if (nameLower.includes('domain') && lower.includes('domain')) return n;
    if (nameLower.includes('st. elmo') && (lower.includes('st elmo') || lower.includes('st. elmo'))) return n;
  }
  return null;
}

function detectCompare(input) {
  const lower = input.toLowerCase();
  if (!lower.includes(' vs ') && !lower.includes(' versus ') && !lower.includes('compare')) return null;

  const neighborhoods = queryNeighborhoods();
  const found = [];
  for (const n of neighborhoods) {
    if (lower.includes(n.name.toLowerCase())) found.push(n);
    if (n.name.includes('South Congress') && lower.includes('soco')) found.push(n);
  }
  return found.length >= 2 ? found.slice(0, 2) : null;
}

function parseBudget(input) {
  const lower = input.toLowerCase();
  const match = lower.match(/\$?\s*(\d[,\d]*)/);
  if (match) return parseInt(match[1].replace(/,/g, ''));
  if (lower.includes('cheap') || lower.includes('budget') || lower.includes('affordable')) return 1300;
  if (lower.includes('moderate') || lower.includes('mid')) return 1700;
  if (lower.includes('luxury') || lower.includes('high') || lower.includes('expensive')) return 2500;
  return null;
}

function parseBeds(input) {
  const lower = input.toLowerCase();
  if (lower.includes('studio') || lower.includes('0')) return 1;
  const match = lower.match(/(\d)\s*(bed|br|bedroom)/);
  if (match) return parseInt(match[1]);
  if (lower.includes('one') || lower === '1') return 1;
  if (lower.includes('two') || lower === '2') return 2;
  if (lower.includes('three') || lower === '3') return 3;
  return null;
}

function parseLifestyle(input) {
  const lower = input.toLowerCase();
  const lifestyles = [];
  if (lower.includes('nightlife') || lower.includes('bar') || lower.includes('club') || lower.includes('music') || lower.includes('party') || lower.includes('social')) lifestyles.push('nightlife');
  if (lower.includes('outdoor') || lower.includes('hike') || lower.includes('park') || lower.includes('nature') || lower.includes('trail') || lower.includes('bike') || lower.includes('active')) lifestyles.push('outdoors');
  if (lower.includes('family') || lower.includes('kid') || lower.includes('school') || lower.includes('child') || lower.includes('quiet')) lifestyles.push('family');
  if (lower.includes('tech') || lower.includes('startup') || lower.includes('work') || lower.includes('commute') || lower.includes('apple') || lower.includes('google') || lower.includes('meta')) lifestyles.push('tech');
  return lifestyles;
}

export function createAgent() {
  let context = {
    state: CONVERSATION_STATES.WELCOME,
    preferences: {},
    results: null,
  };

  function processMessage(input) {
    const lower = input.toLowerCase().trim();

    // Check for reset
    if (lower === 'start over' || lower === 'reset' || lower === 'restart') {
      context = { state: CONVERSATION_STATES.WELCOME, preferences: {}, results: null };
      return {
        text: "No problem! Let's start fresh. What's your monthly budget for rent?",
        quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
        state: CONVERSATION_STATES.ASK_BUDGET,
        results: null,
        highlightNeighborhoods: null,
      };
    }

    // Check for comparison requests at any point
    const compareMatch = detectCompare(input);
    if (compareMatch) {
      const [a, b] = compareMatch;
      const text = `Here's how **${a.name}** and **${b.name}** compare:\n\n` +
        `| | ${a.name} | ${b.name} |\n|---|---|---|\n` +
        `| Area | ${a.area} | ${b.area} |\n` +
        `| 1BR Rent | $${a.avgRent1br} | $${b.avgRent1br} |\n` +
        `| 2BR Rent | $${a.avgRent2br} | $${b.avgRent2br} |\n` +
        `| Walk Score | ${a.walkScore} | ${b.walkScore} |\n` +
        `| Nightlife | ${a.nightlife}/100 | ${b.nightlife}/100 |\n` +
        `| Outdoors | ${a.outdoors}/100 | ${b.outdoors}/100 |\n` +
        `| Family | ${a.familyFriendly}/100 | ${b.familyFriendly}/100 |\n` +
        `| Tech Hub | ${a.techHub}/100 | ${b.techHub}/100 |\n` +
        `| Pet Friendly | ${a.petFriendly ? 'Yes' : 'No'} | ${b.petFriendly ? 'Yes' : 'No'} |\n\n` +
        `**${a.name}**: ${a.description}\n\n**${b.name}**: ${b.description}`;
      return {
        text,
        quickReplies: [`Tell me more about ${a.name}`, `Tell me more about ${b.name}`, `Properties in ${a.name}`, `Properties in ${b.name}`],
        state: context.state,
        results: null,
        highlightNeighborhoods: [a, b],
      };
    }

    // Check for neighborhood-specific queries at any point
    const mentionedNeighborhood = findNeighborhoodMention(input);
    if (mentionedNeighborhood && (lower.includes('tell me') || lower.includes('about') || lower.includes('what') || lower.includes('how') || lower.includes('info') || lower.includes('detail'))) {
      const n = mentionedNeighborhood;
      let text = formatNeighborhoodInfo(n);

      if (lower.includes('nightlife') || lower.includes('bar') || lower.includes('going out')) {
        text += `\n\nNightlife in ${n.name}: `;
        if (n.nightlife >= 80) text += `${n.name} is one of Austin's best nightlife spots! `;
        else if (n.nightlife >= 50) text += `${n.name} has decent nightlife options nearby. `;
        else text += `${n.name} is more of a quiet area. You'd need to head to downtown or Rainey for nightlife. `;
      }

      return {
        text,
        quickReplies: [`Properties in ${n.name}`, 'Compare with another area', 'Search neighborhoods'],
        state: context.state,
        results: null,
        highlightNeighborhoods: [n],
      };
    }

    // Check for property requests
    if (mentionedNeighborhood && (lower.includes('propert') || lower.includes('apartment') || lower.includes('listing') || lower.includes('places') || lower.includes('units'))) {
      const n = mentionedNeighborhood;
      const props = queryProperties(n.id);
      if (props.length === 0) {
        return {
          text: `I don't have specific listings for ${n.name} right now, but the average rent is $${n.avgRent1br} for a 1BR. Would you like to see other neighborhoods?`,
          quickReplies: ['Search neighborhoods', 'Start over'],
          state: context.state,
          results: null,
          highlightNeighborhoods: [n],
        };
      }
      let text = `Here are properties in **${n.name}**:\n\n`;
      for (const p of props) {
        text += `**${p.name}** - ${p.beds}BR at $${p.rent}/mo\n${p.address}\nPets: ${p.petPolicy}\nAmenities: ${p.amenities}\nPhone: ${p.phone}\n\n`;
      }
      return {
        text,
        quickReplies: [`Tell me more about ${n.name}`, 'Search other neighborhoods', 'Start over'],
        state: context.state,
        results: null,
        highlightNeighborhoods: [n],
        properties: props,
      };
    }

    // State machine for guided flow
    switch (context.state) {
      case CONVERSATION_STATES.WELCOME:
      case CONVERSATION_STATES.ASK_BUDGET: {
        const budget = parseBudget(input);
        if (budget) {
          context.preferences.budget = budget;
          context.state = CONVERSATION_STATES.ASK_BEDS;
          return {
            text: `Budget set to $${budget}/month. How many bedrooms do you need?`,
            quickReplies: ['Studio/1 BR', '2 BR', '3 BR'],
            state: CONVERSATION_STATES.ASK_BEDS,
            results: null,
            highlightNeighborhoods: null,
          };
        }
        // If not a budget, check for freeform
        if (lower.length > 5) {
          context.state = CONVERSATION_STATES.ASK_BUDGET;
          return {
            text: "I'd love to help! Let's start with your budget. What's the most you'd like to spend on rent per month?",
            quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
            state: CONVERSATION_STATES.ASK_BUDGET,
            results: null,
            highlightNeighborhoods: null,
          };
        }
        context.state = CONVERSATION_STATES.ASK_BUDGET;
        return {
          text: "What's your monthly budget for rent?",
          quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
          state: CONVERSATION_STATES.ASK_BUDGET,
          results: null,
          highlightNeighborhoods: null,
        };
      }

      case CONVERSATION_STATES.ASK_BEDS: {
        const beds = parseBeds(input);
        if (beds) {
          context.preferences.beds = beds;
          context.state = CONVERSATION_STATES.ASK_LIFESTYLE;
          return {
            text: `Got it, ${beds} bedroom${beds > 1 ? 's' : ''}. What matters most to you? Pick all that apply:`,
            quickReplies: ['Nightlife & Social', 'Outdoors & Active', 'Family-Friendly', 'Near Tech Jobs', 'Walkable', 'All of the above'],
            state: CONVERSATION_STATES.ASK_LIFESTYLE,
            results: null,
            highlightNeighborhoods: null,
          };
        }
        return {
          text: "How many bedrooms? (1, 2, or 3)",
          quickReplies: ['Studio/1 BR', '2 BR', '3 BR'],
          state: CONVERSATION_STATES.ASK_BEDS,
          results: null,
          highlightNeighborhoods: null,
        };
      }

      case CONVERSATION_STATES.ASK_LIFESTYLE: {
        let lifestyles = parseLifestyle(input);
        if (lower.includes('all')) lifestyles = ['nightlife', 'outdoors', 'family', 'tech'];
        if (lower.includes('walk')) context.preferences.walkable = true;

        if (lifestyles.length > 0 || lower.includes('all') || lower.includes('none') || lower.includes('skip')) {
          context.preferences.lifestyle = lifestyles.length > 0 ? lifestyles : [];
          context.state = CONVERSATION_STATES.ASK_PETS;
          return {
            text: "Do you have pets? This affects which neighborhoods and properties are best.",
            quickReplies: ['Yes, dog', 'Yes, cat', 'Yes, both', 'No pets'],
            state: CONVERSATION_STATES.ASK_PETS,
            results: null,
            highlightNeighborhoods: null,
          };
        }
        return {
          text: "What lifestyle do you prefer? You can say things like 'nightlife', 'outdoors', 'family-friendly', or 'near tech jobs'.",
          quickReplies: ['Nightlife & Social', 'Outdoors & Active', 'Family-Friendly', 'Near Tech Jobs'],
          state: CONVERSATION_STATES.ASK_LIFESTYLE,
          results: null,
          highlightNeighborhoods: null,
        };
      }

      case CONVERSATION_STATES.ASK_PETS: {
        const hasPets = lower.includes('yes') || lower.includes('dog') || lower.includes('cat') || lower.includes('pet');
        context.preferences.pets = hasPets;
        context.state = CONVERSATION_STATES.RESULTS;

        // Run the scoring
        const neighborhoods = queryNeighborhoods();
        const scored = neighborhoods.map(n => {
          const { score, reasons } = scoreNeighborhood(n, context.preferences);
          return { ...n, matchScore: score, matchReasons: reasons };
        });
        scored.sort((a, b) => b.matchScore - a.matchScore);
        context.results = scored;

        const top5 = scored.slice(0, 5);
        let text = "Here are your top neighborhood matches:\n\n";
        for (let i = 0; i < top5.length; i++) {
          const n = top5[i];
          const rentKey = context.preferences.beds === 3 ? 'avgRent3br' : context.preferences.beds === 2 ? 'avgRent2br' : 'avgRent1br';
          text += `**${i + 1}. ${n.name}** - ${n.matchScore}% match\n`;
          text += `$${n[rentKey]}/mo avg for ${context.preferences.beds || 1}BR | ${n.vibe}\n`;
          if (n.matchReasons.length > 0) text += `${n.matchReasons.slice(0, 3).join(' | ')}\n`;
          text += '\n';
        }
        text += "Click on any neighborhood for details, or ask me about a specific area!";

        return {
          text,
          quickReplies: [`Tell me about ${top5[0]?.name}`, `Properties in ${top5[0]?.name}`, `Compare ${top5[0]?.name} vs ${top5[1]?.name}`, 'Start over'],
          state: CONVERSATION_STATES.RESULTS,
          results: scored,
          highlightNeighborhoods: top5,
        };
      }

      case CONVERSATION_STATES.RESULTS:
      case CONVERSATION_STATES.FREEFORM: {
        // Already handled neighborhood mentions and comparisons above
        // Handle general questions
        if (lower.includes('cheapest') || lower.includes('affordable') || lower.includes('budget')) {
          const neighborhoods = queryNeighborhoods();
          const sorted = [...neighborhoods].sort((a, b) => a.avgRent1br - b.avgRent1br);
          const top3 = sorted.slice(0, 3);
          let text = "The most affordable neighborhoods are:\n\n";
          for (const n of top3) {
            text += `**${n.name}** - 1BR from $${n.avgRent1br}/mo | ${n.vibe}\n`;
          }
          return {
            text,
            quickReplies: top3.map(n => `Tell me about ${n.name}`).concat(['Start over']),
            state: context.state,
            results: context.results,
            highlightNeighborhoods: top3,
          };
        }

        if (lower.includes('walkable') || lower.includes('walk score')) {
          const neighborhoods = queryNeighborhoods();
          const sorted = [...neighborhoods].sort((a, b) => b.walkScore - a.walkScore);
          const top3 = sorted.slice(0, 3);
          let text = "The most walkable neighborhoods are:\n\n";
          for (const n of top3) {
            text += `**${n.name}** - Walk Score: ${n.walkScore}/100 | $${n.avgRent1br}/mo 1BR\n`;
          }
          return {
            text,
            quickReplies: top3.map(n => `Tell me about ${n.name}`).concat(['Start over']),
            state: context.state,
            results: context.results,
            highlightNeighborhoods: top3,
          };
        }

        if (lower.includes('search') || lower.includes('find') || lower.includes('new search')) {
          context.state = CONVERSATION_STATES.ASK_BUDGET;
          return {
            text: "Let's find your perfect neighborhood! What's your monthly budget?",
            quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
            state: CONVERSATION_STATES.ASK_BUDGET,
            results: null,
            highlightNeighborhoods: null,
          };
        }

        // Default fallback
        return {
          text: "I can help with that! Try asking about a specific neighborhood (like 'Tell me about East Austin'), compare areas ('Downtown vs Mueller'), or find properties ('apartments in Zilker'). You can also say 'start over' to search with new preferences.",
          quickReplies: ['Most affordable areas', 'Most walkable', 'Best nightlife', 'Best for families', 'Start over'],
          state: context.state,
          results: context.results,
          highlightNeighborhoods: null,
        };
      }

      default:
        context.state = CONVERSATION_STATES.ASK_BUDGET;
        return {
          text: "What's your monthly budget for rent?",
          quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
          state: CONVERSATION_STATES.ASK_BUDGET,
          results: null,
          highlightNeighborhoods: null,
        };
    }
  }

  return {
    processMessage,
    getContext: () => context,
    getWelcome: () => ({
      text: "Welcome to **Austin Locator**! I'll help you find the perfect Austin neighborhood.\n\nI know 18 neighborhoods with real rent data, walkability scores, and lifestyle ratings. Let's find your match!\n\nWhat's your monthly budget for rent?",
      quickReplies: ['Under $1,200', '$1,200 - $1,600', '$1,600 - $2,000', '$2,000+'],
      state: CONVERSATION_STATES.ASK_BUDGET,
      results: null,
      highlightNeighborhoods: null,
    }),
  };
}
