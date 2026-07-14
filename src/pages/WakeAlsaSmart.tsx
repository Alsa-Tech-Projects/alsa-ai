import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WakeOverlay from "@/components/WakeOverlay";
import WakeInput from "@/components/WakeInput";

const WakeAlsaSmart = () => {
  const navigate = useNavigate();

  const [isListening] = useState(true);
  const [isSpeaking] = useState(false);

  const [transcript, setTranscript] = useState("");

  const closeOverlay = () => {
    navigate(-1);
  };

  const openFullChat = () => {
    navigate("/Chat", {
      state: {
        wakeMode: true,
        transcript,
      },
    });
  };

  return (
    <>
      <WakeOverlay
        isListening={isListening}
        isSpeaking={isSpeaking}
        transcript={transcript}
        onClose={closeOverlay}
      />

      <WakeInput
        transcript={transcript}
        isListening={isListening}
        onExpand={openFullChat}
      />
    </>
  );
};

export default WakeAlsaSmart;
