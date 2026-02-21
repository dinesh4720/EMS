import StudentRatingSystem from './StudentRatingSystem';

// Example 1: Basic usage with default ratings
function Example1() {
  const [ratings, setRatings] = useState({});

  return (
    <StudentRatingSystem
      studentId="student-123"
      ratings={ratings}
      onRatingChange={setRatings}
      editable={true}
    />
  );
}

// Example 2: With existing ratings
function Example2() {
  const [ratings, setRatings] = useState({
    behaviour: { rating: 4, comment: "Excellent conduct in class", lastUpdated: "2024-01-15" },
    academics: { rating: 5, comment: "Consistently performs well", lastUpdated: "2024-01-15" },
    extraCurricular: { rating: 3, comment: "Participates in sports", lastUpdated: "2024-01-15" },
    attendance: { rating: 5, comment: "Perfect attendance", lastUpdated: "2024-01-15" },
    discipline: { rating: 4, comment: "Follows rules well", lastUpdated: "2024-01-15" }
  });

  return (
    <StudentRatingSystem
      studentId="student-456"
      ratings={ratings}
      onRatingChange={setRatings}
      editable={true}
    />
  );
}

// Example 3: Read-only view (for parents/students)
function Example3() {
  const ratings = {
    behaviour: { rating: 4, comment: "Excellent conduct", lastUpdated: "2024-01-15" },
    academics: { rating: 5, comment: "Top performer", lastUpdated: "2024-01-15" },
    extraCurricular: { rating: 3, comment: "Active in sports", lastUpdated: "2024-01-15" },
    attendance: { rating: 5, comment: "Always present", lastUpdated: "2024-01-15" },
    discipline: { rating: 4, comment: "Well behaved", lastUpdated: "2024-01-15" }
  };

  return (
    <StudentRatingSystem
      studentId="student-789"
      ratings={ratings}
      onRatingChange={() => {}} // Not used when not editable
      editable={false}
    />
  );
}

// Example 4: Controlled edit mode (external control)
function Example4() {
  const [ratings, setRatings] = useState({
    behaviour: { rating: 4, comment: "Great attitude" },
    academics: { rating: 5, comment: "Excellent work" },
    extraCurricular: { rating: 3, comment: "Participates actively" },
    attendance: { rating: 4, comment: "Good attendance" },
    discipline: { rating: 4, comment: "Follows rules" }
  });
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? "View Mode" : "Edit Mode"}
      </button>
      <StudentRatingSystem
        studentId="student-101"
        ratings={ratings}
        onRatingChange={setRatings}
        editable={true}
        isEditing={isEditing}
      />
    </div>
  );
}

// Example 5: Integration with API
function Example5() {
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ratings from API
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/students/${studentId}/ratings`);
        const data = await response.json();
        setRatings(data);
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [studentId]);

  const handleRatingChange = async (newRatings) => {
    try {
      const response = await fetch(`/api/students/${studentId}/ratings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRatings)
      });

      if (response.ok) {
        setRatings(newRatings);
        toast.success('Ratings updated successfully');
      }
    } catch (error) {
      console.error('Failed to update ratings:', error);
      toast.error('Failed to update ratings');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <StudentRatingSystem
      studentId="student-202"
      ratings={ratings}
      onRatingChange={handleRatingChange}
      editable={true}
    />
  );
}

export { Example1, Example2, Example3, Example4, Example5 };
