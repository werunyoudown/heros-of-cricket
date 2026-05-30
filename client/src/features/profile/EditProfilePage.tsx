import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    role: '',
    batting_style: '',
    bowling_style: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        role: profile.role || '',
        batting_style: profile.batting_style || '',
        bowling_style: profile.bowling_style || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/players/${profile?.id}`, form);
      await fetchProfile();
      navigate(`/profile/${profile?.id}`);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <Input
              label="Display Name"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <Select
              label="Playing Role"
              options={[
                { value: '', label: 'Select role' },
                { value: 'batsman', label: 'Batsman' },
                { value: 'bowler', label: 'Bowler' },
                { value: 'all_rounder', label: 'All Rounder' },
                { value: 'wicket_keeper', label: 'Wicket Keeper' },
              ]}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Select
              label="Batting Style"
              options={[
                { value: '', label: 'Select' },
                { value: 'right_hand', label: 'Right Hand' },
                { value: 'left_hand', label: 'Left Hand' },
              ]}
              value={form.batting_style}
              onChange={(e) => setForm({ ...form, batting_style: e.target.value })}
            />
            <Select
              label="Bowling Style"
              options={[
                { value: '', label: 'Select' },
                { value: 'right_arm_fast', label: 'Right Arm Fast' },
                { value: 'right_arm_medium', label: 'Right Arm Medium' },
                { value: 'left_arm_fast', label: 'Left Arm Fast' },
                { value: 'left_arm_medium', label: 'Left Arm Medium' },
                { value: 'right_arm_off_spin', label: 'Right Arm Off Spin' },
                { value: 'right_arm_leg_spin', label: 'Right Arm Leg Spin' },
                { value: 'left_arm_orthodox', label: 'Left Arm Orthodox' },
                { value: 'left_arm_chinaman', label: 'Left Arm Chinaman' },
              ]}
              value={form.bowling_style}
              onChange={(e) => setForm({ ...form, bowling_style: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
