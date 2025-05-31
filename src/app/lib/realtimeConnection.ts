// import { RefObject } from "react";

// export async function createRealtimeConnection(
//   EPHEMERAL_KEY: string,
//   audioElement: RefObject<HTMLAudioElement | null>,
//   codec: string
// ): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
//   const pc = new RTCPeerConnection();

//   pc.ontrack = (e) => {
//     if (audioElement.current) {
//       audioElement.current.srcObject = e.streams[0];
//     }
//   };

//   const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
//   pc.addTrack(ms.getTracks()[0]);

//   // Set codec preferences based on selected codec from the query parameter.
//   const capabilities = RTCRtpSender.getCapabilities("audio");
//   if (capabilities) {
//     const chosenCodec = capabilities.codecs.find(
//       (c) => c.mimeType.toLowerCase() === `audio/${codec}`
//     );
//     if (chosenCodec) {
//       pc.getTransceivers()[0].setCodecPreferences([chosenCodec]);
//     } else {
//       console.warn(
//         `Codec "${codec}" not found in capabilities. Using default settings.`
//       );
//     }
//   }

//   const dc = pc.createDataChannel("oai-events");

//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   const baseUrl = "https://api.openai.com/v1/realtime";
//   // const model = "gpt-4o-mini-realtime-preview-2024-12-17";
//   const model = "gpt-4o-realtime-preview-2024-12-17";

//   const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
//     method: "POST",
//     body: offer.sdp,
//     headers: {
//       Authorization: `Bearer ${EPHEMERAL_KEY}`,
//       "Content-Type": "application/sdp",
//     },
//   });

//   const answerSdp = await sdpResponse.text();
//   const answer: RTCSessionDescriptionInit = {
//     type: "answer",
//     sdp: answerSdp,
//   };

//   await pc.setRemoteDescription(answer);

//   return { pc, dc };
// }






import { RefObject } from "react";

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>,
  codec: string
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let localStream: MediaStream | null = null;

  try {
    // Create peer connection with ICE servers for better connectivity
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    // Set up track handler to play incoming audio
    pc.ontrack = (e) => {
      console.log("Received remote audio track");
      if (audioElement.current && e.streams[0]) {
        audioElement.current.srcObject = e.streams[0];
        audioElement.current
          .play()
          .catch((err) => console.error("Audio playback failed:", err));
      }
    };

    // Add connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc?.connectionState);
      if (pc?.connectionState === "failed") {
        console.error("WebRTC connection failed");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc?.iceConnectionState);
    };

    // Get local microphone stream with error handling
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        } 
      });
      console.log("Got local audio stream");
    } catch (micError) {
      console.error("Microphone access failed:", micError);
      throw new Error(`Microphone access denied: ${micError instanceof Error ? micError.message : 'Unknown error'}`);
    }

    // Add transceiver instead of addTrack to allow setting codec preferences
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error("No audio track found in local stream");
    }

    const transceiver = pc.addTransceiver(audioTrack, { 
      direction: "sendrecv" 
    });

    // Set codec preferences if supported
    try {
      if ("getCapabilities" in RTCRtpSender) {
        const capabilities = RTCRtpSender.getCapabilities("audio");
        if (capabilities) {
          const chosenCodec = capabilities.codecs.find(
            (c) => c.mimeType.toLowerCase() === `audio/${codec.toLowerCase()}`
          );
          if (chosenCodec) {
            transceiver.setCodecPreferences([chosenCodec]);
            console.log(`Set codec preference to ${codec}`);
          } else {
            console.warn(`Codec "${codec}" not found. Available codecs:`, 
              capabilities.codecs.map(c => c.mimeType));
          }
        }
      }
    } catch (codecError) {
      console.warn("Failed to set codec preferences:", codecError);
      // Continue without codec preferences
    }

    // Create a data channel with error handling
    dc = pc.createDataChannel("oai-events", {
      ordered: true
    });

    dc.onerror = (error) => {
      console.error("Data channel error:", error);
    };

    dc.onopen = () => {
      console.log("Data channel opened");
    };

    dc.onclose = () => {
      console.log("Data channel closed");
    };

    // Create and set local offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    
    if (!offer.sdp) {
      throw new Error("Failed to create SDP offer");
    }

    await pc.setLocalDescription(offer);
    console.log("Set local description");

    // Wait for ICE gathering to complete or timeout
    await waitForIceGatheringComplete(pc, 5000);

    // Fetch remote SDP answer from OpenAI
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    
    console.log("Sending SDP to OpenAI...");
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: pc.localDescription?.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    // Handle response errors
    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error("SDP fetch failed:", sdpResponse.status, errorText);
      throw new Error(`SDP fetch failed: ${sdpResponse.status} - ${errorText}`);
    }

    // Set remote description with answer
    const answerSdp = await sdpResponse.text();
    if (!answerSdp || answerSdp.trim() === "") {
      throw new Error("Received empty SDP answer from OpenAI");
    }

    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: answerSdp,
    };

    await pc.setRemoteDescription(answer);
    console.log("Set remote description");

    // Wait for connection to be established
    await waitForConnection(pc, 10000);

    return { pc, dc };

  } catch (error) {
    // Cleanup on error
    console.error("Error creating realtime connection:", error);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (pc) {
      pc.close();
    }
    
    throw error;
  }
}

// Helper function to wait for ICE gathering to complete
function waitForIceGatheringComplete(pc: RTCPeerConnection, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('ICE gathering timeout'));
    }, timeout);

    const handleStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', handleStateChange);
        resolve();
      }
    };

    pc.addEventListener('icegatheringstatechange', handleStateChange);
  });
}

// Helper function to wait for connection to be established
function waitForConnection(pc: RTCPeerConnection, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pc.connectionState === 'connected') {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`Connection timeout. Final state: ${pc.connectionState}`));
    }, timeout);

    const handleStateChange = () => {
      console.log("Connection state changed to:", pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        clearTimeout(timer);
        pc.removeEventListener('connectionstatechange', handleStateChange);
        resolve();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        clearTimeout(timer);
        pc.removeEventListener('connectionstatechange', handleStateChange);
        reject(new Error(`Connection failed. State: ${pc.connectionState}`));
      }
    };

    pc.addEventListener('connectionstatechange', handleStateChange);
  });
}





