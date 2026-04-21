import { useState } from 'react';
import logger from '../../../utils/logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { callsApi } from '../../../services/api';
import videoCallService from '../../../services/videoCallService';

export function useChatVideoCall({ user, selectedConversation }) {
  const { t } = useTranslation();
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

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
        { video: callType === 'video', audio: true, callId: response._id }
      );

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
      toast.success(t('toast.success.callEnded'));
    } catch (error) {
      logger.error('Error ending call:', error);
      toast.error(t('toast.error.failedToEndCall'));
    }
  };

  const closeVideoCall = () => {
    setShowVideoCall(false);
    setActiveCall(null);
  };

  return {
    showVideoCall,
    activeCall,
    handleVideoCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    closeVideoCall,
  };
}
