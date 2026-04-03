import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { npsApi } from "../services/api";
import toast from "react-hot-toast";

function NpsSurveyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkEligibility = async () => {
      try {
        const result = await npsApi.getStatus();
        if (!cancelled && result?.shouldShow) {
          setIsOpen(true);
        }
      } catch {
        // Silently ignore NPS status check failures
      }
    };

    checkEligibility();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (score === null) return;

    setSubmitting(true);
    try {
      await npsApi.submit({ score, comment });
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [score, comment]);

  const handleDismiss = useCallback(async () => {
    try {
      await npsApi.dismiss();
    } catch {
      // Silently ignore dismiss failures
    }
    setIsOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (submitted) {
      setIsOpen(false);
    } else {
      handleDismiss();
    }
  }, [submitted, handleDismiss]);

  const getScoreColor = (value) => {
    if (value <= 6) return "bg-red-500 text-white";
    if (value <= 8) return "bg-amber-500 text-white";
    return "bg-green-500 text-white";
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" data-testid="nps-modal">
      <ModalContent>
        {submitted ? (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                Thank you!
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-gray-700 dark:text-zinc-300 text-base">
                  Thank you for your feedback! Your response helps us improve SchoolSync.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={() => setIsOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                How likely are you to recommend SchoolSync?
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                    On a scale of 0 to 10, how likely are you to recommend SchoolSync to a colleague?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center" data-testid="nps-score-buttons">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setScore(i)}
                        aria-label={`Score ${i}`}
                        className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all ${
                          score === i
                            ? getScoreColor(i)
                            : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400 dark:text-zinc-500">Not likely</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">Very likely</span>
                  </div>
                </div>

                <Textarea
                  label="Any additional feedback?"
                  placeholder="Tell us what we could do better..."
                  value={comment}
                  onValueChange={setComment}
                  minRows={3}
                  data-testid="nps-comment"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleDismiss}>
                Not now
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isDisabled={score === null}
                isLoading={submitting}
                data-testid="nps-submit"
              >
                Submit
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default React.memo(NpsSurveyModal);
