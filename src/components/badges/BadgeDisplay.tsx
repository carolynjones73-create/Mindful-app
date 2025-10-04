import React from 'react';
import { Badge, UserBadge } from '../../types';
import { Award, Star, Target, Zap, Trophy, Medal, Crown, Gem } from 'lucide-react';

interface BadgeDisplayProps {
  badges: Badge[];
  userBadges: UserBadge[];
  showAll?: boolean;
  userStats?: {
    totalStars: number;
    totalCompletions: number;
    currentStreak: number;
  };
}

export default function BadgeDisplay({ badges, userBadges, showAll = false, userStats }: BadgeDisplayProps) {
  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'star': Star,
      'target': Target,
      'zap': Zap,
      'trophy': Trophy,
      'medal': Medal,
      'crown': Crown,
      'gem': Gem,
      'award': Award
    };
    
    return iconMap[iconName] || Award;
  };

  const getBadgeColor = (badge: Badge, isEarned: boolean) => {
    if (!isEarned) {
      return 'bg-gray-100 border-gray-200 text-gray-400';
    }

    if (badge.tier === 'premium') {
      return 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-300 text-amber-700';
    }

    switch (badge.requirement_type) {
      case 'streak':
        return 'bg-orange-100 border-orange-200 text-orange-600';
      case 'completion':
        return 'bg-blue-100 border-blue-200 text-blue-600';
      case 'milestone':
        return 'bg-purple-100 border-purple-200 text-purple-600';
      default:
        return 'bg-emerald-100 border-emerald-200 text-emerald-600';
    }
  };

  const getProgressText = (badge: Badge) => {
    if (!userStats) return '';
    
    let current = 0;
    let target = badge.requirement_value;
    
    // If badge is already earned, don't show progress
    if (earnedBadgeIds.includes(badge.id)) {
      return '';
    }
    
    // Special handling for specific badges
    if (badge.name === 'First Steps') {
      // First Steps is based on morning intentions, not stars
      current = userStats.totalMorningIntentions || 0;
      return `${current}/${target} morning intentions`;
    }
    
    if (badge.name === 'Getting Started') {
      // Getting Started is based on full day completions
      current = userStats.totalCompletions;
      return `${current}/${target} full days`;
    }
    
    switch (badge.requirement_type) {
      case 'streak':
        current = userStats.currentStreak;
        return `${current}/${target} days`;
      case 'completion':
        current = userStats.totalCompletions;
        return `${current}/${target} full days`;
      case 'milestone':
        current = userStats.totalStars;
        return `${current}/${target} stars`;
    }
    
    return '';
  };

  const getProgressPercentage = (badge: Badge) => {
    if (!userStats) return 0;
    
    // If badge is already earned, show 100%
    if (earnedBadgeIds.includes(badge.id)) {
      return 100;
    }
    
    let current = 0;
    let target = badge.requirement_value;
    
    // Special handling for specific badges
    if (badge.name === 'First Steps') {
      current = userStats.totalMorningIntentions || 0;
    } else if (badge.name === 'Getting Started') {
      current = userStats.totalCompletions;
    } else {
      // Use general requirement logic
      switch (badge.requirement_type) {
        case 'streak':
          current = userStats.currentStreak;
          break;
        case 'completion':
          current = userStats.totalCompletions;
          break;
        case 'milestone':
          current = userStats.totalStars;
          break;
      }
    }
    return Math.min((current / target) * 100, 100);
  };

  const getRequirementText = (badge: Badge) => {
    switch (badge.requirement_type) {
      case 'streak':
        return `${badge.requirement_value} consecutive days`;
      case 'completion':
        return `${badge.requirement_value} full days (morning + evening)`;
      case 'milestone':
        return `${badge.requirement_value} total stars`;
      default:
        return '';
    }
  };

  const getNextBadgeToEarn = () => {
    // Filter out earned badges
    const unearnedBadges = badges.filter(badge => !earnedBadgeIds.includes(badge.id));
    
    if (unearnedBadges.length === 0) return null;
    
    // Sort by how close user is to earning them
    return unearnedBadges.sort((a, b) => {
      const progressA = getProgressPercentage(a);
      const progressB = getProgressPercentage(b);
      
      // If both are at 100%, sort by requirement value (easier first)
      if (progressA >= 100 && progressB >= 100) {
        return a.requirement_value - b.requirement_value;
      }
      
      // Otherwise sort by progress descending, then by requirement value for ties
      if (Math.abs(progressB - progressA) < 1) {
        return a.requirement_value - b.requirement_value;
      }
      return progressB - progressA;
    })[0];
  };

  const displayBadges = showAll ? badges : badges.slice(0, 6);
  const nextBadge = getNextBadgeToEarn();

  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No badges available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Badge to Earn */}
      {nextBadge && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              {React.createElement(getIconComponent(nextBadge.icon), { className: "w-6 h-6 text-gray-400" })}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Next Badge: {nextBadge.name}</h4>
              <p className="text-gray-600 mb-3">{nextBadge.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(nextBadge)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {getProgressText(nextBadge)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-purple-700 bg-white/70 rounded-lg p-3">
            <strong>How to earn:</strong> {getRequirementText(nextBadge)}
          </div>
        </div>
      )}

      {/* All Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayBadges.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const IconComponent = getIconComponent(badge.icon);
          const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
          const progress = getProgressPercentage(badge);
          
          return (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${getBadgeColor(badge, isEarned)} ${
                isEarned ? 'shadow-lg hover:shadow-xl transform hover:scale-105' : 'opacity-60 hover:opacity-80'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                  isEarned ? 'bg-white shadow-md' : 'bg-gray-200'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <h4 className="font-bold text-sm">{badge.name}</h4>
                  {badge.tier === 'premium' && (
                    <Crown size={14} className="text-amber-600 fill-current" />
                  )}
                </div>
                <p className="text-xs opacity-80 leading-tight mb-3">{badge.description}</p>
                
                {isEarned && userBadge && (
                  <div className="text-xs opacity-70">
                    Earned {new Date(userBadge.earned_at!).toLocaleDateString()}
                  </div>
                )}
                
                {!isEarned && (
                  <div className="space-y-2">
                    {getProgressText(badge) && (
                      <div className="text-xs font-medium">{getProgressText(badge)}</div>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-current h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    {getProgressText(badge) && (
                      <div className="text-xs opacity-60">{getRequirementText(badge)}</div>
                    )}
                  </div>
                )}
              </div>
              
              {isEarned && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-yellow-800 fill-current" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}