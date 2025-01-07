'use client';

import { useState, useRef, useEffect } from 'react';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecordingStatus = 'idle' | 'recording' | 'paused';
type DialogType = 'none' | 'save' | 'close' | 'discard';

export default function RecordingModal({ isOpen, onClose }: RecordingModalProps) {
  // States
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [currentDialog, setCurrentDialog] = useState<DialogType>('none');
  const [filename, setFilename] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle modal close attempt
  const handleClose = () => {
    if (recordingStatus === 'recording') {
      pauseRecording();
    }
    if (recordingStatus !== 'idle') {
      setCurrentDialog('close');
    } else {
      onClose();
    }
  };

  // Handle stop button click
  const handleStop = () => {
    if (recordingStatus === 'recording') {
      pauseRecording();
    }
    setCurrentDialog('save');
  };

  // Handle save confirmation
  const handleSave = async () => {
    if (!filename.trim()) return;

    setIsSaving(true);
    try {
      const finalFilename = filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;

      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));
      stopRecording();
      setCurrentDialog('none');
      setFilename('');
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving recording:', error);
      setIsSaving(false);
      alert('Failed to save recording');
    }
  };

  // Handle discard confirmation
  const handleDiscard = () => {
    stopRecording();
    setCurrentDialog('none');
    onClose();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRecordingStatus('recording');

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone');
    }
  };

  const pauseRecording = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setRecordingStatus('recording');
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
    setRecordingStatus('idle');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
      {/* Save Dialog */}
      {currentDialog === 'save' && (
        <div className="absolute bg-white rounded-lg p-6 shadow-xl z-[10000] w-96">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Recording</h3>
          <div className="relative">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter file name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-12"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">.mp3</span>
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setCurrentDialog('none')}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!filename.trim() || isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={isSaving ? 'text-white' : ''}>
                {isSaving ? 'Saving...' : 'Save'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="bg-white rounded-lg p-8 w-[450px] relative">
        {/* Timer Animation */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <div
            className={`absolute inset-0 rounded-full border-[6px] border-blue-300 animate-pulse z-[-1]`}
          ></div>
          <div
            className={`absolute inset-0 rounded-full border-[6px] border-blue-200 animate-spin`}
          ></div>
          <div className="flex items-center justify-center w-full h-full rounded-full bg-white">
            <span
              className={`text-4xl font-mono ${
                duration % 2 === 0 ? 'text-blue-500' : 'text-blue-400'
              }`}
            >
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          {recordingStatus === 'idle' ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all"
            >
              Start Recording
            </button>
          ) : (
            <>
              <button
                onClick={recordingStatus === 'recording' ? pauseRecording : resumeRecording}
                className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-all"
              >
                {recordingStatus === 'recording' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleStop}
                className={`px-6 py-3 rounded-lg text-white ${
                  recordingStatus === 'paused'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-red-500 hover:bg-red-600'
                } transition-all`}
              >
                Stop
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
