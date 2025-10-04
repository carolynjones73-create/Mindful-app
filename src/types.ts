export interface Quote {
  text: string;
  author: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'completion' | 'milestone';
  requirement_value: number;
  tier?: 'free' | 'premium';
  category?: string;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_shared: boolean;
  badges?: Badge;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  timezone?: string;
  goals?: string[];
  notification_morning?: string;
  notification_evening?: string;
  enable_buddy?: boolean;
  is_admin?: boolean;
  role?: 'user' | 'coach' | 'admin';
  subscription_tier?: 'free' | 'premium';
  subscription_started_at?: string;
  subscription_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  time: string;
  message: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataExport {
  id: string;
  user_id: string;
  export_type: 'pdf' | 'csv';
  date_range_start?: string;
  date_range_end?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  goal_id?: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  target_count: number;
  icon: string;
  created_at: string;
  goal?: Goal;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  note?: string;
  created_at: string;
}
