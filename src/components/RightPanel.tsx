import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="w-screen min-h-screen bg-[#071028] overflow-x-hidden">

      {/* Outer wrapper */}
      <div className="w-full px-2 py-3">

        {/* Back Button */}
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-1 text-white text-xs mb-3"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Card */}
        <div className="w-full bg-[#0b162f] border border-white/10 rounded-lg p-3 sm:p-4 overflow-hidden">

          <h1 className="text-base text-white font-semibold mb-1">
            Custom Apps
          </h1>

          <p className="text-xs text-white/60 mb-4">
            Add your applications with their paths
          </p>

          {/* Form */}
          <div className="flex flex-col gap-3 w-full">

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase font-bold px-1">App Name</label>
              <input
                type="text"
                placeholder="e.g. Chrome"
                className
                ="w-full text-xs bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase font-bold px-1">Full Path</label>
              <input
                type="text"
                placeholder="C:\Program Files\..."
                className="w-full text-xs bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full">

            <button className="w-full sm:w-1/2 text-xs border border-white/20 rounded-md py-2 text-white hover:bg-white/5 transition-colors">
              Cancel
            </button>

            <button className="w-full sm:w-1/2 text-xs bg-blue-600 hover:bg-blue-700 rounded-md py-2 text-white transition-colors font-medium">
              Save App
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
