import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export function CreateTeamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    short_name: '',
    city: '',
    state: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/teams', form);
      navigate(`/teams/${data.id}`);
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
          <h1 className="text-xl font-bold">Create Team</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Team Name"
              placeholder="e.g., Mumbai Warriors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Short Name"
              placeholder="e.g., MW"
              maxLength={5}
              value={form.short_name}
              onChange={(e) => setForm({ ...form, short_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Mumbai"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="State"
                placeholder="Maharashtra"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">Create Team</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/teams')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
