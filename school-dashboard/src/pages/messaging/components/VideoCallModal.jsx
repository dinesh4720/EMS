import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@heroui/react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Speaker } from 'lucide-react';

export default function VideoCallModal({
  isOpen,
  onClose,
  call,
  currentUser,
  onAccept,
  onReject,
  onEnd
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    let interval;

    if (call && call.status === 'connected') {
      // Start duration timer
      const startTime = Date.now() - (call.duration * 1000 || 0);
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [call]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: call.callType === 'video',
        audio: true
      });

      setLocalStream(stream);
      onAccept(call.callId);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const handleEnd = () => {
    // Stop tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);

    onEnd(call.callId);
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" hideCloseButton>
      <ModalContent className="bg-black">
        <ModalHeader className="text-white border-none">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-lg font-semibold">
                {call?.status === 'incoming' ? 'Incoming Call' :
                 call?.status === 'connected' ? 'Connected' :
                 'Call'}
              </h3>
              {call?.status === 'connected' && (
                <p className="text-sm text-default-400">{formatDuration(callDuration)}</p>
              )}
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-0">
          {/* Incoming Call Screen */}
          {call?.status === 'incoming' && (
            <div className="flex flex-col items-center justify-center h-[500px] text-white">
              <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center mb-6">
                <span className="text-4xl">👤</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                {call.callerName || 'Unknown'}
              </h2>
              <p className="text-default-400 mb-8">
                {call.callType === 'video' ? 'Video call' : 'Audio call'} • Incoming...
              </p>

              <div className="flex items-center gap-6">
                <Button
                  color="danger"
                  size="lg"
                  isIconOnly
                  onClick={() => {
                    onReject(call.callId);
                    onClose();
                  }}
                  className="w-16 h-16 rounded-full"
                >
                  <PhoneOff size={28} />
                </Button>
                <Button
                  color="success"
                  size="lg"
                  isIconOnly
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full"
                >
                  <Phone size={28} />
                </Button>
              </div>
            </div>
          )}

          {/* Connected Call Screen */}
          {call?.status === 'connected' && (
            <div className="relative h-[500px] bg-gradient-to-b from-gray-900 to-black">
              {/* Remote Video (Full Screen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (PiP) */}
              {call.callType === 'video' && localStream && (
                <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 dark:border-white/15 bg-black">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </div>
              )}

              {/* Call Info Overlay */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <p className="font-semibold">{call.remoteUserName || 'Unknown'}</p>
                <p className="text-sm text-default-300">{formatDuration(callDuration)}</p>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    isIconOnly
                    size="lg"
                    className={`w-14 h-14 rounded-full ${audioEnabled ? 'bg-white/20 dark:bg-white/15' : 'bg-danger'}`}
                    onClick={toggleAudio}
                  >
                    {audioEnabled ? <Mic size={24} className="text-white" /> : <MicOff size={24} />}
                  </Button>

                  {call.callType === 'video' && (
                    <Button
                      isIconOnly
                      size="lg"
                      className={`w-14 h-14 rounded-full ${videoEnabled ? 'bg-white/20 dark:bg-white/15' : 'bg-danger'}`}
                      onClick={toggleVideo}
                    >
                      {videoEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} />}
                    </Button>
                  )}

                  <Button
                    isIconOnly
                    size="lg"
                    color="danger"
                    className="w-16 h-16 rounded-full"
                    onClick={() => {
                      handleEnd();
                      onClose();
                    }}
                  >
                    <PhoneOff size={28} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
