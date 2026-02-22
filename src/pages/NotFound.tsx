import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error - Route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 py-12 text-white">
      {/* Robot Image Container */}
      <div className="relative mb-8 w-full max-w-[300px] md:max-w-[450px]">
        <img 
          src="/path-to-your-robot-image.png" 
          alt="Broken AI Robot" 
          className="h-auto w-full object-contain opacity-80"
        />
        {/* Glow Effect behind the robot */}
        <div className="absolute inset-0 -z-10 bg-blue-500/20 blur-[100px] rounded-full"></div>
      </div>

      {/* Content Section */}
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-extrabold tracking-tighter md:text-8xl">
          404
        </h1>
        <h2 className="mb-4 text-xl font-semibold uppercase tracking-widest text-gray-400 md:text-2xl">
          System Core Failure
        </h2>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-gray-500 md:text-base">
          Our AI unit encountered a critical error while searching for <span className="text-blue-400">"{location.pathname}"</span>. 
          The circuits are fried, but we're working on the recovery.
        </p>

        {/* Action Button */}
        <Link
          to="/"
          className="inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:bg-blue-500 hover:text-white md:px-10 md:py-4"
        >
          REBOOT SYSTEM (HOME)
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
