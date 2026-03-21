import { useState, useMemo } from "react";
import { Button, Textarea } from "@heroui/react";
import { Star, Award, Clock, Edit3, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const RATING_DIMENSIONS = [
  { key: "behaviour", label: "Behaviour", icon: Award, description: "Conduct and attitude" },
  { key: "academics", label: "Academics", icon: Award, description: "Subject performance" },
  { key: "extraCurricular", label: "Extra Curricular", icon: Award, description: "Activities & sports" },
  { key: "attendance", label: "Attendance", icon: Award, description: "Presence record" },
  { key: "discipline", label: "Discipline", icon: Award, description: "Rules adherence" }
];

const RATING_LABELS = {
  0: { text: "Not Rated", color: "gray" },
  1: { text: "Needs Improvement", color: "gray" },
  2: { text: "Fair", color: "gray" },
  3: { text: "Good", color: "gray" },
  4: { text: "Very Good", color: "gray" },
  5: { text: "Excellent", color: "gray" }
};

const StarRating = ({ rating, onRatingChange, editable, dimension }) => {
  const [hover, setHover] = useState(0);

  const stars = [1, 2, 3, 4, 5].map((star) => {
    const fill = star <= (hover || rating);

    return (
      <button
        key={star}
        type="button"
        disabled={!editable}
        className={`transition-all duration-150 ${editable ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        onClick={() => editable && onRatingChange(dimension, star)}
        onMouseEnter={() => editable && setHover(star)}
        onMouseLeave={() => editable && setHover(0)}
      >
        <Star
          size={18}
          className={fill ? "text-gray-700 dark:text-zinc-300" : "text-gray-200 dark:text-zinc-700"}
          fill={fill ? "currentColor" : "none"}
          strokeWidth={fill ? 0 : 2}
        />
      </button>
    );
  });

  return <div className="flex items-center gap-0.5">{stars}</div>;
};

export default function StudentRatingSystem({
  studentId,
  ratings = {},
  onRatingChange,
  editable = true,
  isEditing: externalIsEditing = false
}) {
  const [internalEditing, setInternalEditing] = useState(false);
  const [tempRatings, setTempRatings] = useState({});
  const [tempComments, setTempComments] = useState({});

  const isEditing = externalIsEditing || internalEditing;

  const handleStartEdit = () => {
    setTempRatings({ ...ratings });
    setTempComments({
      behaviour: ratings.behaviour?.comment || "",
      academics: ratings.academics?.comment || "",
      extraCurricular: ratings.extraCurricular?.comment || "",
      attendance: ratings.attendance?.comment || "",
      discipline: ratings.discipline?.comment || ""
    });
    setInternalEditing(true);
  };

  const handleCancelEdit = () => {
    setTempRatings({});
    setTempComments({});
    setInternalEditing(false);
  };

  const handleRatingChange = (dimension, value) => {
    setTempRatings((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        rating: value,
        comment: prev[dimension]?.comment || ""
      }
    }));
  };

  const handleCommentChange = (dimension, comment) => {
    setTempRatings((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        rating: prev[dimension]?.rating || 0,
        comment
      }
    }));
    setTempComments((prev) => ({ ...prev, [dimension]: comment }));
  };

  const handleSave = () => {
    const hasEmptyRatings = RATING_DIMENSIONS.some(
      (dim) => !tempRatings[dim.key] || tempRatings[dim.key].rating === 0
    );

    if (hasEmptyRatings) {
      toast.error("Please rate all dimensions before saving");
      return;
    }

    onRatingChange(tempRatings);
    setInternalEditing(false);
    toast.success("Ratings updated successfully");
  };

  // Calculate overall rating
  const overallRating = useMemo(() => {
    const dimensionRatings = RATING_DIMENSIONS.map((dim) => {
      const ratingData = isEditing ? tempRatings[dim.key] : ratings[dim.key];
      return ratingData?.rating || 0;
    }).filter((r) => r > 0);

    if (dimensionRatings.length === 0) return 0;

    const sum = dimensionRatings.reduce((acc, rating) => acc + rating, 0);
    return (sum / dimensionRatings.length).toFixed(1);
  }, [ratings, tempRatings, isEditing]);

  // Get last updated date
  const lastUpdated = useMemo(() => {
    const dates = RATING_DIMENSIONS.map((dim) => {
      const ratingData = ratings[dim.key];
      return ratingData?.lastUpdated ? new Date(ratingData.lastUpdated) : null;
    }).filter((d) => d !== null);

    if (dates.length === 0) return null;

    const latestDate = new Date(Math.max(...dates));
    return latestDate;
  }, [ratings]);

  const currentRatings = isEditing ? tempRatings : ratings;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Award size={18} className="text-gray-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Student Rating</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Overall performance assessment</p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            {overallRating > 0 ? overallRating : "—"}
            <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">/ 5</span>
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
              <Clock size={12} />
              {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Rating Dimensions */}
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {RATING_DIMENSIONS.map((dimension) => {
          const ratingData = currentRatings[dimension.key];
          const rating = ratingData?.rating || 0;
          const comment = ratingData?.comment || "";
          const ratingInfo = RATING_LABELS[rating];
          const IconComponent = dimension.icon;

          return (
            <div key={dimension.key} className="px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <IconComponent size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{dimension.label}</p>
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <StarRating
                            rating={rating}
                            onRatingChange={handleRatingChange}
                            editable={isEditing}
                            dimension={dimension.key}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={star <= rating ? "text-gray-600 dark:text-zinc-400" : "text-gray-200 dark:text-zinc-700"}
                                  fill={star <= rating ? "currentColor" : "none"}
                                  strokeWidth={star <= rating ? 0 : 2}
                                />
                              ))}
                            </div>
                            {rating > 0 && (
                              <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{rating}.0</span>
                            )}
                          </div>
                        )}
                        {!isEditing && (
                          <span className="text-xs text-gray-400 dark:text-zinc-500 w-24 text-right">
                            {ratingInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Comment */}
                    {isEditing ? (
                      <div className="mt-3">
                        <Textarea
                          placeholder={`Add remarks...`}
                          value={tempComments[dimension.key] || ""}
                          onChange={(e) => handleCommentChange(dimension.key, e.target.value)}
                          minRows={2}
                          maxRows={3}
                          variant="bordered"
                          classNames={{
                            input: "text-xs",
                            base: "max-w-full"
                          }}
                        />
                      </div>
                    ) : comment ? (
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 truncate">"{comment}"</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {editable && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          {!isEditing ? (
            <Button
              size="sm"
              variant="flat"
              className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              startContent={<Edit3 size={14} />}
              onPress={handleStartEdit}
            >
              Edit Ratings
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="light"
                className="text-gray-500 dark:text-zinc-400"
                startContent={<X size={14} />}
                onPress={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800"
                startContent={<Save size={14} />}
                onPress={handleSave}
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}