import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Gamepad2 } from 'lucide-react';

/* ---------------------------------------
   1️⃣ Single source of truth for game keys
---------------------------------------- */
type GameKey =
  | 'ludo'
  | 'carrom'
  | 'chess'
  | 'tic-tac-toe'
  | 'pool'
  | 'cards'
  | 'flappy-bird';

/* ---------------------------------------
   2️⃣ Props (STRICT & SAFE)
---------------------------------------- */
interface GameLauncherProps {
  game: GameKey | null;
  onClose: () => void;
}

/* ---------------------------------------
   3️⃣ Game registry (BUG FREE)
---------------------------------------- */
const gameLinks: Record<GameKey, { url: string; name: string }> = {
  ludo: {
    url: 'https://ludoking.com/play/',
    name: 'Online Ludo',
  },
  carrom: {
    url: 'https://gamesnacks.com/games/carromclash',
    name: 'Carrom Pool',
  },
  chess: {
    url: 'https://www.chess.com/play/online',
    name: 'Chess Online',
  },
  'tic-tac-toe': {
    url: 'https://playtictactoe.org/',
    name: 'Tic Tac Toe',
  },
  pool: {
    url: 'https://www.miniclip.com/games/8-ball-pool-multiplayer',
    name: '8 Ball Pool',
  },
  cards: {
    url: 'https://cardgames.io/hearts/',
    name: 'Card Games',
  },
  'flappy-bird': {
    url: 'https://fly-bird-three.vercel.app/',
    name: 'Flappy Bird',
  },
};

/* ---------------------------------------
   4️⃣ Component
---------------------------------------- */
export const GameLauncher = ({ game, onClose }: GameLauncherProps) => {
  const gameInfo = game ? gameLinks[game] : null;

  const handleLaunch = () => {
    if (!gameInfo) return;

    window.open(
      gameInfo.url,
      '_blank',
      'noopener,noreferrer,width=1024,height=768'
    );

    onClose();
  };

  return (
    <Dialog open={Boolean(game)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Launch Game
          </DialogTitle>
        </DialogHeader>

        {gameInfo && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ready to play{' '}
              <span className="font-semibold text-foreground">
                {gameInfo.name}
              </span>
              ?  
              <br />
              The game will open in a new window.
            </p>

            <div className="flex gap-2">
              <Button onClick={handleLaunch} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Launch Game
              </Button>

              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
