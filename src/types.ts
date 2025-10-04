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
