import { useState, useEffect, useRef } from 'react';
import logger from '../../../utils/logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { callsApi } from '../../../services/api';
import videoCallService from '../../../services/videoCallService';

export function useChatVideoCall({ user, selectedConversation }) {
  const { t } = useTranslation();
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);

  // Refs so the event listeners (registered once on mount) always see the
  // latest values without re-subscribing on every render.
  const userRef = useRef(user);
  const selectedConversationRef = useRef(selectedConversation);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ── Subscribe to PeerJS service events ───────────────────────────────────
  // Without this, the service emits remoteStream/incomingCall/callAccepted
  // into the void: remote video stays black, the caller's status never flips
  // past 'initiated', and incoming calls never open the modal (STUB-09).
  useEffect(() => {
    const handleIncomingCall = ({ callId, callerId, metadata }) => {
      const convo = selectedConversationRef.current;
      const remoteUserName = convo?.otherParticipant?.name || metadata?.callerName || 'Unknown';
      setActiveCall({
        callId,
        callerId,
        callerName: metadata?.callerName || remoteUserName,
        callType: metadata?.callType || 'video',
        status: 'incoming',
        remoteUserName
      });
      setRemoteStream(null);
      setLocalStream(null);
      setShowVideoCall(true);
    };

    const handleRemoteStream = ({ stream }) => {
      setRemoteStream(stream);
      // Once media is flowing, the call is fully connected — flip the caller
      // out of the 'initiated' waiting state.
      setActiveCall(prev => prev && prev.status !== 'connected' ? { ...prev, status: 'connected' } : prev);
    };

    const handleCallAccepted = ({ callId }) => {
      setActiveCall(prev => prev && prev.callId === callId ? { ...prev, status: 'connected' } : prev);
    };

    const handleCallEnded = ({ callId }) => {
      setActiveCall(prev => {
        if (!prev || prev.callId !== callId) return prev;
        setRemoteStream(null);
        setLocalStream(null);
        setShowVideoCall(false);
        return null;
      });
    };

    const handleCallClosed = () => {
      // The remote peer hung up or the connection dropped. The service only
      // emits callClosed from setupCallHandlers attached to a call we placed
      // or answered, so if a call is active, treat this as its close event.
      setActiveCall(prev => {
        if (!prev) return prev;
        videoCallService.endCall(prev.callId);
        setRemoteStream(null);
        setLocalStream(null);
        setShowVideoCall(false);
        return null;
      });
    };

    const handleCallError = (error) => {
      logger.error('Video call error:', error);
      toast.error(t('toast.error.callFailed') || 'Video call failed');
      setActiveCall(prev => {
        if (!prev) return prev;
        videoCallService.endCall(prev.callId);
        setRemoteStream(null);
        setLocalStream(null);
        setShowVideoCall(false);
        return null;
      });
    };

    videoCallService.on('incomingCall', handleIncomingCall);
    videoCallService.on('remoteStream', handleRemoteStream);
    videoCallService.on('callAccepted', handleCallAccepted);
    videoCallService.on('callEnded', handleCallEnded);
    videoCallService.on('callClosed', handleCallClosed);
    videoCallService.on('callError', handleCallError);

    return () => {
      videoCallService.off('incomingCall', handleIncomingCall);
      videoCallService.off('remoteStream', handleRemoteStream);
      videoCallService.off('callAccepted', handleCallAccepted);
      videoCallService.off('callEnded', handleCallEnded);
      videoCallService.off('callClosed', handleCallClosed);
      videoCallService.off('callError', handleCallError);
    };
  }, [t]);

  const handleVideoCall = async (callType = 'video') => {
    if (!selectedConversation) return;

    try {
      await videoCallService.initialize(user.id);

      const response = await callsApi.initiate({
        to: {
          userId: selectedConversation.otherParticipant.userId,
          userModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student'
        },
        callType
      });

      setActiveCall({
        callId: response._id,
        callerId: user.id,
        callerName: user.name,
        callType,
        status: 'initiated',
        remoteUserName: selectedConversation.otherParticipant.name
      });

      await videoCallService.startCall(
        selectedConversation.otherParticipant.userId,
        {
          video: callType === 'video',
          audio: true,
          callId: response._id,
          callerName: user.name
        }
      );
      // The service acquired the caller's camera/mic in startCall — surface it
      // so the modal can render the local preview while waiting for accept.
      if (videoCallService.localStream) {
        setLocalStream(videoCallService.localStream);
      }

      setShowVideoCall(true);
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated`);
    } catch (error) {
      logger.error('Error initiating call:', error);
      toast.error(t('toast.error.failedToInitiateCall'));
    }
  };

  const handleAcceptCall = async (callId) => {
    try {
      await callsApi.accept(callId);
      await videoCallService.acceptCall(callId);
      // The service acquired the mic/camera in acceptCall — surface it so the
      // modal renders the callee's local preview during the connected call.
      if (videoCallService.localStream) {
        setLocalStream(videoCallService.localStream);
      }
      setActiveCall(prev => ({ ...prev, status: 'connected' }));
    } catch (error) {
      logger.error('Error accepting call:', error);
      toast.error(t('toast.error.failedToAcceptCall'));
    }
  };

  const handleRejectCall = async (callId) => {
    try {
      await callsApi.reject(callId);
      videoCallService.rejectCall(callId);
      setShowVideoCall(false);
      setActiveCall(null);
      setRemoteStream(null);
      setLocalStream(null);
    } catch (error) {
      logger.error('Error rejecting call:', error);
      toast.error(t('toast.error.failedToRejectCall'));
    }
  };

  const handleEndCall = async (callId) => {
    try {
      await callsApi.end(callId, 'user_ended');
      videoCallService.endCall(callId);
      setShowVideoCall(false);
      setActiveCall(null);
      setRemoteStream(null);
      setLocalStream(null);
      toast.success(t('toast.success.callEnded'));
    } catch (error) {
      logger.error('Error ending call:', error);
      toast.error(t('toast.error.failedToEndCall'));
    }
  };

  const closeVideoCall = () => {
    // Esc / backdrop dismissal is wired to this handler instead of the End
    // button, so tear down the active call in the service to release its
    // media stream and peer connection — otherwise the mic/camera stay live
    // after the modal closes (MEM-01). endCall is idempotent, so this is safe
    // even when the call was already ended via the End button.
    if (activeCall?.callId) {
      videoCallService.endCall(activeCall.callId);
    }
    setShowVideoCall(false);
    setActiveCall(null);
    setRemoteStream(null);
    setLocalStream(null);
  };

  return {
    showVideoCall,
    activeCall,
    remoteStream,
    localStream,
    handleVideoCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    closeVideoCall,
  };
}
