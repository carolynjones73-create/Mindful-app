import React, { useState } from 'react';
import { Star, Heart, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TestimonialPromptProps {
  milestone: 7 | 30 | 90;
  onClose: () => void;
  onSubmit: () => void;
}

export default function TestimonialPrompt({ milestone, onClose, onSubmit }: TestimonialPromptProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  const [allowPublic, setAllowPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const getMilestoneMessage = () => {
    switch (milestone) {
      case 7:
        return {
          title: "🎉 Amazing! You've completed 7 days!",
          subtitle: "You're building a powerful habit. How has your first week been?",
          prompt: "What's the biggest change you've noticed in your relationship with money this week?"
        };
      case 30:
        return {
          title: "🏆 Incredible! 30 days of growth!",
          subtitle: "You're officially building a life-changing habit. What's different now?",
          prompt: "How has this daily practice changed your financial confidence or decision-making?"
        };
      case 90:
        return {
          title: "🌟 Phenomenal! 90 days of transformation!",
          subtitle: "You're a true Money Mindset champion. What would you tell others?",
          prompt: "What advice would you give to someone just starting their money mindset journey?"
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0 || !testimonial.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          milestone_days: milestone,
          rating,
          testimonial_text: testimonial,
          allow_public_use: allowPublic,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      onSubmit();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      alert('There was an error submitting your testimonial. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const message = getMilestoneMessage();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{message.title}</h2>
          <p className="text-gray-600 mb-4">{message.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate your experience so far?
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-2 transition-all duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {message.prompt}
            </label>
            <textarea
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Share your experience..."
              required
            />
          </div>

          {/* Public use permission */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowPublic"
              checked={allowPublic}
              onChange={(e) => setAllowPublic(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="allowPublic" className="text-sm text-gray-600">
              I'm happy for this testimonial to be shared publicly to help inspire others on their money mindset journey. 
              <span className="text-gray-500">(Your name will be kept private - we'll only use your first name and last initial)</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0 || !testimonial.trim()}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share My Experience
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}