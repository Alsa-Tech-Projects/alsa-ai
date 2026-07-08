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
// type GameKey =
//   | 'ludo'
//   | 'carrom'
//   | 'chess'
//   | 'tic-tac-toe'
//   | 'pool'
//   | 'cards'
//   | 'flappy-bird';
type GameKey =
  | 'ludo'
  | 'carrom'
  | 'chess'
  | 'tic-tac-toe'
  | 'pool'
  | 'cards'
  | 'flappy-bird'
  | 'snake'
  | 'sudoku'
  | 'minesweeper'
  | 'tetris'
  | 'pacman'
  | 'checkers'
  | 'bubble-shooter'
  | 'temple-run'
  | 'subway-surfers'
  | 'basketball-stars'
  | 'soccer-legends'
  | 'archery'
  | 'hill-climb'
  | 'racing'
  | 'shooting'
  | 'puzzle'
  | 'wordle'
  | 'crossword'
  | 'memory'
  | '2048'
  | 'breakout'
  | 'fruit-ninja'
  | 'stack-fall'
  | 'space-invaders'
  | 'tower-defense'
  | 'boxing'
  | 'bowling'
  | 'darts'
  | 'golf'
  | 'pingpong'
  | 'quiz'
  | 'trivia'
  | 'solitaire'
  | 'mahjong'
  | 'dominoes'
  | 'sketch'
  | 'typing'
  | 'math'
  | 'hangman'
  | 'slither'
  | 'paper-io'
  | 'chess-puzzle';


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
// const gameLinks: Record<GameKey, { url: string; name: string }> = {
//   ludo: {
//     url: 'https://ludoking.com/play/',
//     name: 'Online Ludo',
//   },
//   carrom: {
//     url: 'https://gamesnacks.com/games/carromclash',
//     name: 'Carrom Pool',
//   },
//   chess: {
//     url: 'https://www.chess.com/play/online',
//     name: 'Chess Online',
//   },
//   'tic-tac-toe': {
//     url: 'https://playtictactoe.org/',
//     name: 'Tic Tac Toe',
//   },
//   pool: {
//     url: 'https://www.miniclip.com/games/8-ball-pool-multiplayer',
//     name: '8 Ball Pool',
//   },
//   cards: {
//     url: 'https://cardgames.io/hearts/',
//     name: 'Card Games',
//   },
//   'flappy-bird': {
//     url: 'https://fly-bird-three.vercel.app/',
//     name: 'Flappy Bird',
//   },
// };


const gameLinks: Record<GameKey, { url: string; name: string }> = {
  ludo: { url: 'https://ludoking.com/play/', name: 'Online Ludo' },
  carrom: { url: 'https://gamesnacks.com/games/carromclash', name: 'Carrom Pool' },
  chess: { url: 'https://www.chess.com/play/online', name: 'Chess Online' },
  'tic-tac-toe': { url: 'https://playtictactoe.org/', name: 'Tic Tac Toe' },
  pool: { url: 'https://www.miniclip.com/games/8-ball-pool-multiplayer', name: '8 Ball Pool' },
  cards: { url: 'https://cardgames.io/hearts/', name: 'Card Games' },
  'flappy-bird': { url: 'https://fly-bird-three.vercel.app/', name: 'Flappy Bird' },

  snake: { url: 'https://playsnake.org/', name: 'Snake Game' },
  sudoku: { url: 'https://sudoku.com/', name: 'Sudoku' },
  minesweeper: { url: 'https://minesweeperonline.com/', name: 'Minesweeper' },
  tetris: { url: 'https://tetris.com/play-tetris', name: 'Tetris' },
  pacman: { url: 'https://freepacman.org/', name: 'Pacman' },
  checkers: { url: 'https://cardgames.io/checkers/', name: 'Checkers' },
  'bubble-shooter': { url: 'https://www.crazygames.com/game/bubble-shooter', name: 'Bubble Shooter' },
  'temple-run': { url: 'https://www.crazygames.com/game/temple-run-2', name: 'Temple Run' },
  'subway-surfers': { url: 'https://www.crazygames.com/game/subway-surfers', name: 'Subway Surfers' },
  'basketball-stars': { url: 'https://www.crazygames.com/game/basketball-stars', name: 'Basketball Stars' },
  'soccer-legends': { url: 'https://www.crazygames.com/game/soccer-legends', name: 'Soccer Legends' },
  archery: { url: 'https://www.crazygames.com/game/archery-world-tour', name: 'Archery' },
  'hill-climb': { url: 'https://www.crazygames.com/game/hill-climb-racing', name: 'Hill Climb Racing' },
  racing: { url: 'https://www.crazygames.com/c/racing', name: 'Racing Games' },
  shooting: { url: 'https://www.crazygames.com/c/shooting', name: 'Shooting Games' },
  puzzle: { url: 'https://www.crazygames.com/c/puzzle', name: 'Puzzle Games' },
  wordle: { url: 'https://www.nytimes.com/games/wordle/index.html', name: 'Wordle' },
  crossword: { url: 'https://www.boatloadpuzzles.com/playcrossword', name: 'Crossword' },
  memory: { url: 'https://www.memozor.com/memory-games/online', name: 'Memory Game' },
  '2048': { url: 'https://play2048.co/', name: '2048' },
  breakout: { url: 'https://www.coolmathgames.com/0-breakout', name: 'Breakout' },
  'fruit-ninja': { url: 'https://www.crazygames.com/game/fruit-ninja', name: 'Fruit Ninja' },
  'stack-fall': { url: 'https://www.crazygames.com/game/stack-fall', name: 'Stack Fall' },
  'space-invaders': { url: 'https://www.freeinvaders.org/', name: 'Space Invaders' },
  'tower-defense': { url: 'https://www.crazygames.com/c/tower-defense', name: 'Tower Defense' },
  boxing: { url: 'https://www.crazygames.com/game/boxing-random', name: 'Boxing' },
  bowling: { url: 'https://www.crazygames.com/game/classic-bowling', name: 'Bowling' },
  darts: { url: 'https://www.crazygames.com/game/darts-pro', name: 'Darts' },
  golf: { url: 'https://www.crazygames.com/game/golf-orbit', name: 'Golf' },
  pingpong: { url: 'https://www.crazygames.com/game/table-tennis-world-tour', name: 'Table Tennis' },
  quiz: { url: 'https://www.sporcle.com/', name: 'Quiz Games' },
  trivia: { url: 'https://www.jetpunk.com/', name: 'Trivia Quiz' },
  solitaire: { url: 'https://solitaired.com/', name: 'Solitaire' },
  mahjong: { url: 'https://mahjongg.com/', name: 'Mahjong' },
  dominoes: { url: 'https://cardgames.io/dominoes/', name: 'Dominoes' },
  sketch: { url: 'https://quickdraw.withgoogle.com/', name: 'Quick Draw' },
  typing: { url: 'https://monkeytype.com/', name: 'Typing Speed Test' },
  math: { url: 'https://www.mathplayground.com/', name: 'Math Games' },
  hangman: { url: 'https://www.hangmanwords.com/play', name: 'Hangman' },
  slither: { url: 'https://slither.io/', name: 'Slither.io' },
  'paper-io': { url: 'https://paper-io.com/', name: 'Paper.io' },
  'chess-puzzle': { url: 'https://www.chess.com/puzzles', name: 'Chess Puzzles' },
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
