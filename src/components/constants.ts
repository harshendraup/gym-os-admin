// Fitness Goals (must match database constraint in training_programs and member_fitness_preferences tables)
export const FITNESS_GOALS = [
  'Weight & Fat Loss',
  'Muscle Building',
  'Body Toning & Recomposition',
  'Strength & Power',
  'General Health & Fitness',
  'Endurance & Cardio',
  'Mobility & Posture',
  'Athletic & Sports Performance',
  'Weight Maintenance',
  'Rehab & Joint Recovery',
] as const
export type FitnessGoal = (typeof FITNESS_GOALS)[number]

// Diet/Nutrition Goals (must match database constraint in diet_plans and nutrition_assessments tables)
export const DIET_GOALS = [
  'Weight & Fat Loss',
  'Muscle Building',
  'Body Recomposition',
  'Weight Maintenance',
  'General Health & Fitness',
  'Sports Performance',
  'Healthy Aging',
] as const
export type DietGoal = (typeof DIET_GOALS)[number]

// Difficulty Levels
export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

// Activity Levels
export const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

// Diet Types
export const DIET_TYPES = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'] as const
export type DietType = (typeof DIET_TYPES)[number]

// Food Categories (must match database constraint in foods table)
export const FOOD_CATEGORIES = [
  'Protein',
  'Carbohydrates/Grains',
  'Fruits',
  'Vegetables',
  'Dairy',
  'Pulses/Legumes',
  'Nuts & Seeds',
  'Healthy Fats/Oils',
  'Beverages',
  'Other',
] as const
export type FoodCategory = (typeof FOOD_CATEGORIES)[number]

// Food Serving Units — the unit always comes from the food's own definition,
// never hardcoded/assumed in the Diet Plan UI.
export const SERVING_UNITS = ['g', 'ml', 'piece', 'tbsp', 'tsp', 'cup', 'bowl', 'glass', 'slice', 'scoop'] as const
export type ServingUnit = (typeof SERVING_UNITS)[number]

// Food Preparation States (raw vs cooked nutrition values must not be mixed)
export const PREPARATION_STATES = ['Raw', 'Cooked', 'Other'] as const
export type PreparationState = (typeof PREPARATION_STATES)[number]

// Fitness Levels
export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
export type FitnessLevel = (typeof FITNESS_LEVELS)[number]

// Gym Experience Levels
export const GYM_EXPERIENCE_LEVELS = ['Less than 6 months', '6-12 months', '1-3 years', '3+ years'] as const
export type GymExperienceLevel = (typeof GYM_EXPERIENCE_LEVELS)[number]

// Exercise Categories
export const EXERCISE_CATEGORIES = ['Strength', 'Cardio', 'Mobility', 'Flexibility', 'Balance'] as const
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

// Muscle Groups
export const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

// Equipment Types (structured, supports multi-select per exercise)
export const EQUIPMENT_TYPES = [
  'Bodyweight',
  'Dumbbell',
  'Barbell',
  'Bench',
  'Cable Machine',
  'Smith Machine',
  'Resistance Band',
  'Kettlebell',
  'Machine',
  'Pull-up Bar',
  'Treadmill',
  'Bike',
  'Rowing Machine',
  'Mat',
  'Foam Roller',
  'Other',
] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

// Exercise Tracking Metrics (what a workout set should record for this exercise)
export const TRACKING_METRICS = ['weight_reps', 'reps_only', 'duration', 'distance_duration'] as const
export type TrackingMetric = (typeof TRACKING_METRICS)[number]
export const TRACKING_METRIC_LABELS: Record<TrackingMetric, string> = {
  weight_reps: 'Weight & Reps',
  reps_only: 'Reps Only',
  duration: 'Duration',
  distance_duration: 'Distance & Duration',
}

// Exercise Difficulty (alias for DIFFICULTY_LEVELS)
export const EXERCISE_DIFFICULTY = DIFFICULTY_LEVELS
export type ExerciseDifficulty = DifficultyLevel

// Workout Session Statuses (must match database constraint in workout_sessions table)
export const SESSION_STATUSES = ['completed', 'partially_completed', 'skipped', 'missed', 'cancelled'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

// Exercise Set Statuses (must match database constraint in workout_session_sets table)
export const SET_STATUSES = ['completed', 'skipped'] as const
export type SetStatus = (typeof SET_STATUSES)[number]

// Assignment Log Statuses (must match database constraint in assignment_logs table)
export const ASSIGNMENT_LOG_STATUSES = ['completed', 'skipped', 'partial'] as const
export type AssignmentLogStatus = (typeof ASSIGNMENT_LOG_STATUSES)[number]

// Program Assignment Statuses (must match database constraint in program_assignments table)
export const PROGRAM_ASSIGNMENT_STATUSES = ['active', 'paused', 'completed', 'terminated', 'cancelled'] as const
export type ProgramAssignmentStatus = (typeof PROGRAM_ASSIGNMENT_STATUSES)[number]

// Trainer Session Statuses (must match database constraint in trainer_sessions table)
export const TRAINER_SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type TrainerSessionStatus = (typeof TRAINER_SESSION_STATUSES)[number]

// Membership Duration Units (must match database constraint in memberships table)
export const DURATION_UNITS = ['days', 'weeks', 'months', 'years'] as const
export type DurationUnit = (typeof DURATION_UNITS)[number]

// Discount Types (must match database constraint in memberships table)
export const DISCOUNT_TYPES = ['flat', 'percentage'] as const
export type DiscountType = (typeof DISCOUNT_TYPES)[number]

// Membership Statuses (must match database constraint in memberships table)
export const MEMBERSHIP_STATUSES = ['draft', 'active', 'inactive', 'archived'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

// Diet Plan Statuses (must match database constraint in diet_plans table)
export const DIET_PLAN_STATUSES = ['Draft', 'Active', 'Archived'] as const
export type DietPlanStatus = (typeof DIET_PLAN_STATUSES)[number]

// Diet Plan Types (must match database constraint in diet_plans table)
export const DIET_PLAN_TYPES = ['Template', 'Custom'] as const
export type DietPlanType = (typeof DIET_PLAN_TYPES)[number]

// Diet Assignment Statuses (must match database constraint in diet_assignments table)
export const DIET_ASSIGNMENT_STATUSES = ['Draft', 'Active', 'Completed'] as const
export type DietAssignmentStatus = (typeof DIET_ASSIGNMENT_STATUSES)[number]

// Nutrition Assessment Statuses (must match database constraint in nutrition_assessments table)
export const NUTRITION_ASSESSMENT_STATUSES = ['Draft', 'Completed'] as const
export type NutritionAssessmentStatus = (typeof NUTRITION_ASSESSMENT_STATUSES)[number]

// Meal Log Statuses (must match database constraint in diet_meal_logs table)
export const MEAL_LOG_STATUSES = ['Completed', 'Skipped', 'Modified', 'Pending'] as const
export type MealLogStatus = (typeof MEAL_LOG_STATUSES)[number]

// Sales Lead Statuses (must match validator enum in sales_lead.ts)
export const SALES_LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Visit Booked', 'Won', 'Lost'] as const
export type SalesLeadStatus = (typeof SALES_LEAD_STATUSES)[number]

// Sales Lead Sources (must match validator enum in sales_lead.ts)
export const SALES_LEAD_SOURCES = ['Facebook', 'Instagram', 'WhatsApp', 'Website', 'Referral', 'Walk-in', 'Other'] as const
export type SalesLeadSource = (typeof SALES_LEAD_SOURCES)[number]

// Attendance Methods (must match database constraint in attendance_logs table)
export const ATTENDANCE_METHODS = ['manual', 'qr', 'face'] as const
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number]

// User Genders
export const GENDERS = ['Male', 'Female', 'Other'] as const
export type Gender = (typeof GENDERS)[number]

// User Statuses (Blocked is admin/system-set, not a normal lifecycle choice, but still a valid status)
export const USER_STATUSES = ['Active', 'Inactive', 'Frozen', 'Blocked'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

// Meal Types
export const MEAL_TYPES = ['Breakfast', 'Mid-Morning', 'Lunch', 'Pre-Workout', 'Post-Workout', 'Evening Snack', 'Dinner', 'Bedtime'] as const
export type MealType = (typeof MEAL_TYPES)[number]

// Food Preferences
export const FOOD_PREFERENCES = ['Home-cooked', 'Tiffin / Delivery Service', 'Eats Out Often', 'Meal Prep (Batch Cooked)', 'No Specific Preference'] as const
export type FoodPreference = (typeof FOOD_PREFERENCES)[number]

// Hydration Sources
export const HYDRATION_SOURCES = ['Plain Water', 'Water + Coconut Water', 'Water + Fresh Fruit Juice', 'Water + Buttermilk / Lassi', 'Water + Electrolyte (ORS)'] as const
export type HydrationSource = (typeof HYDRATION_SOURCES)[number]

// Hydration Presets (ml)
export const HYDRATION_PRESETS_ML = [2000, 2500, 3000, 4000] as const

// Default Meal Priority
export const DEFAULT_MEAL_PRIORITY = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Mid-Morning', 'Post-Workout', 'Pre-Workout', 'Bedtime'] as const

// Goal Timelines
export const GOAL_TIMELINES = ['1 Month', '3 Months', '6 Months', '1 Year', 'Ongoing'] as const
export type GoalTimeline = (typeof GOAL_TIMELINES)[number]

// Workout Types
export const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Functional', 'Mobility', 'Flexibility', 'Bodybuilding'] as const
export type WorkoutType = (typeof WORKOUT_TYPES)[number]

// Workout Durations (minutes)
export const WORKOUT_DURATIONS = [30, 45, 60, 75, 90] as const

// Days of Week (abbreviated)
export const DAYS_ABBREVIATED = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type DayAbbreviated = (typeof DAYS_ABBREVIATED)[number]

// Weekdays (full)
export const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const

// Weekdays (abbreviated - for API compatibility)
export const WEEKDAYS_ABBR = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS_ABBR)[number]

// Health Fields
export const HEALTH_FIELDS = [
  { key: 'injuries', label: 'Injuries' },
  { key: 'physicalLimitations', label: 'Physical Limitations' },
  { key: 'exerciseRestrictions', label: 'Exercise Restrictions' },
] as const

// App Config Constants
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm'

// Media Kinds
export const MEDIA_KINDS = [
  'home_banner', 'promo_banner', 'workout_video', 'illustration',
  'logo', 'app_icon', 'intro_slide', 'quick_access_icon',
] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

export const ORDERED_GROUPS: Array<{
  kind: MediaKind
  title: string
  description: string
  accept: string
  limits: string
}> = [
  {
    kind: 'home_banner',
    title: 'Home banners',
    description: 'The carousel on the app home screen, in this order.',
    accept: IMAGE_ACCEPT,
    limits: 'JPG, PNG, WEBP or SVG · up to 5MB',
  },
  {
    kind: 'promo_banner',
    title: 'Promo banners',
    description: 'Offer and campaign artwork. Leave empty to hide the strip.',
    accept: IMAGE_ACCEPT,
    limits: 'JPG, PNG, WEBP or SVG · up to 5MB',
  },
  {
    kind: 'workout_video',
    title: 'Workout demo videos',
    description: 'Demo clips played inside the workout screens.',
    accept: VIDEO_ACCEPT,
    limits: 'MP4, MOV or WEBM · up to 50MB',
  },
]

export const LIBRARY_KINDS = ['logo', 'app_icon', 'intro_slide', 'quick_access_icon'] as const
export type LibraryKind = (typeof LIBRARY_KINDS)[number]

export const KIND_LABELS: Record<string, string> = {
  logo: 'Logo',
  app_icon: 'App icon',
  intro_slide: 'Onboarding slide',
  quick_access_icon: 'Quick access icon',
}

export const SLOT_LABELS: Record<string, string> = {
  no_notifications: 'Empty notifications',
  no_offers: 'Empty offers',
  no_sessions: 'Empty sessions',
}

export const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

// App Config Sections
export const CONFIG_SECTIONS = [
  'gym_profile',
  'branding',
  'theme',
  'content',
  'quick_access',
  'capabilities',
  'feature_flags',
  'app_config',
  'integrations',
  'payment',
  'signup_flow',
] as const
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

// Quick Access Targets
export const QUICK_ACCESS_TARGETS = [
  'Workout', 'Diet', 'Attendance', 'Trainer', 'Payments',
  'Offers', 'Progress', 'Membership', 'Profile', 'Notifications',
] as const

// Feature Flag Keys
export const FEATURE_FLAG_KEYS = [
  'workout', 'diet', 'attendance', 'trainer', 'payment', 'offers',
  'membership', 'progress', 'notifications', 'ecommerce', 'social', 'chat',
] as const
export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number]

// Illustration Slots
export const ILLUSTRATION_SLOTS = ['no_notifications', 'no_offers', 'no_sessions'] as const
export type IllustrationSlot = (typeof ILLUSTRATION_SLOTS)[number]
