import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useScoringStore } from '@/stores/scoring';
import { ExtrasType } from '@crickheroes/shared';

export function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const { currentMatch, currentInnings, balls, loadMatch, recordBall, undoLastBall, subscribeToMatch, unsubscribe } = useScoringStore();

  useEffect(() => {
    if (id) {
      loadMatch(id);
      subscribeToMatch(id);
    }
    return () => unsubscribe();
  }, [id, loadMatch, subscribeToMatch, unsubscribe]);

  if (!currentMatch || !currentInnings) {
    return <div className="text-center py-12">Loading match...</div>;
  }

  const handleRun = (runs: number) => {
    if (!id) return;
    // For now use placeholder batsman/bowler IDs — in real implementation these come from state
    recordBall(id, {
      batsman_id: '', // Will be set from active batsman state
      non_striker_id: '',
      bowler_id: '',
      runs_scored: runs,
      extras_type: ExtrasType.NONE,
      extras_runs: 0,
      is_wicket: false,
      is_boundary: runs === 4 || runs === 6,
    });
  };

  const currentOver = balls.filter((b) => b.innings_id === currentInnings.id);
  const lastSixBalls = currentOver.slice(-6);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Score Summary */}
      <div className="card mb-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            {currentInnings.total_runs}/{currentInnings.total_wickets}
          </h2>
          <p className="text-gray-500">
            Overs: {Math.floor(currentInnings.total_overs)}.{Math.round((currentInnings.total_overs % 1) * 10)}
          </p>
          <p className="text-sm text-gray-400">
            RR: {currentInnings.total_overs > 0
              ? (currentInnings.total_runs / currentInnings.total_overs).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      {/* Over History */}
      <div className="card mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">This Over</h3>
        <div className="flex gap-2">
          {lastSixBalls.map((ball, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                ball.is_wicket ? 'bg-red-100 text-red-700' :
                ball.runs_scored === 4 ? 'bg-blue-100 text-blue-700' :
                ball.runs_scored === 6 ? 'bg-green-100 text-green-700' :
                ball.runs_scored === 0 ? 'bg-gray-100 text-gray-500' :
                'bg-yellow-100 text-yellow-700'
              }`}
            >
              {ball.is_wicket ? 'W' : ball.extras_type !== 'none' ? `${ball.extras_runs}${ball.extras_type[0]}` : ball.runs_scored}
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Buttons */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Runs</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((runs) => (
            <button
              key={runs}
              onClick={() => handleRun(runs)}
              className={`h-14 rounded-lg font-bold text-lg ${
                runs === 4 ? 'bg-blue-500 text-white' :
                runs === 6 ? 'bg-green-500 text-white' :
                'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {runs}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-medium text-gray-500 mb-3">Extras & Wicket</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <button className="h-12 rounded-lg bg-yellow-100 text-yellow-800 font-medium text-sm">Wide</button>
          <button className="h-12 rounded-lg bg-yellow-100 text-yellow-800 font-medium text-sm">No Ball</button>
          <button className="h-12 rounded-lg bg-orange-100 text-orange-800 font-medium text-sm">Bye</button>
          <button className="h-12 rounded-lg bg-orange-100 text-orange-800 font-medium text-sm">Leg Bye</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="h-12 rounded-lg bg-red-500 text-white font-bold">WICKET</button>
          <button
            onClick={() => id && undoLastBall(id)}
            className="h-12 rounded-lg bg-gray-300 text-gray-700 font-medium"
          >
            ↩ Undo
          </button>
        </div>
      </div>
    </div>
  );
}
