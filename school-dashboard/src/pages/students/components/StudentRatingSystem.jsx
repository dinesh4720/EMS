import { useState, useMemo } from "react";
import { Card, CardBody, Button, Textarea, Chip } from "@heroui/react";
import { Star, StarHalf, Award, Clock, TrendingUp, Edit3, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const RATING_DIMENSIONS = [
  { key: "behaviour", label: "Behaviour", icon: "🎯", description: "Conduct and attitude" },
  { key: "academics", label: "Academics", icon: "📚", description: "Subject performance" },
  { key: "extraCurricular", label: "Extra Curricular", icon: "🎨", description: "Activities & sports" },
  { key: "attendance", label: "Attendance", icon: "📅", description: "Presence record" },
  { key: "discipline", label: "Discipline", icon: "⚖️", description: "Rules adherence" }
];

const RATING_LABELS = {
  1: { text: "Needs Improvement", color: "danger" },
  2: { text: "Fair", color: "warning" },
  3: { text: "Good", color: "default" },
  4: { text: "Very Good", color: "success" },
  5: { text: "Excellent", color: "primary" }
};

const getRatingColor = (rating) => {
  if (rating >= 4) return "text-success";
  if (rating === 3) return "text-warning";
  return "text-danger";
};

const getRatingBgColor = (rating) => {
  if (rating >= 4) return "bg-success-50";
  if (rating === 3) return "bg-warning-50";
  return "bg-danger-50";
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
        className={`transition-all duration-200 ${
          editable ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={() => editable && onRatingChange(dimension, star)}
        onMouseEnter={() => editable && setHover(star)}
        onMouseLeave={() => editable && setHover(0)}
      >
        <Star
          size={editable ? 24 : 20}
          className={`${fill ? "text-gray-600" : "text-gray-200"} ${
            editable && star <= hover ? "" : ""
          }`}
          fill={fill ? "currentColor" : "none"}
          strokeWidth={fill ? 0 : 2}
        />
      </button>
    );
  });

  return <div className="flex items-center gap-1">{stars}</div>;
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

  // Initialize temp ratings when entering edit mode
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
    // Validate that all dimensions have ratings
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
    <Card className="border border-gray-200 overflow-hidden">
      <CardBody className="p-0">
        {/* Header Section */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <Award size={28} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Student Rating</h3>
                <p className="text-sm text-gray-500 mt-0.5">Overall performance assessment</p>
              </div>
            </div>

            {/* Overall Rating Badge */}
            <div
              className={`px-6 py-3 rounded-lg bg-white border border-gray-200 flex items-center gap-3 transition-all duration-300`}
            >
              <TrendingUp size={24} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Overall Rating
                </p>
                <p className={`text-2xl font-bold text-gray-900`}>
                  {overallRating > 0 ? overallRating : "—"}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ 5.0</span>
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <Clock size={14} />
              <span>Last updated: {lastUpdated.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}</span>
            </div>
          )}
        </div>

        {/* Rating Dimensions */}
        <div className="p-6 space-y-5">
          {RATING_DIMENSIONS.map((dimension, index) => {
            const ratingData = currentRatings[dimension.key];
            const rating = ratingData?.rating || 0;
            const comment = ratingData?.comment || "";
            const ratingInfo = RATING_LABELS[rating];

            return (
              <div
                key={dimension.key}
                className="group relative animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Dimension Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dimension.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{dimension.label}</h4>
                      <p className="text-xs text-gray-500">{dimension.description}</p>
                    </div>
                  </div>

                  {!isEditing && rating > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      className="font-medium bg-gray-100 text-gray-600"
                    >
                      {ratingInfo.text}
                    </Chip>
                  )}
                </div>

                {/* Stars Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <StarRating
                        rating={rating}
                        onRatingChange={handleRatingChange}
                        editable={isEditing}
                        dimension={dimension.key}
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {rating > 0 ? (
                          [1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={20}
                              className={
                                star <= rating ? "text-gray-600" : "text-gray-200"
                              }
                              fill={star <= rating ? "currentColor" : "none"}
                              strokeWidth={star <= rating ? 0 : 2}
                            />
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Not rated</span>
                        )}
                      </div>
                    )}

                    {rating > 0 && (
                      <span
                        className={`text-lg font-bold text-gray-900 ml-2`}
                      >
                        {rating}.0
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                {(isEditing || comment) && (
                  <div className="mt-3">
                    {isEditing ? (
                      <Textarea
                        placeholder={`Add remarks about ${dimension.label.toLowerCase()}...`}
                        value={tempComments[dimension.key] || ""}
                        onChange={(e) =>
                          handleCommentChange(dimension.key, e.target.value)
                        }
                        minRows={2}
                        maxRows={4}
                        variant="bordered"
                        classNames={{
                          input: "text-sm",
                          base: "max-w-full"
                        }}
                      />
                    ) : comment ? (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-600 italic">"{comment}"</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {/* Edit/Save Actions */}
          {editable && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              {!isEditing ? (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Edit3 size={16} />}
                  onPress={handleStartEdit}
                  className="font-medium"
                >
                  Edit Ratings
                </Button>
              ) : (
                <>
                  <Button
                    variant="flat"
                    color="default"
                    startContent={<X size={16} />}
                    onPress={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    startContent={<Save size={16} />}
                    onPress={handleSave}
                    className="font-medium"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
