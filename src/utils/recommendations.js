import { getRandomMeal, filterByIngredient, getMeal } from '../services/mealdb'
import { extractIngredients } from './meal'

export const COMMON_INGREDIENTS = [
  'Chicken',
  'Beef',
  'Eggs',
  'Fish',
  'Beans',
  'Rice',
  'Potatoes',
  'Tomatoes',
  'Onions',
  'Carrots',
  'Sukuma Wiki',
  'Spinach',
  'Avocado',
  'Banana',
  'Milk',
  'Oats'
]

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const MEAL_SLOTS = {
  2: ['Breakfast', 'Dinner'],
  3: ['Breakfast', 'Lunch', 'Dinner'],
  4: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
}

const FOOD_GROUP_KEYWORDS = {
  protein: [
    'chicken', 'beef', 'fish', 'eggs', 'egg', 'beans', 'lentils', 'peas', 'pork', 'lamb',
    'turkey', 'shrimp', 'prawn', 'salmon', 'tuna', 'sardines', 'tofu', 'tempeh',
    'chickpea', 'meat', 'sausage', 'bacon', 'ham', 'crab', 'musseld', 'mussels',
    'squid', 'anchovy', 'cod', 'sole', 'flounder', 'trout', 'mackerel', 'haddock',
    'paneer', 'cheese', 'cottage cheese', 'yogurt', 'yoghurt', 'milk powder', 'mutton', 'sardine'
  ],
  carb: [
    'rice', 'potato', 'pasta', 'spaghetti', 'bread', 'oats', 'oatmeal', 'maize', 'cornmeal',
    'flour', 'noodles', 'couscous', 'quinoa', 'barley', 'wheat', 'semolina', 'tortilla',
    'chapati', 'naan', 'baguette', 'cooked white rice', 'brown rice', 'sweet potato',
    'plantain', 'yam', 'cassava', 'ugali', 'polenta', 'rice flour', 'pancake'
  ],
  vegetable: [
    'spinach', 'sukuma wiki', 'cabbage', 'carrots', 'carrot', 'tomatoes', 'tomato', 'broccoli',
    'onions', 'onion', 'garlic', 'ginger', 'pepper', 'bell pepper', 'peppers', 'kale', 'lettuce',
    'cucumber', 'zucchini', 'aubergine', 'eggplant', 'celery', 'leek', 'cauliflower',
    'green beans', 'peas', 'sweetcorn', 'corn', 'mushrooms', 'mushroom', 'pumpkin', 'butternut',
    'squash', 'radish', 'beet', 'okra', 'swiss chard', 'chard', 'asparagus', 'artichoke',
    'avocado', 'peas', 'bean sprouts', 'courgette', 'peas', 'mixed vegetables', 'veg'
  ],
  fruit: [
    'banana', 'apple', 'orange', 'mango', 'pineapple', 'strawberries', 'strawberry', 'blueberries',
    'blueberry', 'raspberry', 'raspberries', 'lemon', 'lime', 'grape', 'grapes', 'melon',
    'watermelon', 'papaya', 'peach', 'pear', 'plum', 'cherry', 'cherries', 'coconut', 'fig',
    'guava', 'pomegranate', 'kiwi', 'apricot', 'blackberry', 'dates', 'raisins'
  ],
  fat: [
    'avocado', 'nuts', 'nut', 'almonds', 'almond', 'walnuts', 'walnut', 'cashew', 'peanuts',
    'peanut', 'seeds', 'seed', 'olive oil', 'oil', 'butter', 'ghee', 'coconut oil', 'sunflower oil',
    'sesame', 'cream', 'cheese', 'margarine', 'tahini', 'peanut butter', 'mayonnaise'
  ]
}

const BREAKFAST_KEYWORDS = [
  'breakfast', 'oat', 'porridge', 'pancake', 'egg', 'toast', 'cereal', 'granola',
  'muffin', 'croissant', 'bagel', 'scone', 'french toast', 'brioche', 'omelet',
  'omelette', 'scrambled', 'frittata', 'quiche', 'yogurt', 'smoothie', 'avocado toast',
  'hash brown', 'waffle', 'crepe'
]

const SNACK_KEYWORDS = [
  'snack', 'dip', 'hummus', 'guacamole', 'bruschetta', 'nachos', 'popcorn',
  'finger', 'teacake', 'cake pops', 'energy balls', 'trail mix', 'sandwich'
]

const QUICK_KEYWORDS = [
  'quick', 'fast', '10 minute', '15 minute', '20 minute', '30 minute', 'no-cook',
  'no bake', 'salad', 'sandwich', 'toast', 'wrap', 'tacos', 'eggs', 'omelette',
  'omlette', 'scramble', 'pancake', 'smoothie', 'frittata', 'stir fry', 'stir-fry',
  'grilled', 'bbq', 'grill', 'caesar'
]

const LONGER_KEYWORDS = [
  'slow', 'braised', 'roast', 'baked', 'bake', 'stew', 'casserole', 'lasagna',
  'risotto', 'shoulder', 'overnight', 'smoked', 'cured', 'marinated', 'chilli con',
  'curry', 'tagine', 'pot pie', 'meatloaf', 'loaf'
]

const NORMALIZE_STRIP = /[^a-z0-9\s]/g
const MULTI_SPACE = /\s+/g

export function normalizeIngredient(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\((.*?)\)/g, '')
    .replace(NORMALIZE_STRIP, ' ')
    .replace(MULTI_SPACE, ' ')
    .trim()
}

export function slugLabel(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function expandGroupKeyword(keyword) {
  const parts = keyword.split(/\s+/)
  const variants = [keyword]
  if (parts.length > 1) {
    variants.push(parts.join(''))
    variants.push(parts[0])
  }
  return variants
}

function buildGroupLookup() {
  const lookup = new Map()
  Object.entries(FOOD_GROUP_KEYWORDS).forEach(([group, keywords]) => {
    keywords.forEach((keyword) => {
      expandGroupKeyword(keyword).forEach((variant) => {
        if (variant.length >= 3) lookup.set(variant, group)
      })
    })
  })
  return lookup
}

const GROUP_LOOKUP = buildGroupLookup()

export function classifyByGroups(ingredients) {
  const groups = { protein: [], carb: [], vegetable: [], fruit: [], fat: [] }
  ingredients.forEach((ingredient) => {
    const normalized = normalizeIngredient(ingredient)
    if (!normalized) return
    const matched = new Set()
    if (GROUP_LOOKUP.has(normalized)) {
      matched.add(GROUP_LOOKUP.get(normalized))
    } else {
      for (const [key, group] of GROUP_LOOKUP.entries()) {
        if (normalized.includes(key) && key.length >= 4 && !matched.has(group)) {
          matched.add(group)
        }
      }
    }
    matched.forEach((group) => groups[group].push(ingredient))
  })
  return groups
}

export function evaluateBalance(ingredients) {
  const groups = classifyByGroups(ingredients)
  const balance = {
    protein: groups.protein.length > 0,
    carb: groups.carb.length > 0,
    vegetable: groups.vegetable.length > 0,
    fruit: groups.fruit.length > 0,
    fat: groups.fat.length > 0
  }
  if (balance.protein && balance.carb && balance.vegetable) {
    balance.note = 'Balanced meal'
  } else if (!balance.protein) {
    balance.note = 'Add a protein source'
  } else if (!balance.vegetable) {
    balance.note = 'Could use more vegetables'
  } else if (!balance.carb) {
    balance.note = 'Consider a carbohydrate'
  } else {
    balance.note = 'Generally balanced'
  }
  return balance
}

export function calculateIngredientMatch(recipeIngredients, availableIngredients) {
  const available = Array.isArray(availableIngredients)
    ? availableIngredients.map(normalizeIngredient).filter(Boolean)
    : []
  const availableSet = new Set(available)

  const matched = new Set()
  const missing = []
  recipeIngredients.forEach((raw) => {
    const normalized = normalizeIngredient(raw)
    if (!normalized) return
    if (
      availableSet.has(normalized) ||
      [...availableSet].some((a) => (a.length >= 4 && normalized.includes(a)) || (normalized.length >= 4 && a.includes(normalized)))
    ) {
      matched.add(raw)
    } else {
      missing.push(raw)
    }
  })

  const ratio = recipeIngredients.length ? matched.size / recipeIngredients.length : 0
  return { matched: [...matched], missing, ratio }
}

export function inferMealType(meal) {
  const haystack = [
    meal.strMeal || '',
    meal.strCategory || '',
    meal.strTags || '',
    (meal.strMeal || '').toLowerCase()
  ]
    .join(' ')
    .toLowerCase()
  if (BREAKFAST_KEYWORDS.some((k) => haystack.includes(k))) return 'breakfast'
  if (SNACK_KEYWORDS.some((k) => haystack.includes(k))) return 'snack'
  return 'main'
}

export function estimateCookingTime(meal) {
  const haystack = [meal.strMeal || '', meal.strCategory || '', meal.strTags || '']
    .join(' ')
    .toLowerCase()
  if (QUICK_KEYWORDS.some((k) => haystack.includes(k))) return 'quick'
  if (LONGER_KEYWORDS.some((k) => haystack.includes(k))) return 'longer'
  return 'moderate'
}

export function matchesDietaryPreference(meal, dietaryPreference) {
  if (!dietaryPreference || dietaryPreference === 'any') return true
  const category = (meal.strCategory || '').toLowerCase()
  const name = (meal.strMeal || '').toLowerCase()
  if (dietaryPreference === 'vegetarian') {
    if (category.includes('vegetarian') || category.includes('vegan')) return true
    const meatWords = ['chicken', 'beef', 'lamb', 'pork', 'meat', 'mutton', 'goat', 'fish', 'seafood', 'shrimp', 'duck', 'sausage', 'bacon', 'ham']
    return !meatWords.some((word) => name.includes(word) || category.includes(word))
  }
  if (dietaryPreference === 'lower-meat') {
    const lowMeat = ['beef', 'lamb', 'pork', 'mutton', 'goat']
    return !lowMeat.some((word) => name.includes(word) || category.includes(word))
  }
  if (dietaryPreference === 'high-protein') {
    const proteinCategories = ['chicken', 'beef', 'pork', 'lamb', 'seafood', 'vegetarian']
    return proteinCategories.some((c) => category.includes(c))
  }
  return true
}

export function rankMeals(meals, availableIngredients) {
  const available = (availableIngredients || []).map(normalizeIngredient)
  return meals
    .map((meal) => {
      const ingredientList = (meal.ingredients || [])
      const rawNames = ingredientList.map((i) => (typeof i === 'string' ? i : i?.ingredient)).filter(Boolean)
      const match = rawNames.length
        ? calculateIngredientMatch(rawNames, available)
        : { matched: [], missing: [], ratio: available.length ? 1 : 0 }
      const groupCount = new Set(
        Object.values(classifyByGroups([...(meal.ingredients || [])].map((i) => (typeof i === 'string' ? i : i?.ingredient)).filter(Boolean))).flat()
      ).size
      return {
        meal,
        match,
        dietary: { score: 0 },
        cookingPref: { score: 0 },
        score: match.ratio + (groupCount ? groupCount / 10 : 0)
      }
    })
    .sort((a, b) => b.match.ratio - a.match.ratio || b.meal.ingredients?.length - a.meal.ingredients?.length)
}

export async function fetchCandidateMeals(ingredients, { signal } = {}) {
  const normalized = (ingredients || []).map(normalizeIngredient).filter(Boolean)
  const mealMap = new Map()

  for (let i = 0; i < normalized.length; i += 4) {
    const batch = normalized.slice(i, i + 4)
    const results = await Promise.all(
      batch.map((ing) => filterByIngredient(ing).catch(() => []))
    )
    results.flat().forEach((meal) => {
      if (meal && meal.idMeal) mealMap.set(meal.idMeal, meal)
    })
    if (mealMap.size >= 48) break
  }

  if (mealMap.size === 0) {
    const fallback = await getRandomMeal().catch(() => null)
    for (let i = 0; i < 4 && fallback; i++) {
      const meal = await getRandomMeal().catch(() => null)
      if (meal && meal.idMeal) mealMap.set(meal.idMeal, meal)
    }
  }

  return { meals: [...mealMap.values()].slice(0, 48), fromIngredients: mealMap.size > 0 }
}

export async function generateMealPlan(config) {
  const {
    days = 3,
    mealsPerDay = 3,
    dietaryPreference = 'any',
    cookingTime = 'any',
    ingredients = []
  } = config

  const slots = MEAL_SLOTS[mealsPerDay] || MEAL_SLOTS[3]
  const available = (ingredients || []).map(String).map(normalizeIngredient).filter(Boolean)

  const { meals: candidateMeals, fromIngredients } = await fetchCandidateMeals(available, config)

  const enriched = await enrichMeals(candidateMeals)

  const eligible = enriched
    .filter((meal) => matchesDietaryPreference(meal, dietaryPreference))
    .sort(() => 0)

  const pool = eligible.length ? eligible : enriched

  const ranked = rankMeals(pool, available)
  const usedIds = new Set()
  const dayCategories = new Set()

  const pickForSlot = (slotType) => {
    const still = ranked.filter((entry) => !usedIds.has(entry.meal.idMeal))
    const typeTarget = slotType === 'Breakfast' ? 'breakfast' : slotType === 'Snack' ? 'snack' : 'main'
    const tightened = still.filter(
      (entry) => inferMealType(entry.meal) === typeTarget || typeTarget === 'main'
    )
    let chosen = tightened.find((entry) => !dayCategories.has(entry.meal.strCategory)) || tightened[0]
    if (!chosen) chosen = still.find((entry) => !dayCategories.has(entry.meal.strCategory)) || still[0] || ranked[0]

    if (!chosen) return null
    usedIds.add(chosen.meal.idMeal)
    if (chosen.meal.strCategory) dayCategories.add(chosen.meal.strCategory)
    return chosen
  }

  const plan = []
  const allRequired = new Set()

  for (let day = 1; day <= days; day++) {
    const dayPlan = []
    const dayUsed = new Set()
    slots.forEach((slotType) => {
      let picked = pickForSlot(slotType)
      if (picked && dayUsed.has(picked.meal.idMeal)) {
        picked = ranked.find((e) => !usedIds.has(e.meal.idMeal) && !dayUsed.has(e.meal.idMeal)) || picked
      }
      if (picked) {
        dayUsed.add(picked.meal.idMeal)
        const rawIngredients = (picked.meal.ingredients || [])
          .map((i) => (typeof i === 'string' ? i : i?.ingredient))
          .filter(Boolean)
        rawIngredients.forEach((ing) => allRequired.add(ing))
        dayPlan.push({
          slot: slotType,
          type: slotType,
          meal: picked.meal,
          matchedIngredients: picked.match.matched,
          matchRatio: picked.match.ratio,
          balance: evaluateBalance(rawIngredients)
        })
      }
    })
    plan.push({ day, meals: dayPlan })
  }

  const required = [...allRequired]
  const have = required.filter((ing) =>
    available.some(
      (a) => a && (a === normalizeIngredient(ing) || (a.length >= 4 && normalizeIngredient(ing).includes(a)) || (normalizeIngredient(ing).length >= 4 && a.includes(normalizeIngredient(ing))))
    )
  )
  const need = required.filter((ing) => !have.includes(ing))

  return {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    days,
    mealsPerDay,
    dietaryPreference,
    cookingTime,
    ingredients: available,
    fromIngredients,
    meals: plan,
    shopping: { required, have, need },
    _pool: ranked
  }
}

async function enrichMeals(meals) {
  const enriched = []
  const batchSize = 12
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (meal) => {
      try {
        const detail = await getMeal(meal.idMeal)
        if (!detail) return null
        const ingredients = extractIngredients(detail).map((item) => item.ingredient)
        return { ...detail, ingredients }
      } catch {
        return { ...meal, ingredients: [] }
      }
    })
    )
    enriched.push(...results.filter(Boolean))
  }
  return enriched
}