interface QuickLinksProps {
  onAction: (action: string) => void;
}

const QuickLinks = ({ onAction }: QuickLinksProps) => {
  const links = [
    { name: 'Youtube', color: 'text-red-400', action: 'open youtube' },
    { name: 'Spotify', color: 'text-green-400', action: 'open spotify' },
    { name: 'Google', color: 'text-blue-400', action: 'search google' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {links.map((link) => (
        <button
          key={link.name}
          onClick={() => onAction(link.action)}
          className={`text-2xl font-bold ${link.color} hover:opacity-80 transition-opacity text-right`}
        >
          {link.name}
        </button>
      ))}
    </div>
  );
};

export default QuickLinks;
