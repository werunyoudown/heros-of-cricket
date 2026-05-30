import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { Team } from '@crickheroes/shared';

type Step = 'teams' | 'details' | 'toss';

export function CreateMatchPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('teams');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const [form, setForm] = useState({
    team_a_id: '',
    team_b_id: '',
    match_type: 'T20',
    overs_per_innings: 20,
    venue: '',
    city: '',
    match_date: new Date().toISOString().split('T')[0],
    toss_winner_id: '',
    toss_decision: 'bat',
  });

  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/matches', form);
      navigate(`/matches/${data.id}/score`);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const teamOptions = [
    { value: '', label: 'Select a team' },
    ...teams.map((t) => ({ value: t.id, label: t.name })),
  ];

  const selectedTeamA = teams.find((t) => t.id === form.team_a_id);
  const selectedTeamB = teams.find((t) => t.id === form.team_b_id);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['teams', 'details', 'toss'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold">
            {step === 'teams' && 'Select Teams'}
            {step === 'details' && 'Match Details'}
            {step === 'toss' && 'Toss'}
          </h1>
        </CardHeader>
        <CardContent>
          {step === 'teams' && (
            <div className="space-y-4">
              <Select
                label="Team A (Home)"
                options={teamOptions.filter((o) => o.value !== form.team_b_id)}
                value={form.team_a_id}
                onChange={(e) => setForm({ ...form, team_a_id: e.target.value })}
              />
              <div className="text-center text-gray-400 font-medium">VS</div>
              <Select
                label="Team B (Away)"
                options={teamOptions.filter((o) => o.value !== form.team_a_id)}
                value={form.team_b_id}
                onChange={(e) => setForm({ ...form, team_b_id: e.target.value })}
              />
              <Button
                className="w-full mt-4"
                disabled={!form.team_a_id || !form.team_b_id}
                onClick={() => setStep('details')}
              >
                Next →
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <Select
                label="Match Type"
                options={[
                  { value: 'T20', label: 'T20 (20 overs)' },
                  { value: 'ODI', label: 'ODI (50 overs)' },
                  { value: 'Test', label: 'Test' },
                  { value: 'custom', label: 'Custom' },
                ]}
                value={form.match_type}
                onChange={(e) => {
                  const type = e.target.value;
                  const overs = type === 'T20' ? 20 : type === 'ODI' ? 50 : type === 'Test' ? 90 : form.overs_per_innings;
                  setForm({ ...form, match_type: type, overs_per_innings: overs });
                }}
              />
              {form.match_type === 'custom' && (
                <Input
                  label="Overs per Innings"
                  type="number"
                  min={1}
                  max={90}
                  value={form.overs_per_innings}
                  onChange={(e) => setForm({ ...form, overs_per_innings: parseInt(e.target.value) || 20 })}
                />
              )}
              <Input
                label="Venue"
                placeholder="Ground name"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
              <Input
                label="City"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="Match Date"
                type="date"
                value={form.match_date}
                onChange={(e) => setForm({ ...form, match_date: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('teams')}>← Back</Button>
                <Button className="flex-1" onClick={() => setStep('toss')}>Next →</Button>
              </div>
            </div>
          )}

          {step === 'toss' && (
            <div className="space-y-4">
              <Select
                label="Toss Won By"
                options={[
                  { value: '', label: 'Select team' },
                  { value: form.team_a_id, label: selectedTeamA?.name || 'Team A' },
                  { value: form.team_b_id, label: selectedTeamB?.name || 'Team B' },
                ]}
                value={form.toss_winner_id}
                onChange={(e) => setForm({ ...form, toss_winner_id: e.target.value })}
              />
              <Select
                label="Chose to"
                options={[
                  { value: 'bat', label: '🏏 Bat First' },
                  { value: 'bowl', label: '🎳 Bowl First' },
                ]}
                value={form.toss_decision}
                onChange={(e) => setForm({ ...form, toss_decision: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('details')}>← Back</Button>
                <Button
                  className="flex-1"
                  loading={loading}
                  disabled={!form.toss_winner_id}
                  onClick={handleSubmit}
                >
                  Start Match 🏏
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
